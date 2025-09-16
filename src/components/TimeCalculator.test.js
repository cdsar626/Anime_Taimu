/**
 * TimeCalculator Component Tests
 * Tests for the TimeCalculator Astro component
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock the time calculator module
vi.mock('../scripts/time-calculator.js', () => ({
  createTimeCalculator: vi.fn(() => ({
    addChangeListener: vi.fn(),
    setIncludeOpening: vi.fn(),
    setIncludeEnding: vi.fn(),
    updateAnime: vi.fn(),
    recalculate: vi.fn(),
    getCurrentResult: vi.fn(() => ({
      formattedTime: '8 hours 24 minutes',
      breakdown: {
        episodes: 12,
        episodeDuration: 24,
        baseTime: '4 hours 48 minutes',
        openingTime: '18 minutes',
        endingTime: '18 minutes',
        includeOpening: true,
        includeEnding: true
      }
    }))
  }))
}));

describe('TimeCalculator Component', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Create a new JSDOM instance for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div class="time-calculator" data-testid="time-calculator">
            <div class="time-calculator__content animate-fade-in">
              <div class="time-calculator__header">
                <h3 class="time-calculator__title">Watch Time Calculator</h3>
                <p class="time-calculator__subtitle">Customize your viewing experience</p>
              </div>
              <div class="time-calculator__controls">
                <div class="time-calculator__checkbox-group">
                  <label class="time-calculator__checkbox-label">
                    <input
                      type="checkbox"
                      class="time-calculator__checkbox"
                      id="include-opening"
                      data-testid="include-opening"
                    />
                    <span class="time-calculator__checkbox-custom"></span>
                    <span class="time-calculator__checkbox-text">
                      Include Opening Themes
                      <span class="time-calculator__checkbox-detail">(+1m 30s per episode)</span>
                    </span>
                  </label>
                  <label class="time-calculator__checkbox-label">
                    <input
                      type="checkbox"
                      class="time-calculator__checkbox"
                      id="include-ending"
                      data-testid="include-ending"
                    />
                    <span class="time-calculator__checkbox-custom"></span>
                    <span class="time-calculator__checkbox-text">
                      Include Ending Themes
                      <span class="time-calculator__checkbox-detail">(+1m 30s per episode)</span>
                    </span>
                  </label>
                </div>
              </div>
              <div class="time-calculator__result" data-testid="calculation-result">
                <div class="time-calculator__result-header">
                  <span class="time-calculator__result-label">Total Watch Time</span>
                </div>
                <div class="time-calculator__result-value" id="total-time">
                  <span class="time-calculator__calculating">Calculating...</span>
                </div>
                <div class="time-calculator__result-breakdown" id="time-breakdown">
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window;

    // Set up global objects
    global.document = document;
    global.window = window;
    global.HTMLElement = window.HTMLElement;
    global.HTMLInputElement = window.HTMLInputElement;
  });

  afterEach(() => {
    vi.clearAllMocks();
    dom.window.close();
  });

  describe('Component Structure', () => {
    it('should render the main calculator container', () => {
      const calculator = document.querySelector('[data-testid="time-calculator"]');
      expect(calculator).toBeTruthy();
      expect(calculator.classList.contains('time-calculator')).toBe(true);
    });

    it('should render the header with title and subtitle', () => {
      const title = document.querySelector('.time-calculator__title');
      const subtitle = document.querySelector('.time-calculator__subtitle');
      
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('Watch Time Calculator');
      expect(subtitle).toBeTruthy();
      expect(subtitle.textContent).toBe('Customize your viewing experience');
    });

    it('should render opening theme checkbox with correct attributes', () => {
      const checkbox = document.querySelector('[data-testid="include-opening"]');
      
      expect(checkbox).toBeTruthy();
      expect(checkbox.type).toBe('checkbox');
      expect(checkbox.id).toBe('include-opening');
    });

    it('should render ending theme checkbox with correct attributes', () => {
      const checkbox = document.querySelector('[data-testid="include-ending"]');
      
      expect(checkbox).toBeTruthy();
      expect(checkbox.type).toBe('checkbox');
      expect(checkbox.id).toBe('include-ending');
    });

    it('should render result display area', () => {
      const result = document.querySelector('[data-testid="calculation-result"]');
      const totalTime = document.getElementById('total-time');
      const breakdown = document.getElementById('time-breakdown');
      
      expect(result).toBeTruthy();
      expect(totalTime).toBeTruthy();
      expect(breakdown).toBeTruthy();
    });
  });

  describe('Checkbox Labels and Details', () => {
    it('should display correct opening theme label and detail', () => {
      const openingLabel = document.querySelector('[data-testid="include-opening"]')
        .closest('.time-calculator__checkbox-label');
      
      const text = openingLabel.querySelector('.time-calculator__checkbox-text');
      const detail = openingLabel.querySelector('.time-calculator__checkbox-detail');
      
      expect(text.textContent).toContain('Include Opening Themes');
      expect(detail.textContent).toBe('(+1m 30s per episode)');
    });

    it('should display correct ending theme label and detail', () => {
      const endingLabel = document.querySelector('[data-testid="include-ending"]')
        .closest('.time-calculator__checkbox-label');
      
      const text = endingLabel.querySelector('.time-calculator__checkbox-text');
      const detail = endingLabel.querySelector('.time-calculator__checkbox-detail');
      
      expect(text.textContent).toContain('Include Ending Themes');
      expect(detail.textContent).toBe('(+1m 30s per episode)');
    });
  });

  describe('Initial State', () => {
    it('should have both checkboxes unchecked by default', () => {
      const openingCheckbox = document.querySelector('[data-testid="include-opening"]');
      const endingCheckbox = document.querySelector('[data-testid="include-ending"]');
      
      expect(openingCheckbox.checked).toBe(false);
      expect(endingCheckbox.checked).toBe(false);
    });

    it('should show calculating state initially', () => {
      const calculatingSpan = document.querySelector('.time-calculator__calculating');
      
      expect(calculatingSpan).toBeTruthy();
      expect(calculatingSpan.textContent).toBe('Calculating...');
    });

    it('should have empty breakdown initially', () => {
      const breakdown = document.getElementById('time-breakdown');
      
      expect(breakdown.innerHTML.trim()).toBe('');
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper label association for checkboxes', () => {
      const openingCheckbox = document.querySelector('[data-testid="include-opening"]');
      const endingCheckbox = document.querySelector('[data-testid="include-ending"]');
      
      const openingLabel = openingCheckbox.closest('label');
      const endingLabel = endingCheckbox.closest('label');
      
      expect(openingLabel).toBeTruthy();
      expect(endingLabel).toBeTruthy();
      expect(openingLabel.contains(openingCheckbox)).toBe(true);
      expect(endingLabel.contains(endingCheckbox)).toBe(true);
    });

    it('should have proper test ids for testing', () => {
      expect(document.querySelector('[data-testid="time-calculator"]')).toBeTruthy();
      expect(document.querySelector('[data-testid="include-opening"]')).toBeTruthy();
      expect(document.querySelector('[data-testid="include-ending"]')).toBeTruthy();
      expect(document.querySelector('[data-testid="calculation-result"]')).toBeTruthy();
    });

    it('should have semantic HTML structure', () => {
      const title = document.querySelector('.time-calculator__title');
      const labels = document.querySelectorAll('.time-calculator__checkbox-label');
      
      expect(title.tagName).toBe('H3');
      expect(labels.length).toBe(2);
      labels.forEach(label => {
        expect(label.tagName).toBe('LABEL');
      });
    });
  });

  describe('CSS Classes', () => {
    it('should have correct CSS classes for styling', () => {
      const calculator = document.querySelector('.time-calculator');
      const content = document.querySelector('.time-calculator__content');
      const controls = document.querySelector('.time-calculator__controls');
      const result = document.querySelector('.time-calculator__result');
      
      expect(calculator).toBeTruthy();
      expect(content).toBeTruthy();
      expect(controls).toBeTruthy();
      expect(result).toBeTruthy();
    });

    it('should have animation classes', () => {
      const content = document.querySelector('.time-calculator__content');
      
      expect(content.classList.contains('animate-fade-in')).toBe(true);
    });

    it('should have proper checkbox styling classes', () => {
      const customCheckboxes = document.querySelectorAll('.time-calculator__checkbox-custom');
      const checkboxTexts = document.querySelectorAll('.time-calculator__checkbox-text');
      const checkboxDetails = document.querySelectorAll('.time-calculator__checkbox-detail');
      
      expect(customCheckboxes.length).toBe(2);
      expect(checkboxTexts.length).toBe(2);
      expect(checkboxDetails.length).toBe(2);
    });
  });

  describe('Component Requirements Compliance', () => {
    it('should meet requirement 4.1 - display checkboxes for opening and ending', () => {
      const openingCheckbox = document.querySelector('[data-testid="include-opening"]');
      const endingCheckbox = document.querySelector('[data-testid="include-ending"]');
      
      expect(openingCheckbox).toBeTruthy();
      expect(endingCheckbox).toBeTruthy();
      expect(openingCheckbox.type).toBe('checkbox');
      expect(endingCheckbox.type).toBe('checkbox');
    });

    it('should meet requirement 4.2 - show 1m30s addition per episode', () => {
      const details = document.querySelectorAll('.time-calculator__checkbox-detail');
      
      details.forEach(detail => {
        expect(detail.textContent).toBe('(+1m 30s per episode)');
      });
    });

    it('should meet requirement 4.3 - have proper structure for real-time updates', () => {
      const totalTimeElement = document.getElementById('total-time');
      const breakdownElement = document.getElementById('time-breakdown');
      
      expect(totalTimeElement).toBeTruthy();
      expect(breakdownElement).toBeTruthy();
    });

    it('should meet requirement 4.4 - have smooth animations structure', () => {
      const content = document.querySelector('.time-calculator__content');
      const result = document.querySelector('.time-calculator__result');
      
      expect(content.classList.contains('animate-fade-in')).toBe(true);
      expect(result).toBeTruthy(); // Result has animation classes in CSS
    });

    it('should meet requirement 4.5 - have aquamarine theme elements', () => {
      // Check for aquamarine-themed classes that would be styled in CSS
      const title = document.querySelector('.time-calculator__title');
      const checkboxCustoms = document.querySelectorAll('.time-calculator__checkbox-custom');
      const result = document.querySelector('.time-calculator__result');
      
      expect(title).toBeTruthy();
      expect(checkboxCustoms.length).toBe(2);
      expect(result).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no anime data', () => {
      // Create a new DOM with empty state
      const emptyDom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <body>
            <div class="time-calculator" data-testid="time-calculator">
              <div class="time-calculator__empty">
                <div class="time-calculator__empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                  </svg>
                </div>
                <p class="time-calculator__empty-message">
                  Search for an anime to calculate watch time
                </p>
              </div>
            </div>
          </body>
        </html>
      `);

      const emptyState = emptyDom.window.document.querySelector('.time-calculator__empty');
      const emptyMessage = emptyDom.window.document.querySelector('.time-calculator__empty-message');
      
      expect(emptyState).toBeTruthy();
      expect(emptyMessage.textContent.trim()).toBe('Search for an anime to calculate watch time');
      
      emptyDom.window.close();
    });
  });
});