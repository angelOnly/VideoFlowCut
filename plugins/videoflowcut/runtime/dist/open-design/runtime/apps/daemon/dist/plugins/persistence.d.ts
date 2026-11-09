import type Database from 'better-sqlite3';
type SqliteDb = Database.Database;
export declare function migratePlugins(db: SqliteDb): void;
export {};
