import session from 'express-session';
import { vi, afterEach } from 'vitest';
import { mockDb, mockConnection } from './mocks/db.js';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-key-12345';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173,http://10.224.118.151:5173';
process.env.COOKIE_SECURE = 'false';

const memoryStore = new session.MemoryStore();

// Attach mocks globally for test mode
global.__mockDb = mockDb;
global.__mockSessionStore = memoryStore;

export { mockDb, mockConnection };

afterEach(() => {
  vi.clearAllMocks();
  mockConnection.query.mockReset().mockResolvedValue([[], []]);
  mockConnection.beginTransaction.mockReset().mockResolvedValue();
  mockConnection.commit.mockReset().mockResolvedValue();
  mockConnection.rollback.mockReset().mockResolvedValue();
  mockDb.query.mockReset().mockResolvedValue([[], []]);
  mockDb.getConnection.mockReset().mockResolvedValue(mockConnection);
});
