import { DatabaseSync } from 'node:sqlite';
import { Logger } from './Logger.ts';
import fs from 'node:fs';
import path from 'node:path';

class EchoDatabase {
    private db: DatabaseSync;
    private logger: Logger;

    //#region Init
    constructor(filename: string) {
        this.logger = new Logger();

        if (!filename) {
            throw new Error("Database filename must be provided");
        }

        this.initDb(filename);
        this.createTables();
        this.createPlaceholderRoom();
    }
    //#endregion

    //#region private methods
    private initDb(filename: string): void {
        this.logger.info(`Initializing database with file: ${filename}`);
        const dir = path.dirname(filename);
        if (!fs.existsSync(dir)) {
            this.logger.info(`Creating directory for database: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }

        this.db = new DatabaseSync(filename);

        if(!this.db) {
            throw new Error("Failed to initialize the database");
        }
    }

    private createTables(): void {
        try {
            this.logger.info("Creating database tables...");
            this.logger.info("Initializing users table");
            this.db.exec(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hashedIdentity TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL DEFAULT 'Anonymous',
                lastIP TEXT NOT NULL DEFAULT '0.0.0.0',
                lastLogin INTEGER NOT NULL DEFAULT current_timestamp,
                firstLogin INTEGER NOT NULL DEFAULT current_timestamp,
                img BLOB,
                online INTEGER NOT NULL DEFAULT 0,
                muted INTEGER NOT NULL DEFAULT 0,
                deaf INTEGER NOT NULL DEFAULT 0
            )`);

            this.logger.info("Initializing rooms table");
            this.db.exec(`CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL DEFAULT 'Room name',
                description TEXT NOT NULL DEFAULT 'Room description',
                maxUsers INTEGER NOT NULL DEFAULT 200,
                img BLOB,
                bannerImg BLOB,
                orderIndex INTEGER NOT NULL UNIQUE
            )`);

            this.logger.info("Initializing roomUsers table");
            this.db.exec(`CREATE TABLE IF NOT EXISTS roomUsers (
                userId TEXT,
                roomId INTEGER,
                PRIMARY KEY (userId, roomId),
                FOREIGN KEY (userId) REFERENCES users(hashedIdentity),
                FOREIGN KEY (roomId) REFERENCES rooms(id)
            )`);
        } catch (err) {
            this.logger.error("Error creating tables", err);
        }
    }

    private createPlaceholderRoom():void {
        try {
            this.logger.info("Creating placeholder room");
            const stmt = this.db.prepare("SELECT COUNT(id) as count FROM rooms");
            const result = stmt.get();

            if (result && result.count === 0) {
                this.logger.info("Inserting placeholder room");
                this.db.exec(`INSERT INTO rooms (id, name, description, maxUsers, orderIndex) VALUES (0, 'Placeholder Room', 'This is a placeholder room.', 200, 1)`);
            } else {
                this.logger.info("Placeholder room already exists");
            }
        } catch (err) {
            this.logger.error("Error creating placeholder room", err);
        }
    }
    //#endregion

    //#region public methods
    public GetDb(): DatabaseSync {
        if (!this.db) {
            throw new Error("Database is not initialized");
        }
        return this.db;
    }

    public Close(): void {
        if (this.db) {
            this.logger.info("Closing database connection...");
            this.db.close();
        } else {
            this.logger.warn("Database is already closed or not initialized");
        }
    }
    //#endregion
}

export default EchoDatabase;