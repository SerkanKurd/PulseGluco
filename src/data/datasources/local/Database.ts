import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export class AppDatabase {
  private static instance: AppDatabase;
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  public static getInstance(): AppDatabase {
    if (!AppDatabase.instance) {
      AppDatabase.instance = new AppDatabase();
    }
    return AppDatabase.instance;
  }

  /**
   * Initializes SQLite database, creates tables, and executes migrations
   */
  public async getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
    if (this.db && this.initialized) {
      return this.db;
    }

    try {
      this.db = await SQLite.openDatabaseAsync('pulsegluco.db');
      await this.runMigrations(this.db);
      this.initialized = true;
      return this.db;
    } catch (err) {
      console.warn('SQLite initialization failed (falling back to memory storage):', err);
      return null;
    }
  }

  private async runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
    try {
      // WAL mode is supported on native Android/iOS
      if (Platform.OS !== 'web') {
        await db.execAsync('PRAGMA journal_mode = WAL;');
        await db.execAsync('PRAGMA foreign_keys = ON;');
      }
    } catch (pragmaErr) {
      console.warn('PRAGMA notice:', pragmaErr);
    }

    // Create tables and indexes
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS health_records (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        device_type TEXT NOT NULL,
        systolic REAL,
        diastolic REAL,
        pulse REAL,
        glucose_value REAL,
        glucose_unit TEXT,
        meal_tag TEXT,
        status_key TEXT NOT NULL,
        source TEXT NOT NULL,
        ocr_confidence REAL,
        raw_ocr_text TEXT,
        image_uri TEXT,
        notes TEXT,
        is_synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_health_records_timestamp ON health_records(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_health_records_device_type ON health_records(device_type);
    `);
  }
}

export const appDatabase = AppDatabase.getInstance();
