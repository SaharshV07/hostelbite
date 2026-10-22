"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = require("./app");
const database_1 = require("./config/database");
const seed_1 = require("./db/seed");
const PORT = process.env.PORT || 5000;
// Initialize Database & seed if empty
try {
    database_1.db.initSchema();
    const userCount = database_1.db.queryOne(`SELECT COUNT(*) as count FROM users`)?.count || 0;
    if (userCount === 0) {
        console.log('[HostelBite] Empty database detected. Populating with initial MUJ seed data...');
        (0, seed_1.runSeed)();
    }
}
catch (err) {
    console.error('[HostelBite] Database initialization error:', err);
}
const server = app_1.app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` HostelBite API Server running on http://localhost:${PORT}`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
});
exports.default = server;
