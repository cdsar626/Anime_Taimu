/**
 * Test Setup for Vitest
 * Configures global test environment and mocks
 */

import { vi } from 'vitest';

// Mock window.location for URL testing
Object.defineProperty(window, 'location', {
  value: {
    search: '',
    href: 'http://localhost',
    origin: 'http://localhost'
  },
  writable: true
});

// Mock window.history for navigation testing
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn(),
    pushState: vi.fn()
  },
  writable: true
});

// Mock console methods to reduce test noise
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn()
};