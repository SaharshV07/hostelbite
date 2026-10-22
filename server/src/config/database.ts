import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DB_FILE = process.env.DB_FILE || path.resolve(__dirname, '../../hostelbite.db');

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: DatabaseSync;
  private inTransaction = false;

  private constructor() {
    const dbDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new DatabaseSync(DB_FILE);
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA journal_mode = WAL;');
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getRawDb(): DatabaseSync {
    return this.db;
  }

  public exec(sql: string): void {
    this.db.exec(sql);
  }

  public queryAll<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  public queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params);
    return result as T | undefined;
  }

  public execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number | bigint } {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: Number(result.changes),
      lastInsertRowid: result.lastInsertRowid
    };
  }

  public transaction<T>(callback: () => T): T {
    if (this.inTransaction) {
      return callback();
    }
    this.inTransaction = true;
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const result = callback();
      this.db.exec('COMMIT;');
      this.inTransaction = false;
      return result;
    } catch (error) {
      try {
        this.db.exec('ROLLBACK;');
      } catch (_) {
        // ignore rollback error if already rolled back
      }
      this.inTransaction = false;
      throw error;
    }
  }

  public initSchema(schemaPath?: string): void {
    const defaultSchema = path.resolve(__dirname, '../db/schema.sql');
    const targetPath = schemaPath || defaultSchema;
    if (fs.existsSync(targetPath)) {
      const schemaSql = fs.readFileSync(targetPath, 'utf8');
      this.db.exec(schemaSql);
    }
  }
}

export const db = DatabaseManager.getInstance();
