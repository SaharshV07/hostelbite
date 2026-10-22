"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'An unexpected error occurred.';
    if (process.env.NODE_ENV !== 'test' && statusCode === 500) {
        console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
    }
    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message,
            details: err.details || null
        }
    });
}
