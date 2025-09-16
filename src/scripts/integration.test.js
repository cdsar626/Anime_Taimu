/**
 * Integration Tests for Time Calculator with Anime API
 * Tests the integration between anime API data and time calculation
 */

import { describe, test, expect } from 'vitest';
import { createTimeCalculator, canCalculateTime } from './time-calculator.js';
import { canCalculateTime as apiCanCalculateTime } from './anime-api.js';

describe('Time Calculator Integration', () => {
  test('should work with typical anime API response', () => {
    const mockAnimeData = {
      id: 16498,
      title: {
        romaji: "Shingeki no Kyojin",
        english: "Attack on Titan",
        native: "進撃の巨人"
      },
      coverImage: {
        large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg",
        medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx16498-C6FPmWm59CyP.jpg"
      },
      episodes: 25,
      duration: 24,
      status: "FINISHED",
      description: "Several hundred years ago, humans were nearly exterminated by Titans..."
    };

    const calculator = createTimeCalculator();
    
    // Verify both validation functions agree
    expect(canCalculateTime(mockAnimeData)).toBe(true);
    expect(apiCanCalculateTime(mockAnimeData)).toBe(true);

    // Update calculator with anime data
    calculator.updateAnime(mockAnimeData);
    
    const result = calculator.getCurrentResult();
    expect(result).not.toBeNull();
    expect(result.totalMinutes).toBe(600); // 25 * 24
    expect(result.formattedTime).toBe('10 hours');
    
    // Test with opening and ending themes
    calculator.setThemeInclusion(true, true);
    const resultWithThemes = calculator.getCurrentResult();
    expect(resultWithThemes.totalMinutes).toBe(675); // 600 + (25 * 1.5 * 2)
    expect(resultWithThemes.formattedTime).toBe('11 hours 15 minutes');
  });

  test('should handle anime with missing duration', () => {
    const mockAnimeData = {
      id: 12345,
      title: {
        romaji: "Test Anime",
        english: null,
        native: "テストアニメ"
      },
      coverImage: {
        large: "",
        medium: ""
      },
      episodes: 12,
      duration: null, // Missing duration
      status: "FINISHED"
    };

    const calculator = createTimeCalculator();
    calculator.updateAnime(mockAnimeData);
    
    const result = calculator.getCurrentResult();
    expect(result).not.toBeNull();
    expect(result.totalMinutes).toBe(288); // 12 * 24 (default)
    expect(result.breakdown.episodeDuration).toBe(24); // Should use default
  });

  test('should handle anime with zero episodes', () => {
    const mockAnimeData = {
      id: 12345,
      title: {
        romaji: "Test Anime",
        english: null,
        native: "テストアニメ"
      },
      episodes: 0, // No episodes
      duration: 24,
      status: "NOT_YET_RELEASED"
    };

    const calculator = createTimeCalculator();
    
    // Verify validation functions
    expect(canCalculateTime(mockAnimeData)).toBe(false);
    expect(apiCanCalculateTime(mockAnimeData)).toBe(false);

    calculator.updateAnime(mockAnimeData);
    
    const result = calculator.getCurrentResult();
    expect(result).toBeNull(); // Should be null for invalid data
  });

  test('should handle real-world anime scenarios', () => {
    const scenarios = [
      {
        name: 'Short anime series',
        data: { episodes: 12, duration: 24 },
        expectedMinutes: 288,
        expectedFormatted: '4 hours 48 minutes'
      },
      {
        name: 'Long-running anime',
        data: { episodes: 366, duration: 24 },
        expectedMinutes: 8784,
        expectedFormatted: '146 hours 24 minutes'
      },
      {
        name: 'Movie-length episodes',
        data: { episodes: 6, duration: 45 },
        expectedMinutes: 270,
        expectedFormatted: '4 hours 30 minutes'
      },
      {
        name: 'Short-form anime',
        data: { episodes: 24, duration: 3 },
        expectedMinutes: 72,
        expectedFormatted: '1 hour 12 minutes'
      }
    ];

    scenarios.forEach(scenario => {
      const calculator = createTimeCalculator();
      calculator.updateAnime(scenario.data);
      
      const result = calculator.getCurrentResult();
      expect(result, `Failed for ${scenario.name}`).not.toBeNull();
      expect(result.totalMinutes, `Wrong minutes for ${scenario.name}`).toBe(scenario.expectedMinutes);
      expect(result.formattedTime, `Wrong format for ${scenario.name}`).toBe(scenario.expectedFormatted);
    });
  });

  test('should handle calculator state changes correctly', () => {
    const calculator = createTimeCalculator();
    const stateChanges = [];
    
    calculator.addChangeListener((result, options) => {
      stateChanges.push({
        hasResult: result !== null,
        episodes: options.episodes,
        includeOpening: options.includeOpening,
        includeEnding: options.includeEnding,
        formattedTime: result?.formattedTime || null
      });
    });

    // Initial state
    expect(stateChanges[0]).toEqual({
      hasResult: false,
      episodes: 0,
      includeOpening: false,
      includeEnding: false,
      formattedTime: null
    });

    // Load anime
    calculator.updateAnime({ episodes: 12, duration: 24 });
    expect(stateChanges[1]).toEqual({
      hasResult: true,
      episodes: 12,
      includeOpening: false,
      includeEnding: false,
      formattedTime: '4 hours 48 minutes'
    });

    // Toggle opening
    calculator.setIncludeOpening(true);
    expect(stateChanges[2]).toEqual({
      hasResult: true,
      episodes: 12,
      includeOpening: true,
      includeEnding: false,
      formattedTime: '5 hours 6 minutes'
    });

    // Toggle ending
    calculator.setIncludeEnding(true);
    expect(stateChanges[3]).toEqual({
      hasResult: true,
      episodes: 12,
      includeOpening: true,
      includeEnding: true,
      formattedTime: '5 hours 24 minutes'
    });

    // Reset
    calculator.reset();
    expect(stateChanges[4]).toEqual({
      hasResult: false,
      episodes: 0,
      includeOpening: false,
      includeEnding: false,
      formattedTime: null
    });
  });
});