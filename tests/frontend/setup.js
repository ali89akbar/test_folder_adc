import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Safe default mock for global.fetch so relative URLs like '/api/entries' do not throw in jsdom/Node
global.fetch = vi.fn().mockImplementation(async (input) => {
  return {
    ok: true,
    status: 200,
    json: async () => [],
    text: async () => '',
    blob: async () => new Blob(),
    headers: new Headers(),
  };
});

// Automatically clean up React DOM after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock browser globals not present in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

window.scrollTo = vi.fn();

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
