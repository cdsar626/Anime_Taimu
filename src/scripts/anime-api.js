/**
 * AniList API Integration Module
 * Provides GraphQL client for anime search functionality with error handling and rate limiting
 */

// TypeScript-style interfaces for documentation and runtime validation
/**
 * @typedef {Object} AnimeTitle
 * @property {string} romaji - Romanized title
 * @property {string|null} english - English title
 * @property {string} native - Native title
 */

/**
 * @typedef {Object} CoverImage
 * @property {string} large - Large cover image URL
 * @property {string} medium - Medium cover image URL
 */

/**
 * @typedef {Object} AnimeData
 * @property {number} id - Anime ID
 * @property {AnimeTitle} title - Anime titles
 * @property {CoverImage} coverImage - Cover image URLs
 * @property {number|null} episodes - Total episode count
 * @property {number|null} duration - Duration per episode in minutes
 * @property {string} status - Anime status (FINISHED, RELEASING, etc.)
 * @property {string|null} description - Anime description
 */

/**
 * @typedef {Object} ApiResponse
 * @property {AnimeData|null} data - Anime data or null if not found
 * @property {string|null} error - Error message if request failed
 */

// AniList GraphQL API endpoint
const ANILIST_API_URL = 'https://graphql.anilist.co';

// GraphQL query for anime search
const ANIME_SEARCH_QUERY = `
  query ($search: String) {
    Media (search: $search, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
      }
      episodes
      duration
      status
      description
    }
  }
`;

// Debouncing utility
let searchTimeout = null;
const DEBOUNCE_DELAY = 300; // 300ms delay as specified in design

// Rate limiting protection
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // Minimum 100ms between requests

/**
 * Validates anime data structure and provides defaults for missing values
 * @param {any} data - Raw API response data
 * @returns {AnimeData|null} Validated anime data or null if invalid
 */
function validateAndNormalizeAnimeData(data) {
  if (!data || !data.Media) {
    return null;
  }

  const anime = data.Media;
  
  // Validate required fields
  if (!anime.id || !anime.title) {
    return null;
  }

  return {
    id: anime.id,
    title: {
      romaji: anime.title.romaji || 'Unknown Title',
      english: anime.title.english || null,
      native: anime.title.native || 'Unknown Title'
    },
    coverImage: {
      large: anime.coverImage?.large || '',
      medium: anime.coverImage?.medium || ''
    },
    episodes: anime.episodes || null,
    duration: anime.duration || null, // Will use default 24 minutes in UI if null
    status: anime.status || 'UNKNOWN',
    description: anime.description || null
  };
}

/**
 * Makes a GraphQL request to AniList API with error handling
 * @param {string} query - GraphQL query string
 * @param {Object} variables - Query variables
 * @returns {Promise<any>} API response data
 * @throws {Error} Network or API errors
 */
async function makeGraphQLRequest(query, variables = {}) {
  // Rate limiting protection
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (response.status >= 500) {
      throw new Error('AniList API is temporarily unavailable. Please try again later.');
    } else if (response.status === 404) {
      throw new Error('AniList API endpoint not found.');
    } else {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  
  // Handle GraphQL errors
  if (data.errors && data.errors.length > 0) {
    const errorMessage = data.errors[0].message || 'Unknown API error';
    throw new Error(`API Error: ${errorMessage}`);
  }

  return data.data;
}

/**
 * Searches for anime by title with debouncing and error handling
 * @param {string} searchTerm - Anime title to search for
 * @returns {Promise<ApiResponse>} Promise resolving to anime data or error
 */
export function searchAnime(searchTerm) {
  return new Promise((resolve) => {
    // Clear existing timeout for debouncing
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Input validation
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      resolve({ data: null, error: 'Please enter an anime title to search.' });
      return;
    }

    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch.length < 2) {
      resolve({ data: null, error: 'Please enter at least 2 characters to search.' });
      return;
    }

    // Debounced search execution
    searchTimeout = setTimeout(async () => {
      try {
        const data = await makeGraphQLRequest(ANIME_SEARCH_QUERY, { 
          search: trimmedSearch 
        });
        
        const validatedData = validateAndNormalizeAnimeData(data);
        
        if (!validatedData) {
          resolve({ 
            data: null, 
            error: `No anime found for "${trimmedSearch}". Try a different title or check your spelling.` 
          });
          return;
        }

        resolve({ data: validatedData, error: null });
        
      } catch (error) {
        console.error('Anime search error:', error);
        
        // Provide user-friendly error messages
        let userMessage = 'An error occurred while searching. Please try again.';
        
        if (error.message.includes('Rate limit')) {
          userMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('temporarily unavailable')) {
          userMessage = 'The anime database is temporarily unavailable. Please try again later.';
        } else if (error.message.includes('Network error') || error.name === 'TypeError') {
          userMessage = 'Network connection error. Please check your internet connection and try again.';
        }
        
        resolve({ data: null, error: userMessage });
      }
    }, DEBOUNCE_DELAY);
  });
}

/**
 * Cancels any pending search requests (useful for cleanup)
 */
export function cancelPendingSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
}

/**
 * Gets the default episode duration when API doesn't provide one
 * @returns {number} Default episode duration in minutes
 */
export function getDefaultEpisodeDuration() {
  return 24; // Standard anime episode length as specified in requirements
}

/**
 * Validates if an anime has sufficient data for time calculation
 * @param {AnimeData} anime - Anime data object
 * @returns {boolean} True if anime has required data for calculations
 */
export function canCalculateTime(anime) {
  if (!anime) {
    return false;
  }
  return anime.episodes !== null && anime.episodes > 0;
}