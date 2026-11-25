jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import { migrateDatabase, DATABASE_VERSION } from '../src/data/datasources/local/Database';

const makeDb = (userVersion: number) => {
  const statements: string[] = [];
  const db = {
    statements,
    getFirstAsync: jest.fn(async () => ({ user_version: userVersion })),
    execAsync: jest.fn(async (sql: string) => {
      statements.push(sql);
    }),
    runAsync: jest.fn(async (sql: string) => {
      statements.push(sql);
      return { changes: 0, lastInsertRowId: 0 };
    }),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  };
  return db;
};

describe('Database migrations', () => {
  it('upgrades a fresh / legacy database to the current version', async () => {
    const db = makeDb(0);
    await migrateDatabase(db as any);

    const sql = db.statements.join('\n');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS health_records');
    expect(sql).toMatch(/DELETE FROM health_records WHERE device_type NOT IN \('BLOOD_PRESSURE', 'BLOOD_GLUCOSE'\)/);
    expect(sql).toContain("id LIKE '%-demo-%'");
    expect(sql).toContain(`PRAGMA user_version = ${DATABASE_VERSION}`);
    expect(db.withTransactionAsync).toHaveBeenCalledTimes(DATABASE_VERSION);
  });

  it('does nothing when already up to date', async () => {
    const db = makeDb(DATABASE_VERSION);
    await migrateDatabase(db as any);
    expect(db.statements).toHaveLength(0);
    expect(db.withTransactionAsync).not.toHaveBeenCalled();
  });
});
