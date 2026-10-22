import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { generateToken, requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { User, UserRole } from '../types';

export const authRouter = Router();

// Track failed login attempts for lockout protection (NFR-SEC-06, FR-AUTH-06)
const failedAttempts = new Map<string, { count: number; lockedUntil?: number }>();

// Helper to remove password_hash
function sanitizeUser(user: User): Omit<User, 'password_hash'> {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// 1. Register
authRouter.post('/register', async (req, res, next) => {
  try {
    const { name, email, mobile, password, role = 'student', hostelBlock, floor, roomNumber } = req.body;

    if (!name || !email || !mobile || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name, email, mobile, and password are required.' }
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' }
      });
      return;
    }

    const existing = db.queryOne<User>(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email address already exists.' }
      });
      return;
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const validRole: UserRole = ['student', 'vendor', 'delivery'].includes(role) ? role : 'student';

    db.execute(
      `INSERT INTO users (id, name, email, mobile, password_hash, role, hostel_block, floor, room_number, wallet_balance, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 'active')`,
      [
        userId,
        name.trim(),
        email.toLowerCase().trim(),
        mobile.trim(),
        passwordHash,
        validRole,
        hostelBlock || null,
        floor || null,
        roomNumber || null
      ]
    );

    const createdUser = db.queryOne<User>(`SELECT * FROM users WHERE id = ?`, [userId])!;
    const token = generateToken({
      userId: createdUser.id,
      role: createdUser.role,
      email: createdUser.email,
      name: createdUser.name
    });

    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(createdUser),
        token,
        otpNote: 'Demo mode: Email & mobile OTP automatically verified.'
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. Login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' }
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const attemptRecord = failedAttempts.get(normalizedEmail);
    const now = Date.now();

    if (attemptRecord?.lockedUntil && attemptRecord.lockedUntil > now) {
      const waitMinutes = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
      res.status(429).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Account is temporarily locked due to 5 consecutive failed login attempts. Please try again in ${waitMinutes} minutes.`
        }
      });
      return;
    }

    const user = db.queryOne<User>(`SELECT * FROM users WHERE email = ?`, [normalizedEmail]);
    if (!user || !user.password_hash) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const currentCount = (attemptRecord?.count || 0) + 1;
      if (currentCount >= 5) {
        failedAttempts.set(normalizedEmail, { count: currentCount, lockedUntil: now + 15 * 60 * 1000 });
        res.status(429).json({
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Too many failed login attempts. Account locked for 15 minutes.'
          }
        });
        return;
      }
      failedAttempts.set(normalizedEmail, { count: currentCount });
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
      return;
    }

    // Reset failed attempts on success
    failedAttempts.delete(normalizedEmail);

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by the Hostel Administrator.' }
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    });

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token
      }
    });
  } catch (err) {
    next(err);
  }
});

// 3. Demo One-Click Login
authRouter.post('/demo-login', async (req, res, next) => {
  try {
    const { role = 'student', outlet } = req.body;

    let targetEmail = 'student@muj.manipal.edu';
    if (role === 'vendor') {
      targetEmail = outlet === 'munchbox' ? 'munchbox@muj.manipal.edu' : 'mess@muj.manipal.edu';
    } else if (role === 'delivery') {
      targetEmail = 'delivery@muj.manipal.edu';
    } else if (role === 'admin') {
      targetEmail = 'admin@muj.manipal.edu';
    }

    const user = db.queryOne<User>(`SELECT * FROM users WHERE email = ?`, [targetEmail]);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: `Demo account for ${role} not found. Please run seed script.` }
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    });

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token
      }
    });
  } catch (err) {
    next(err);
  }
});

// 4. Current User Profile
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = db.queryOne<User>(`SELECT * FROM users WHERE id = ?`, [req.user!.userId]);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User profile not found.' }
      });
      return;
    }

    res.json({
      success: true,
      data: { user: sanitizeUser(user) }
    });
  } catch (err) {
    next(err);
  }
});

// 5. Update Profile (Hostel Block & Room)
authRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { name, mobile, hostelBlock, floor, roomNumber } = req.body;
    const userId = req.user!.userId;

    db.execute(
      `UPDATE users SET
         name = COALESCE(?, name),
         mobile = COALESCE(?, mobile),
         hostel_block = COALESCE(?, hostel_block),
         floor = COALESCE(?, floor),
         room_number = COALESCE(?, room_number)
       WHERE id = ?`,
      [name, mobile, hostelBlock, floor, roomNumber, userId]
    );

    const updated = db.queryOne<User>(`SELECT * FROM users WHERE id = ?`, [userId])!;
    res.json({
      success: true,
      data: { user: sanitizeUser(updated) }
    });
  } catch (err) {
    next(err);
  }
});

// 6. Simulated Password Reset
authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { email, newPassword, simulatedOtp } = req.body;
    if (!email || !newPassword) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and new password are required.' }
      });
      return;
    }

    const user = db.queryOne<User>(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'No registered user found with that email address.' }
      });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    db.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, user.id]);

    res.json({
      success: true,
      message: 'Password reset successfully (simulated development OTP verified).'
    });
  } catch (err) {
    next(err);
  }
});
