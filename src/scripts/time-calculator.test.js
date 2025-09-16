/**
 * Unit Tests for Time Calculation Engine
 * Tests core time calculation logic, formatting, and edge cases
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  formatTime,
  calculateWatchTime,
  createTimeCalculator,
  getDefaultEpisodeDuration,
  getThemeDurations,
  canCalculateTime
} from './time-calculator.js';

describe('formatTime', () => {
  test('should format time under 60 minutes correctly', () => {
    expect(formatTime(0)).toBe('0 minutes');
    expect(formatTime(1)).toBe('1 minute');
    expect(formatTime(30)).toBe('30 minutes');
    expect(formatTime(59)).toBe('59 minutes');
  });

  test('should format time over 60 minutes correctly', () => {
    expect(formatTime(60)).toBe('1 hour');
    expect(formatTime(61)).toBe('1 hour 1 minute');
    expect(formatTime(90)).toBe('1 hour 30 minutes');
    expect(formatTime(120)).toBe('2 hours');
    expect(formatTime(150)).toBe('2 hours 30 minutes');
  });

  test('should handle large time values', () => {
    expect(formatTime(1440)).toBe('24 hours'); // 1 day
    expect(formatTime(1500)).toBe('25 hours'); // 25 hours
    expect(formatTime(3600)).toBe('60 hours'); // 60 hours
  });

  test('should round fractional minutes', () => {
    expect(formatTime(59.4)).toBe('59 minutes');
    expect(formatTime(59.5)).toBe('1 hour');
    expect(formatTime(59.6)).toBe('1 hour');
    expect(formatTime(90.3)).toBe('1 hour 30 minutes');
    expect(formatTime(90.7)).toBe('1 hour 31 minutes');
  });

  test('should handle edge cases', () => {
    expect(formatTime(-1)).toBe('0 minutes');
    expect(formatTime(null)).toBe('0 minutes');
    expect(formatTime(undefined)).toBe('0 minutes');
    expect(formatTime('invalid')).toBe('0 minutes');
  });
});

describe('calculateWatchTime', () => {
  test('should calculate basic watch time correctly', () => {
    const result = calculateWatchTime({
      episodes: 12,
      episodeDuration: 24,
      includeOpening: false,
      includeEnding: false
    });

    expect(result.baseMinutes).toBe(288); // 12 * 24
    expect(result.openingMinutes).toBe(0);
    expect(result.endingMinutes).toBe(0);
    expect(result.totalMinutes).toBe(288);
    expect(result.formattedTime).toBe('4 hours 48 minutes');
  });

  test('should include opening themes when specified', () => {
    const result = calculateWatchTime({
      episodes: 12,
      episodeDuration: 24,
      includeOpening: true,
      includeEnding: false
    });

    expect(result.baseMinutes).toBe(288); // 12 * 24
    expect(result.openingMinutes).toBe(18); // 12 * 1.5
    expect(result.endingMinutes).toBe(0);
    expect(result.totalMinutes).toBe(306); // 288 + 18
    expect(result.formattedTime).toBe('5 hours 6 minutes');
  });

  test('should include ending themes when specified', () => {
    const result = calculateWatchTime({
      episodes: 12,
      episodeDuration: 24,
      includeOpening: false,
      includeEnding: true
    });

    expect(result.baseMinutes).toBe(288);
    expect(result.openingMinutes).toBe(0);
    expect(result.endingMinutes).toBe(18); // 12 * 1.5
    expect(result.totalMinutes).toBe(306);
    expect(result.formattedTime).toBe('5 hours 6 minutes');
  });

  test('should include both opening and ending themes', () => {
    const result = calculateWatchTime({
      episodes: 12,
      episodeDuration: 24,
      includeOpening: true,
      includeEnding: true
    });

    expect(result.baseMinutes).toBe(288);
    expect(result.openingMinutes).toBe(18);
    expect(result.endingMinutes).toBe(18);
    expect(result.totalMinutes).toBe(324); // 288 + 18 + 18
    expect(result.formattedTime).toBe('5 hours 24 minutes');
  });

  test('should use default episode duration when not provided', () => {
    const result = calculateWatchTime({
      episodes: 12,
      includeOpening: false,
      includeEnding: false
    });

    expect(result.baseMinutes).toBe(288); // 12 * 24 (default)
    expect(result.breakdown.episodeDuration).toBe(24);
  });

  test('should handle edge case: single episode', () => {
    const result = calculateWatchTime({
      episodes: 1,
      episodeDuration: 24,
      includeOpening: true,
      includeEnding: true
    });

    expect(result.baseMinutes).toBe(24);
    expect(result.openingMinutes).toBe(1.5);
    expect(result.endingMinutes).toBe(1.5);
    expect(result.totalMinutes).toBe(27);
    expect(result.formattedTime).toBe('27 minutes');
  });

  test('should handle edge case: very short episodes', () => {
    const result = calculateWatchTime({
      episodes: 10,
      episodeDuration: 5, // 5-minute episodes
      includeOpening: false,
      includeEnding: false
    });

    expect(result.baseMinutes).toBe(50);
    expect(result.totalMinutes).toBe(50);
    expect(result.formattedTime).toBe('50 minutes');
  });

  test('should handle edge case: episodes under 60 minutes total', () => {
    const result = calculateWatchTime({
      episodes: 2,
      episodeDuration: 25,
      includeOpening: false,
      includeEnding: false
    });

    expect(result.totalMinutes).toBe(50);
    expect(result.formattedTime).toBe('50 minutes');
  });

  test('should create proper breakdown object', () => {
    const result = calculateWatchTime({
      episodes: 12,
      episodeDuration: 24,
      includeOpening: true,
      includeEnding: false
    });

    expect(result.breakdown).toEqual({
      episodes: 12,
      episodeDuration: 24,
      baseTime: '4 hours 48 minutes',
      openingTime: '18 minutes',
      endingTime: null,
      includeOpening: true,
      includeEnding: false
    });
  });

  test('should throw error for invalid input', () => {
    expect(() => calculateWatchTime(null)).toThrow('Invalid calculation options provided');
    expect(() => calculateWatchTime({})).toThrow('Episodes must be a non-negative number');
    expect(() => calculateWatchTime({ episodes: -1 })).toThrow('Episodes must be a non-negative number');
    expect(() => calculateWatchTime({ episodes: 0 })).toThrow('Cannot calculate time for anime with 0 episodes');
    expect(() => calculateWatchTime({ episodes: 12, episodeDuration: -1 })).toThrow('Episode duration must be a positive number');
  });

  test('should handle reasonable limits', () => {
    expect(() => calculateWatchTime({ episodes: 10001, episodeDuration: 24 }))
      .toThrow('Episode count exceeds reasonable limit');
    expect(() => calculateWatchTime({ episodes: 12, episodeDuration: 1441 }))
      .toThrow('Episode duration exceeds reasonable limit');
  });
});

describe('createTimeCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = createTimeCalculator();
  });

  test('should initialize with default options', () => {
    const options = calculator.getCurrentOptions();
    expect(options.episodes).toBe(0);
    expect(options.episodeDuration).toBe(24);
    expect(options.includeOpening).toBe(false);
    expect(options.includeEnding).toBe(false);
  });

  test('should initialize with custom options', () => {
    const customCalculator = createTimeCalculator({
      episodes: 12,
      episodeDuration: 30,
      includeOpening: true
    });

    const options = customCalculator.getCurrentOptions();
    expect(options.episodes).toBe(12);
    expect(options.episodeDuration).toBe(30);
    expect(options.includeOpening).toBe(true);
    expect(options.includeEnding).toBe(false);
  });

  test('should update anime data and recalculate', () => {
    const animeData = {
      episodes: 24,
      duration: 22
    };

    calculator.updateAnime(animeData);

    const options = calculator.getCurrentOptions();
    expect(options.episodes).toBe(24);
    expect(options.episodeDuration).toBe(22);

    const result = calculator.getCurrentResult();
    expect(result.totalMinutes).toBe(528); // 24 * 22
  });

  test('should handle anime data with missing duration', () => {
    const animeData = {
      episodes: 12
      // duration missing, should use default
    };

    calculator.updateAnime(animeData);

    const options = calculator.getCurrentOptions();
    expect(options.episodes).toBe(12);
    expect(options.episodeDuration).toBe(24); // default
  });

  test('should update opening inclusion and recalculate', () => {
    calculator.updateAnime({ episodes: 12, duration: 24 });
    calculator.setIncludeOpening(true);

    const result = calculator.getCurrentResult();
    expect(result.openingMinutes).toBe(18); // 12 * 1.5
    expect(result.totalMinutes).toBe(306); // 288 + 18
  });

  test('should update ending inclusion and recalculate', () => {
    calculator.updateAnime({ episodes: 12, duration: 24 });
    calculator.setIncludeEnding(true);

    const result = calculator.getCurrentResult();
    expect(result.endingMinutes).toBe(18);
    expect(result.totalMinutes).toBe(306);
  });

  test('should update both theme inclusions', () => {
    calculator.updateAnime({ episodes: 12, duration: 24 });
    calculator.setThemeInclusion(true, true);

    const result = calculator.getCurrentResult();
    expect(result.openingMinutes).toBe(18);
    expect(result.endingMinutes).toBe(18);
    expect(result.totalMinutes).toBe(324); // 288 + 18 + 18
  });

  test('should notify change listeners', () => {
    const listener = vi.fn();
    calculator.addChangeListener(listener);

    // Should be called immediately with initial state
    expect(listener).toHaveBeenCalledWith(null, expect.any(Object));

    // Should be called when anime data changes
    calculator.updateAnime({ episodes: 12, duration: 24 });
    expect(listener).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));

    // Should be called when options change
    calculator.setIncludeOpening(true);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  test('should remove change listeners', () => {
    const listener = vi.fn();
    calculator.addChangeListener(listener);
    calculator.removeChangeListener(listener);

    calculator.updateAnime({ episodes: 12, duration: 24 });
    
    // Should only be called once (initial call)
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('should handle listener errors gracefully', () => {
    const errorListener = vi.fn(() => {
      throw new Error('Listener error');
    });
    const goodListener = vi.fn();

    calculator.addChangeListener(errorListener);
    calculator.addChangeListener(goodListener);

    // Should not throw and should still call good listener
    expect(() => {
      calculator.updateAnime({ episodes: 12, duration: 24 });
    }).not.toThrow();

    expect(goodListener).toHaveBeenCalled();
  });

  test('should reset to initial state', () => {
    calculator.updateAnime({ episodes: 12, duration: 24 });
    calculator.setIncludeOpening(true);
    calculator.setIncludeEnding(true);

    calculator.reset();

    const options = calculator.getCurrentOptions();
    expect(options.episodes).toBe(0);
    expect(options.episodeDuration).toBe(24);
    expect(options.includeOpening).toBe(false);
    expect(options.includeEnding).toBe(false);

    const result = calculator.getCurrentResult();
    expect(result).toBeNull();
  });

  test('should manually trigger recalculation', () => {
    const listener = vi.fn();
    calculator.addChangeListener(listener);
    
    calculator.recalculate();
    
    // Should be called twice: initial + manual recalculation
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test('should return null result for invalid anime data', () => {
    calculator.updateAnime({ episodes: 0 }); // Invalid
    
    const result = calculator.getCurrentResult();
    expect(result).toBeNull();
  });

  test('should handle invalid data gracefully', () => {
    const listener = vi.fn();
    calculator.addChangeListener(listener);

    // Test with invalid anime data (episodes = 0)
    calculator.updateAnime({ episodes: 0, duration: 24 });
    
    const result = calculator.getCurrentResult();
    expect(result).toBeNull();
    
    // Test with missing anime data
    calculator.updateAnime(null);
    
    const result2 = calculator.getCurrentResult();
    expect(result2).toBeNull();
  });
});

describe('utility functions', () => {
  test('getDefaultEpisodeDuration should return correct value', () => {
    expect(getDefaultEpisodeDuration()).toBe(24);
  });

  test('getThemeDurations should return correct values', () => {
    const durations = getThemeDurations();
    expect(durations.opening).toBe(1.5);
    expect(durations.ending).toBe(1.5);
  });

  test('canCalculateTime should validate anime data correctly', () => {
    expect(canCalculateTime(null)).toBe(false);
    expect(canCalculateTime(undefined)).toBe(false);
    expect(canCalculateTime({})).toBe(false);
    expect(canCalculateTime({ episodes: 0 })).toBe(false);
    expect(canCalculateTime({ episodes: -1 })).toBe(false);
    expect(canCalculateTime({ episodes: 'invalid' })).toBe(false);
    expect(canCalculateTime({ episodes: 12 })).toBe(true);
    expect(canCalculateTime({ episodes: 1 })).toBe(true);
  });
});

describe('integration scenarios', () => {
  test('should handle typical anime series (12 episodes, 24 min each)', () => {
    const result = calculateWatchTime({
      episodes: 12,
      episodeDuration: 24,
      includeOpening: true,
      includeEnding: true
    });

    expect(result.formattedTime).toBe('5 hours 24 minutes');
    expect(result.totalMinutes).toBe(324);
  });

  test('should handle long-running anime (500+ episodes)', () => {
    const result = calculateWatchTime({
      episodes: 500,
      episodeDuration: 24,
      includeOpening: false,
      includeEnding: false
    });

    expect(result.totalMinutes).toBe(12000); // 500 * 24
    expect(result.formattedTime).toBe('200 hours');
  });

  test('should handle movie-length episodes', () => {
    const result = calculateWatchTime({
      episodes: 6,
      episodeDuration: 45, // 45-minute episodes
      includeOpening: false,
      includeEnding: false
    });

    expect(result.totalMinutes).toBe(270); // 6 * 45
    expect(result.formattedTime).toBe('4 hours 30 minutes');
  });

  test('should handle short-form anime', () => {
    const result = calculateWatchTime({
      episodes: 12,
      episodeDuration: 3, // 3-minute episodes
      includeOpening: false,
      includeEnding: false
    });

    expect(result.totalMinutes).toBe(36); // 12 * 3
    expect(result.formattedTime).toBe('36 minutes');
  });

  test('should handle calculator workflow with real anime data', () => {
    const calculator = createTimeCalculator();
    const results = [];
    
    calculator.addChangeListener((result) => {
      if (result) results.push(result.formattedTime);
    });

    // Simulate loading anime data
    calculator.updateAnime({
      episodes: 26,
      duration: 24
    });

    // User toggles opening themes
    calculator.setIncludeOpening(true);

    // User toggles ending themes
    calculator.setIncludeEnding(true);

    // User turns off opening themes
    calculator.setIncludeOpening(false);

    expect(results).toEqual([
      '10 hours 24 minutes', // Base: 26 * 24 = 624 minutes
      '11 hours 3 minutes',  // + opening: 624 + 39 = 663 minutes
      '11 hours 42 minutes', // + ending: 663 + 39 = 702 minutes
      '11 hours 3 minutes'   // - opening: 702 - 39 = 663 minutes
    ]);
  });
});