/**
 * AnimeSearch Component Class
 * Extracted for testing purposes - contains the core logic without Astro dependencies
 */

import { searchAnime, searchMultipleAnime, cancelPendingSearch } from '../scripts/anime-api.js';

export class AnimeSearchComponent {
  constructor() {
    this.searchInput = document.getElementById('anime-search-input');
    this.clearButton = document.querySelector('.clear-button');
    this.searchStatus = document.getElementById('search-status');
    this.searchError = document.getElementById('search-error');
    this.retryButton = document.querySelector('.retry-button');
    
    // Alternative results elements
    this.alternativeResults = document.getElementById('alternative-results');
    this.alternativesHintBtn = document.getElementById('alternatives-hint-btn');
    this.alternativesDropdown = document.getElementById('alternatives-dropdown');
    this.alternativesList = document.getElementById('alternatives-list');
    
    this.currentSearchTerm = '';
    this.isLoading = false;
    this.alternativesExpanded = false;
    this.currentAlternatives = [];
    
    this.init();
  }

  init() {
    if (!this.searchInput) return;

    // Bind event listeners
    this.searchInput.addEventListener('input', this.handleInput.bind(this));
    this.searchInput.addEventListener('keydown', this.handleKeydown.bind(this));
    this.clearButton?.addEventListener('click', this.handleClear.bind(this));
    this.retryButton?.addEventListener('click', this.handleRetry.bind(this));
    this.alternativesHintBtn?.addEventListener('click', this.handleToggleAlternatives.bind(this));

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
    this.hideAlternatives();
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

  handleToggleAlternatives() {
    if (this.alternativesExpanded) {
      this.hideAlternativesDropdown();
    } else {
      this.showAlternativesDropdown();
    }
  }

  handleAlternativeSelect(anime) {
    // Hide dropdown but keep alternatives section visible so user can reopen it
    this.hideAlternativesDropdown();
    this.dispatchSearchEvent(anime, null);
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
        this.hideAlternatives();
        this.dispatchSearchEvent(null, result.error);
      } else if (result.data) {
        this.hideStates();
        this.dispatchSearchEvent(result.data, null);
        // Load alternatives for this search
        this.loadAlternatives(this.currentSearchTerm);
      } else {
        this.showError('No anime found. Please try a different search term.');
        this.hideAlternatives();
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
    
    // Dispatch loading event
    this.dispatchLoadingEvent(true);
  }

  hideLoading() {
    this.isLoading = false;
    if (this.searchStatus) {
      this.searchStatus.style.display = 'none';
      this.searchStatus.classList.remove('animate-fade-in');
    }
    
    // Dispatch loading event
    this.dispatchLoadingEvent(false);
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

  async loadAlternatives(searchTerm) {
    try {
      const result = await searchMultipleAnime(searchTerm, 8); // Get up to 8 alternatives
      
      if (result.data && result.data.length > 1) {
        // Remove the first result (it's the one already shown) and store alternatives
        this.currentAlternatives = result.data.slice(1);
        this.showAlternatives();
      } else {
        this.hideAlternatives();
      }
    } catch (error) {
      console.error('Failed to load alternatives:', error);
      this.hideAlternatives();
    }
  }

  showAlternatives() {
    if (this.currentAlternatives.length > 0) {
      // Show the hint button in the search bar
      if (this.alternativesHintBtn) {
        this.alternativesHintBtn.style.display = 'flex';
      }
      // Prepare the alternatives section (but keep dropdown hidden initially)
      if (this.alternativeResults) {
        this.alternativeResults.style.display = 'block';
      }
      this.populateAlternativesList();
    }
  }

  hideAlternatives() {
    // Hide the hint button
    if (this.alternativesHintBtn) {
      this.alternativesHintBtn.style.display = 'none';
    }
    // Hide the alternatives section
    if (this.alternativeResults) {
      this.alternativeResults.style.display = 'none';
    }
    this.hideAlternativesDropdown();
    this.currentAlternatives = [];
  }

  showAlternativesDropdown() {
    if (this.alternativesDropdown && this.alternativesHintBtn) {
      this.alternativesDropdown.style.display = 'block';
      this.alternativesHintBtn.classList.add('expanded');
      this.alternativesExpanded = true;
    }
  }

  hideAlternativesDropdown() {
    if (this.alternativesDropdown && this.alternativesHintBtn) {
      this.alternativesDropdown.style.display = 'none';
      this.alternativesHintBtn.classList.remove('expanded');
      this.alternativesExpanded = false;
    }
  }

  populateAlternativesList() {
    if (!this.alternativesList) return;

    this.alternativesList.innerHTML = '';

    this.currentAlternatives.forEach(anime => {
      const item = this.createAlternativeItem(anime);
      this.alternativesList.appendChild(item);
    });
  }

  createAlternativeItem(anime) {
    const item = document.createElement('div');
    item.className = 'alternative-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Select ${anime.title.romaji || anime.title.english}`);

    const displayTitle = anime.title.english || anime.title.romaji;
    const episodes = anime.episodes || 'Unknown';
    const duration = anime.duration || 24;

    item.innerHTML = `
      <div class="alternative-cover-container">
        <img 
          class="alternative-cover" 
          src="${anime.coverImage.medium || anime.coverImage.large || '/placeholder-anime.jpg'}" 
          alt="${displayTitle} cover"
          loading="lazy"
          onload="this.classList.add('loaded')"
        />
        <div class="alternative-cover-overlay"></div>
        <div class="alternative-cover-glow"></div>
      </div>
      <div class="alternative-info">
        <h4 class="alternative-title">${displayTitle}</h4>
        <div class="alternative-details">
          <div class="alternative-episodes">
            <svg class="alternative-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span>${episodes} episodes</span>
          </div>
          <div class="alternative-duration">
            <svg class="alternative-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>${duration}min</span>
          </div>
        </div>
      </div>
    `;

    // Add click handler
    item.addEventListener('click', () => {
      this.handleAlternativeSelect(anime);
    });

    // Add keyboard handler
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleAlternativeSelect(anime);
      }
    });

    return item;
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

  dispatchLoadingEvent(loading) {
    // Dispatch loading event for parent components
    const event = new CustomEvent('animeSearchLoading', {
      detail: {
        loading: loading,
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

  // Public method to get current alternatives
  getAlternatives() {
    return this.currentAlternatives;
  }

  getLoadingState() {
    return this.isLoading;
  }
}