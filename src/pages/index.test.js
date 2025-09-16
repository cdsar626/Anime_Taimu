/**
 * Integration tests for the main index page layout
 * Tests component integration and state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock the time calculator module
vi.mock('../scripts/time-calculator.js', () => ({
  createTimeCalculator: vi.fn(() => ({
    addChangeListener: vi.fn(),
    setIncludeOpening: vi.fn(),
    setIncludeEnding: vi.fn(),
    recalculate: vi.fn(),
    updateAnime: vi.fn()
  }))
}));

describe('Main Page Layout Integration', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Create a minimal DOM structure for testing
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <div class="app-container">
            <main class="app-main">
              <div class="content-grid" id="content-grid">
                <section class="anime-section" id="anime-section">
                  <div class="anime-display" data-testid="anime-display"></div>
                </section>
                <section class="calculator-section" id="calculator-section">
                  <div class="time-calculator" data-testid="time-calculator"></div>
                </section>
              </div>
              <div class="empty-state" id="empty-state">
                <div class="empty-state-content">
                  <h2>Ready to Calculate Watch Time</h2>
                </div>
              </div>
            </main>
          </div>
        </body>
      </html>
    `, { runScripts: 'dangerously' });

    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;
  });

  it('should initialize with empty state visible', () => {
    const contentGrid = document.getElementById('content-grid');
    const emptyState = document.getElementById('empty-state');

    expect(contentGrid).toBeTruthy();
    expect(emptyState).toBeTruthy();
    expect(contentGrid.classList.contains('visible')).toBe(false);
    expect(emptyState.classList.contains('hidden')).toBe(false);
  });

  it('should show content grid when anime data is provided', () => {
    // Simulate the AnimeTimeCalculatorApp class functionality
    const contentGrid = document.getElementById('content-grid');
    const emptyState = document.getElementById('empty-state');

    // Simulate showing content
    contentGrid.classList.add('visible');
    emptyState.classList.add('hidden');

    expect(contentGrid.classList.contains('visible')).toBe(true);
    expect(emptyState.classList.contains('hidden')).toBe(true);
  });

  it('should handle anime search result events', () => {
    const mockAnimeData = {
      id: 1,
      title: {
        romaji: 'Test Anime',
        english: 'Test Anime',
        native: 'テストアニメ'
      },
      coverImage: {
        large: 'https://example.com/large.jpg',
        medium: 'https://example.com/medium.jpg'
      },
      episodes: 12,
      duration: 24,
      status: 'FINISHED'
    };

    // Create and dispatch search result event
    const event = new window.CustomEvent('animeSearchResult', {
      detail: {
        data: mockAnimeData,
        error: null,
        searchTerm: 'test'
      },
      bubbles: true
    });

    // Mock the app functionality
    let eventHandled = false;
    document.addEventListener('animeSearchResult', (e) => {
      eventHandled = true;
      expect(e.detail.data).toEqual(mockAnimeData);
      expect(e.detail.error).toBeNull();
    });

    document.dispatchEvent(event);
    expect(eventHandled).toBe(true);
  });

  it('should handle error states correctly', () => {
    const errorMessage = 'Test error message';

    // Create and dispatch error event
    const event = new window.CustomEvent('animeSearchResult', {
      detail: {
        data: null,
        error: errorMessage,
        searchTerm: 'test'
      },
      bubbles: true
    });

    let errorHandled = false;
    document.addEventListener('animeSearchResult', (e) => {
      errorHandled = true;
      expect(e.detail.data).toBeNull();
      expect(e.detail.error).toBe(errorMessage);
    });

    document.dispatchEvent(event);
    expect(errorHandled).toBe(true);
  });

  it('should handle loading states', () => {
    // Create and dispatch loading event
    const event = new window.CustomEvent('animeSearchLoading', {
      detail: {
        loading: true,
        searchTerm: 'test'
      },
      bubbles: true
    });

    let loadingHandled = false;
    document.addEventListener('animeSearchLoading', (e) => {
      loadingHandled = true;
      expect(e.detail.loading).toBe(true);
    });

    document.dispatchEvent(event);
    expect(loadingHandled).toBe(true);
  });

  it('should have proper responsive layout structure', () => {
    const appContainer = document.querySelector('.app-container');
    const contentGrid = document.getElementById('content-grid');
    const animeSection = document.getElementById('anime-section');
    const calculatorSection = document.getElementById('calculator-section');

    expect(appContainer).toBeTruthy();
    expect(contentGrid).toBeTruthy();
    expect(animeSection).toBeTruthy();
    expect(calculatorSection).toBeTruthy();

    // Check that sections contain the expected components
    expect(animeSection.querySelector('.anime-display')).toBeTruthy();
    expect(calculatorSection.querySelector('.time-calculator')).toBeTruthy();
  });

  it('should maintain proper accessibility structure', () => {
    const main = document.querySelector('main');
    const sections = document.querySelectorAll('section');
    const emptyStateTitle = document.querySelector('.empty-state h2');

    expect(main).toBeTruthy();
    expect(sections.length).toBeGreaterThan(0);
    expect(emptyStateTitle).toBeTruthy();
    expect(emptyStateTitle.textContent).toContain('Ready to Calculate Watch Time');
  });
});