/**
 * Basic tests for AniList API integration module
 * These tests verify the core functionality without making actual API calls
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  searchAnime, 
  cancelPendingSearch, 
  getDefaultEpisodeDuration, 
  canCalculateTime 
} from './anime-api.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('AniList API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cancelPendingSearch(); // Clear any pending requests
  });

  describe('getDefaultEpisodeDuration', () => {
    test('should return 24 minutes as default duration', () => {
      expect(getDefaultEpisodeDuration()).toBe(24);
    });
  });

  describe('canCalculateTime', () => {
    test('should return true for anime with valid episode count', () => {
      const anime = {
        id: 1,
        title: { romaji: 'Test', english: null, native: 'Test' },
        coverImage: { large: '', medium: '' },
        episodes: 12,
        duration: 24,
        status: 'FINISHED',
        description: null
      };
      
      expect(canCalculateTime(anime)).toBe(true);
    });

    test('should return false for anime without episode count', () => {
      const anime = {
        id: 1,
        title: { romaji: 'Test', english: null, native: 'Test' },
        coverImage: { large: '', medium: '' },
        episodes: null,
        duration: 24,
        status: 'FINISHED',
        description: null
      };
      
      expect(canCalculateTime(anime)).toBe(false);
    });

    test('should return false for null anime', () => {
      expect(canCalculateTime(null)).toBe(false);
    });
  });

  describe('cancelPendingSearch', () => {
    test('should cancel pending search without errors', () => {
      expect(() => cancelPendingSearch()).not.toThrow();
    });
  });

  describe('searchAnime', () => {
    test('should return error for empty search term', async () => {
      const result = await searchAnime('');
      expect(result.data).toBeNull();
      expect(result.error).toBe('Please enter an anime title to search.');
    });

    test('should return error for search term less than 2 characters', async () => {
      const result = await searchAnime('a');
      expect(result.data).toBeNull();
      expect(result.error).toBe('Please enter at least 2 characters to search.');
    });
  });
});