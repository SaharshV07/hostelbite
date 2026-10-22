"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.DatabaseManager = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_sqlite_1 = require("node:sqlite");
const DB_FILE = process.env.DB_FILE || node_path_1.default.resolve(__dirname, '../../hostelbite.db');
class DatabaseManager {
    static instance;
    db;
    inTransaction = false;
    constructor() {
        const dbDir = node_path_1.default.dirname(DB_FILE);
        if (!node_fs_1.default.existsSync(dbDir)) {
            node_fs_1.default.mkdirSync(dbDir, { recursive: true });
        }
        this.db = new node_sqlite_1.DatabaseSync(DB_FILE);
        this.db.exec('PRAGMA foreign_keys = ON;');
        this.db.exec('PRAGMA journal_mode = WAL;');
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    getRawDb() {
        return this.db;
    }
    exec(sql) {
        this.db.exec(sql);
    }
    queryAll(sql, params = []) {
        const stmt = this.db.prepare(sql);
        return stmt.all(...params);
    }
    queryOne(sql, params = []) {
        const stmt = this.db.prepare(sql);
        const result = stmt.get(...params);
        return result;
    }
    execute(sql, params = []) {
        const stmt = this.db.prepare(sql);
        const result = stmt.run(...params);
        return {
            changes: Number(result.changes),
            lastInsertRowid: result.lastInsertRowid
        };
    }
    transaction(callback) {
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
        }
        catch (error) {
            try {
                this.db.exec('ROLLBACK;');
            }
            catch (_) {
                // ignore rollback error if already rolled back
            }
            this.inTransaction = false;
            throw error;
        }
    }
    initSchema(schemaPath) {
        const defaultSchema = node_path_1.default.resolve(__dirname, '../db/schema.sql');
        const targetPath = schemaPath || defaultSchema;
        if (node_fs_1.default.existsSync(targetPath)) {
            const schemaSql = node_fs_1.default.readFileSync(targetPath, 'utf8');
            this.db.exec(schemaSql);
        }
    }
}
exports.DatabaseManager = DatabaseManager;
exports.db = DatabaseManager.getInstance();
