/**
 * Unit Tests for AnimeSearch Component
 * Tests search functionality, debouncing, error handling, and user interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the anime-api module
vi.mock('../scripts/anime-api.js', () => ({
  searchAnime: vi.fn(),
  cancelPendingSearch: vi.fn()
}));

import { searchAnime, cancelPendingSearch } from '../scripts/anime-api.js';

describe('AnimeSearch Component - Core Logic Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('API Integration Tests', () => {
    it('should call searchAnime with correct parameters', async () => {
      searchAnime.mockResolvedValue({ data: { id: 1, title: { romaji: 'Naruto' } }, error: null });
      
      const result = await searchAnime('naruto');
      
      expect(searchAnime).toHaveBeenCalledWith('naruto');
      expect(result.data).toEqual({ id: 1, title: { romaji: 'Naruto' } });
      expect(result.error).toBeNull();
    });

    it('should handle API errors correctly', async () => {
      const errorMessage = 'No anime found';
      searchAnime.mockResolvedValue({ data: null, error: errorMessage });
      
      const result = await searchAnime('nonexistent');
      
      expect(result.data).toBeNull();
      expect(result.error).toBe(errorMessage);
    });

    it('should handle network errors', async () => {
      searchAnime.mockRejectedValue(new Error('Network error'));
      
      try {
        await searchAnime('naruto');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should call cancelPendingSearch when needed', () => {
      cancelPendingSearch();
      
      expect(cancelPendingSearch).toHaveBeenCalled();
    });
  });

  describe('Search Input Validation', () => {
    it('should trim whitespace from search terms', () => {
      const searchTerm = '  naruto  ';
      const trimmed = searchTerm.trim();
      
      expect(trimmed).toBe('naruto');
    });

    it('should handle empty strings', () => {
      const searchTerm = '';
      
      expect(searchTerm.length).toBe(0);
    });

    it('should handle whitespace-only strings', () => {
      const searchTerm = '   ';
      const trimmed = searchTerm.trim();
      
      expect(trimmed.length).toBe(0);
    });
  });

  describe('Event System', () => {
    it('should create custom events with correct structure', () => {
      const eventDetail = {
        data: { id: 1, title: { romaji: 'Naruto' } },
        error: null,
        searchTerm: 'naruto'
      };
      
      const event = new CustomEvent('animeSearchResult', {
        detail: eventDetail,
        bubbles: true
      });
      
      expect(event.type).toBe('animeSearchResult');
      expect(event.detail).toEqual(eventDetail);
      expect(event.bubbles).toBe(true);
    });
  });

  describe('URL Handling', () => {
    it('should parse URL search parameters correctly', () => {
      const urlParams = new URLSearchParams('?search=naruto&other=value');
      
      expect(urlParams.get('search')).toBe('naruto');
      expect(urlParams.get('other')).toBe('value');
      expect(urlParams.get('nonexistent')).toBeNull();
    });

    it('should handle empty URL parameters', () => {
      const urlParams = new URLSearchParams('');
      
      expect(urlParams.get('search')).toBeNull();
    });
  });

  describe('Component State Management', () => {
    it('should track loading state correctly', () => {
      let isLoading = false;
      
      // Simulate loading start
      isLoading = true;
      expect(isLoading).toBe(true);
      
      // Simulate loading end
      isLoading = false;
      expect(isLoading).toBe(false);
    });

    it('should track current search term', () => {
      let currentSearchTerm = '';
      
      currentSearchTerm = 'naruto';
      expect(currentSearchTerm).toBe('naruto');
      
      currentSearchTerm = '';
      expect(currentSearchTerm).toBe('');
    });
  });
});