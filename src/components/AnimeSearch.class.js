/**
 * AnimeSearch Component Class
 * Extracted for testing purposes - contains the core logic without Astro dependencies
 */

import { searchAnime, cancelPendingSearch } from '../scripts/anime-api.js';

export class AnimeSearchComponent {
  constructor() {
    this.searchInput = document.getElementById('anime-search-input');
    this.clearButton = document.querySelector('.clear-button');
    this.searchStatus = document.getElementById('search-status');
    this.searchError = document.getElementById('search-error');
    this.retryButton = document.querySelector('.retry-button');
    
    this.currentSearchTerm = '';
    this.isLoading = false;
    
    this.init();
  }

  init() {
    if (!this.searchInput) return;

    // Bind event listeners
    this.searchInput.addEventListener('input', this.handleInput.bind(this));
    this.searchInput.addEventListener('keydown', this.handleKeydown.bind(this));
    this.clearButton?.addEventListener('click', this.handleClear.bind(this));
    this.retryButton?.addEventListener('click', this.handleRetry.bind(this));

    // Handle browser back/forward navigation
    window.addEventListener('popstate', this.handlePopState.bind(this));
    
    // Initialize from URL if present
    this.initializeFromURL();
  }

  handleInput(event) {
    const value = event.target.value;
    this.updateClearButtonVisibility(value);
    this.performSearch(value);
  }

  handleKeydown(event) {
    // Handle Enter key
    if (event.key === 'Enter') {
      event.preventDefault();
      this.performSearch(this.searchInput.value, true); // Force immediate search
    }
    
    // Handle Escape key
    if (event.key === 'Escape') {
      this.handleClear();
    }
  }

  handleClear() {
    this.searchInput.value = '';
    this.searchInput.focus();
    this.updateClearButtonVisibility('');
    this.hideStates();
    this.dispatchSearchEvent(null, null);
    cancelPendingSearch();
    
    // Update URL
    this.updateURL('');
  }

  handleRetry() {
    if (this.currentSearchTerm) {
      this.performSearch(this.currentSearchTerm, true);
    }
  }

  handlePopState() {
    this.initializeFromURL();
  }

  initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    if (searchTerm) {
      this.searchInput.value = searchTerm;
      this.updateClearButtonVisibility(searchTerm);
      this.performSearch(searchTerm, true);
    }
  }

  updateURL(searchTerm) {
    const url = new URL(window.location);
    if (searchTerm) {
      url.searchParams.set('search', searchTerm);
    } else {
      url.searchParams.delete('search');
    }
    window.history.replaceState({}, '', url);
  }

  updateClearButtonVisibility(value) {
    if (this.clearButton) {
      this.clearButton.style.display = value.length > 0 ? 'flex' : 'none';
    }
  }

  async performSearch(searchTerm, immediate = false) {
    this.currentSearchTerm = searchTerm.trim();
    
    // Clear states if empty search
    if (!this.currentSearchTerm) {
      this.hideStates();
      this.dispatchSearchEvent(null, null);
      this.updateURL('');
      return;
    }

    // Update URL
    this.updateURL(this.currentSearchTerm);

    // Show loading state
    this.showLoading();

    try {
      const result = await searchAnime(this.currentSearchTerm);
      
      // Check if this is still the current search
      if (this.currentSearchTerm !== searchTerm.trim()) {
        return; // Search term changed, ignore this result
      }

      this.hideLoading();

      if (result.error) {
        this.showError(result.error);
        this.dispatchSearchEvent(null, result.error);
      } else if (result.data) {
        this.hideStates();
        this.dispatchSearchEvent(result.data, null);
      } else {
        this.showError('No anime found. Please try a different search term.');
        this.dispatchSearchEvent(null, 'No results found');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.hideLoading();
      this.showError('An unexpected error occurred. Please try again.');
      this.dispatchSearchEvent(null, error.message);
    }
  }

  showLoading() {
    this.isLoading = true;
    this.hideError();
    if (this.searchStatus) {
      this.searchStatus.style.display = 'block';
      this.searchStatus.classList.add('animate-fade-in');
    }
  }

  hideLoading() {
    this.isLoading = false;
    if (this.searchStatus) {
      this.searchStatus.style.display = 'none';
      this.searchStatus.classList.remove('animate-fade-in');
    }
  }

  showError(message) {
    this.hideLoading();
    if (this.searchError) {
      const errorMessageElement = this.searchError.querySelector('.error-message');
      if (errorMessageElement) {
        errorMessageElement.textContent = message;
      }
      this.searchError.style.display = 'block';
      this.searchError.classList.add('animate-fade-in');
    }
  }

  hideError() {
    if (this.searchError) {
      this.searchError.style.display = 'none';
      this.searchError.classList.remove('animate-fade-in');
    }
  }

  hideStates() {
    this.hideLoading();
    this.hideError();
  }

  dispatchSearchEvent(animeData, error) {
    // Dispatch custom event for parent components to listen to
    const event = new CustomEvent('animeSearchResult', {
      detail: {
        data: animeData,
        error: error,
        searchTerm: this.currentSearchTerm
      },
      bubbles: true
    });
    
    this.searchInput.dispatchEvent(event);
  }

  // Public methods for external control
  setSearchTerm(term) {
    this.searchInput.value = term;
    this.updateClearButtonVisibility(term);
    this.performSearch(term, true);
  }

  getSearchTerm() {
    return this.searchInput.value;
  }

  focus() {
    this.searchInput.focus();
  }

  clear() {
    this.handleClear();
  }

  getLoadingState() {
    return this.isLoading;
  }
}