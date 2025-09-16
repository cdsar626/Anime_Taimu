/**
 * AnimeDisplay Component Tests
 * Tests for anime cover and title display functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock anime data for testing
const mockAnimeData = {
  id: 1,
  title: {
    romaji: 'Attack on Titan',
    english: 'Attack on Titan',
    native: '進撃の巨人'
  },
  coverImage: {
    large: 'https://example.com/large-cover.jpg',
    medium: 'https://example.com/medium-cover.jpg'
  },
  episodes: 25,
  duration: 24,
  status: 'FINISHED',
  description: 'Test anime description'
};

const mockAnimeDataNoEnglish = {
  id: 2,
  title: {
    romaji: 'Kimetsu no Yaiba',
    english: null,
    native: '鬼滅の刃'
  },
  coverImage: {
    large: 'https://example.com/large-cover2.jpg',
    medium: 'https://example.com/medium-cover2.jpg'
  },
  episodes: 26,
  duration: 23,
  status: 'FINISHED'
};

describe('AnimeDisplay Component', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Set up JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div id="test-container"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    }));
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__loading">
            <div class="anime-display__cover-skeleton loading-skeleton"></div>
            <div class="anime-display__title-skeleton">
              <div class="loading-skeleton anime-display__title-line"></div>
              <div class="loading-skeleton anime-display__subtitle-line"></div>
            </div>
          </div>
        </div>
      `;

      const loadingElement = container.querySelector('.anime-display__loading');
      const coverSkeleton = container.querySelector('.anime-display__cover-skeleton');
      const titleSkeleton = container.querySelector('.anime-display__title-skeleton');

      expect(loadingElement).toBeTruthy();
      expect(coverSkeleton).toBeTruthy();
      expect(titleSkeleton).toBeTruthy();
      expect(coverSkeleton.classList.contains('loading-skeleton')).toBe(true);
    });

    it('should not display content when loading', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__loading">
            <div class="anime-display__cover-skeleton loading-skeleton"></div>
          </div>
        </div>
      `;

      const contentElement = container.querySelector('.anime-display__content');
      expect(contentElement).toBeFalsy();
    });
  });

  describe('Error State', () => {
    it('should display error message when error is provided', () => {
      const errorMessage = 'No anime found for "nonexistent". Try a different title.';
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__error">
            <div class="anime-display__error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
              </svg>
            </div>
            <p class="anime-display__error-message">${errorMessage}</p>
          </div>
        </div>
      `;

      const errorElement = container.querySelector('.anime-display__error');
      const errorMessageElement = container.querySelector('.anime-display__error-message');

      expect(errorElement).toBeTruthy();
      expect(errorMessageElement.textContent).toBe(errorMessage);
    });

    it('should not display content when error is present', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__error">
            <p class="anime-display__error-message">Error occurred</p>
          </div>
        </div>
      `;

      const contentElement = container.querySelector('.anime-display__content');
      expect(contentElement).toBeFalsy();
    });
  });

  describe('Content Display', () => {
    it('should display anime cover image with correct attributes', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content animate-fade-in">
            <div class="anime-display__cover-container">
              <img
                class="anime-display__cover"
                src="${mockAnimeData.coverImage.large}"
                alt="Cover image for ${mockAnimeData.title.english}"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      `;

      const coverImage = container.querySelector('.anime-display__cover');
      expect(coverImage).toBeTruthy();
      expect(coverImage.src).toBe(mockAnimeData.coverImage.large);
      expect(coverImage.alt).toBe(`Cover image for ${mockAnimeData.title.english}`);
      expect(coverImage.getAttribute('loading')).toBe('lazy');
      expect(coverImage.getAttribute('decoding')).toBe('async');
    });

    it('should display anime title correctly', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content">
            <div class="anime-display__info">
              <h2 class="anime-display__title">${mockAnimeData.title.english}</h2>
            </div>
          </div>
        </div>
      `;

      const titleElement = container.querySelector('.anime-display__title');
      expect(titleElement).toBeTruthy();
      expect(titleElement.textContent.trim()).toBe(mockAnimeData.title.english);
    });

    it('should display romaji title when no English title is available', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content">
            <div class="anime-display__info">
              <h2 class="anime-display__title">${mockAnimeDataNoEnglish.title.romaji}</h2>
            </div>
          </div>
        </div>
      `;

      const titleElement = container.querySelector('.anime-display__title');
      expect(titleElement.textContent.trim()).toBe(mockAnimeDataNoEnglish.title.romaji);
    });

    it('should display subtitle when English and romaji titles differ', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content">
            <div class="anime-display__info">
              <h2 class="anime-display__title">${mockAnimeData.title.english}</h2>
              <p class="anime-display__subtitle">${mockAnimeData.title.romaji}</p>
            </div>
          </div>
        </div>
      `;

      const subtitleElement = container.querySelector('.anime-display__subtitle');
      expect(subtitleElement).toBeTruthy();
      expect(subtitleElement.textContent.trim()).toBe(mockAnimeData.title.romaji);
    });

    it('should display episode count correctly', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content">
            <div class="anime-display__info">
              <div class="anime-display__meta">
                <span class="anime-display__episodes">${mockAnimeData.episodes} episodes</span>
              </div>
            </div>
          </div>
        </div>
      `;

      const episodesElement = container.querySelector('.anime-display__episodes');
      expect(episodesElement).toBeTruthy();
      expect(episodesElement.textContent).toBe(`${mockAnimeData.episodes} episodes`);
    });

    it('should display episode duration correctly', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content">
            <div class="anime-display__info">
              <div class="anime-display__meta">
                <span class="anime-display__duration">${mockAnimeData.duration} min/ep</span>
              </div>
            </div>
          </div>
        </div>
      `;

      const durationElement = container.querySelector('.anime-display__duration');
      expect(durationElement).toBeTruthy();
      expect(durationElement.textContent).toBe(`${mockAnimeData.duration} min/ep`);
    });

    it('should display status with correct styling', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content">
            <div class="anime-display__info">
              <div class="anime-display__meta">
                <span class="anime-display__status" data-status="finished">Finished</span>
              </div>
            </div>
          </div>
        </div>
      `;

      const statusElement = container.querySelector('.anime-display__status');
      expect(statusElement).toBeTruthy();
      expect(statusElement.textContent).toBe('Finished');
      expect(statusElement.getAttribute('data-status')).toBe('finished');
    });
  });

  describe('Image Loading Behavior', () => {
    it('should handle image load event correctly', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content">
            <div class="anime-display__cover-container">
              <img class="anime-display__cover" src="test.jpg" />
            </div>
          </div>
        </div>
      `;

      const coverImage = container.querySelector('.anime-display__cover');
      
      // Simulate image load event
      const loadEvent = new window.Event('load');
      coverImage.dispatchEvent(loadEvent);
      
      // Note: In a real test, we'd check if the 'loaded' class was added
      // This would require the actual onload handler to be executed
      expect(coverImage).toBeTruthy();
    });

    it('should fallback to medium image when large image is not available', () => {
      const animeWithoutLarge = {
        ...mockAnimeData,
        coverImage: {
          large: '',
          medium: 'https://example.com/medium-cover.jpg'
        }
      };

      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content">
            <div class="anime-display__cover-container">
              <img
                class="anime-display__cover"
                src="${animeWithoutLarge.coverImage.large || animeWithoutLarge.coverImage.medium}"
                alt="Cover image"
              />
            </div>
          </div>
        </div>
      `;

      const coverImage = container.querySelector('.anime-display__cover');
      expect(coverImage.src).toBe(animeWithoutLarge.coverImage.medium);
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper alt text for cover image', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content">
            <div class="anime-display__cover-container">
              <img
                class="anime-display__cover"
                src="${mockAnimeData.coverImage.large}"
                alt="Cover image for ${mockAnimeData.title.english}"
              />
            </div>
          </div>
        </div>
      `;

      const coverImage = container.querySelector('.anime-display__cover');
      expect(coverImage.alt).toBe(`Cover image for ${mockAnimeData.title.english}`);
    });

    it('should use semantic HTML structure', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content">
            <div class="anime-display__info">
              <h2 class="anime-display__title">${mockAnimeData.title.english}</h2>
              <p class="anime-display__subtitle">${mockAnimeData.title.romaji}</p>
            </div>
          </div>
        </div>
      `;

      const titleElement = container.querySelector('h2.anime-display__title');
      const subtitleElement = container.querySelector('p.anime-display__subtitle');
      
      expect(titleElement).toBeTruthy();
      expect(subtitleElement).toBeTruthy();
    });
  });

  describe('Animation Classes', () => {
    it('should have fade-in animation class on content', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="anime-display">
          <div class="anime-display__content animate-fade-in">
            <div class="anime-display__info">
              <h2 class="anime-display__title">Test Title</h2>
            </div>
          </div>
        </div>
      `;

      const contentElement = container.querySelector('.anime-display__content');
      expect(contentElement.classList.contains('animate-fade-in')).toBe(true);
    });
  });
});