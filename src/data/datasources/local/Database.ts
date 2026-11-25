import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

/**
 * Schema version stored in `PRAGMA user_version`.
 * Bump it and add a step to `MIGRATIONS` whenever the schema or stored data must change.
 */
export const DATABASE_VERSION = 1;

type Migration = (db: SQLite.SQLiteDatabase) => Promise<void>;

/**
 * MIGRATIONS[n] upgrades the database from version n to n + 1.
 * Each step runs in its own transaction.
 */
const MIGRATIONS: Migration[] = [
  // 0 -> 1: initial schema; drop data outside the product scope.
  async (db) => {
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

    // Standalone pulse / oximeter readings are no longer supported.
    await db.runAsync(`DELETE FROM health_records WHERE device_type NOT IN ('BLOOD_PRESSURE', 'BLOOD_GLUCOSE')`);
    // Demo records that older builds wrote into the real logbook.
    await db.runAsync(`DELETE FROM health_records WHERE id LIKE '%-demo-%'`);
    // Cloud fallback was removed; such readings were confirmed by the user like any other OCR reading.
    await db.runAsync(`UPDATE health_records SET source = 'OCR_AUTO' WHERE source = 'OCR_FALLBACK'`);
  },
];

export async function migrateDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  while (currentVersion < DATABASE_VERSION) {
    const step = MIGRATIONS[currentVersion];
    const nextVersion = currentVersion + 1;
    await db.withTransactionAsync(async () => {
      await step(db);
      await db.execAsync(`PRAGMA user_version = ${nextVersion}`);
    });
    currentVersion = nextVersion;
  }
}

export class AppDatabase {
  private static instance: AppDatabase;
  private db: SQLite.SQLiteDatabase | null = null;
  private opening: Promise<SQLite.SQLiteDatabase | null> | null = null;

  public static getInstance(): AppDatabase {
    if (!AppDatabase.instance) {
      AppDatabase.instance = new AppDatabase();
    }
    return AppDatabase.instance;
  }

  /**
   * Opens the database and runs pending migrations once. Concurrent callers share the same promise.
   */
  public async getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
    if (this.db) return this.db;
    if (!this.opening) {
      this.opening = this.open();
    }
    return this.opening;
  }

  private async open(): Promise<SQLite.SQLiteDatabase | null> {
    try {
      const db = await SQLite.openDatabaseAsync('pulsegluco.db');
      if (Platform.OS !== 'web') {
        try {
          await db.execAsync('PRAGMA journal_mode = WAL;');
        } catch (pragmaErr) {
          console.warn('PRAGMA notice:', pragmaErr);
        }
      }
      await migrateDatabase(db);
      this.db = db;
      return db;
    } catch (err) {
      console.warn('SQLite initialization failed (falling back to memory storage):', err);
      this.opening = null;
      return null;
    }
  }
}

export const appDatabase = AppDatabase.getInstance();
