import { vi } from 'vitest';

export const mockConnection = {
  beginTransaction: vi.fn().mockResolvedValue(),
  query: vi.fn().mockResolvedValue([[], []]),
  commit: vi.fn().mockResolvedValue(),
  rollback: vi.fn().mockResolvedValue(),
  release: vi.fn(),
};

export const mockDb = {
  query: vi.fn().mockResolvedValue([[], []]),
  execute: vi.fn().mockResolvedValue([[], []]),
  getConnection: vi.fn().mockResolvedValue(mockConnection),
};

export default mockDb;
