/**
 * Time Calculation Engine
 * Provides core time calculation logic with hours:minutes formatting
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

/**
 * @typedef {Object} TimeCalculationOptions
 * @property {number} episodes - Total number of episodes
 * @property {number} episodeDuration - Duration per episode in minutes
 * @property {boolean} includeOpening - Whether to include opening theme time
 * @property {boolean} includeEnding - Whether to include ending theme time
 */

/**
 * @typedef {Object} TimeCalculationResult
 * @property {number} baseMinutes - Base watch time in minutes (episodes * duration)
 * @property {number} openingMinutes - Additional minutes from opening themes
 * @property {number} endingMinutes - Additional minutes from ending themes
 * @property {number} totalMinutes - Total watch time in minutes
 * @property {string} formattedTime - Formatted time string (e.g., "2 hours 30 minutes")
 * @property {Object} breakdown - Detailed breakdown of time components
 */

// Constants for opening and ending theme durations (in minutes)
const OPENING_THEME_DURATION = 1.5; // 1 minute 30 seconds
const ENDING_THEME_DURATION = 1.5;  // 1 minute 30 seconds
const DEFAULT_EPISODE_DURATION = 24; // Default episode duration in minutes

/**
 * Validates calculation input parameters
 * @param {TimeCalculationOptions} options - Calculation options
 * @returns {Object} Validation result with isValid flag and error message
 */
function validateCalculationInput(options) {
  if (!options || typeof options !== 'object') {
    return {
      isValid: false,
      error: 'Invalid calculation options provided'
    };
  }

  const { episodes, episodeDuration } = options;

  // Validate episodes
  if (typeof episodes !== 'number' || episodes < 0) {
    return {
      isValid: false,
      error: 'Episodes must be a non-negative number'
    };
  }

  if (episodes === 0) {
    return {
      isValid: false,
      error: 'Cannot calculate time for anime with 0 episodes'
    };
  }

  // Validate episode duration (allow undefined/null for default)
  if (episodeDuration !== undefined && episodeDuration !== null && 
      (typeof episodeDuration !== 'number' || episodeDuration <= 0)) {
    return {
      isValid: false,
      error: 'Episode duration must be a positive number'
    };
  }

  // Check for reasonable limits to prevent overflow
  if (episodes > 10000) {
    return {
      isValid: false,
      error: 'Episode count exceeds reasonable limit (10,000 episodes)'
    };
  }

  if (episodeDuration > 1440) { // 24 hours in minutes
    return {
      isValid: false,
      error: 'Episode duration exceeds reasonable limit (24 hours)'
    };
  }

  return { isValid: true, error: null };
}

/**
 * Formats time in minutes to human-readable string
 * Handles edge cases for episodes under 60 minutes total
 * @param {number} totalMinutes - Total time in minutes
 * @returns {string} Formatted time string
 */
export function formatTime(totalMinutes) {
  if (typeof totalMinutes !== 'number' || totalMinutes < 0) {
    return '0 minutes';
  }

  // Round to nearest minute for display
  const roundedMinutes = Math.round(totalMinutes);

  // Handle edge case: less than 60 minutes total
  if (roundedMinutes < 60) {
    return roundedMinutes === 1 ? '1 minute' : `${roundedMinutes} minutes`;
  }

  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  // Build formatted string
  let result = '';
  
  if (hours > 0) {
    result += hours === 1 ? '1 hour' : `${hours} hours`;
  }

  if (minutes > 0) {
    if (result) {
      result += ' ';
    }
    result += minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }

  return result || '0 minutes';
}

/**
 * Calculates total watch time for an anime series
 * @param {TimeCalculationOptions} options - Calculation parameters
 * @returns {TimeCalculationResult} Detailed calculation result
 */
export function calculateWatchTime(options) {
  // Validate input
  const validation = validateCalculationInput(options);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const {
    episodes,
    episodeDuration,
    includeOpening = false,
    includeEnding = false
  } = options;

  // Use default episode duration if not provided or invalid
  const finalEpisodeDuration = (typeof episodeDuration === 'number' && episodeDuration > 0) 
    ? episodeDuration 
    : DEFAULT_EPISODE_DURATION;

  // Calculate base time (episodes * duration per episode)
  const baseMinutes = episodes * finalEpisodeDuration;

  // Calculate additional time from opening and ending themes
  const openingMinutes = includeOpening ? episodes * OPENING_THEME_DURATION : 0;
  const endingMinutes = includeEnding ? episodes * ENDING_THEME_DURATION : 0;

  // Calculate total time
  const totalMinutes = baseMinutes + openingMinutes + endingMinutes;

  // Format the result
  const formattedTime = formatTime(totalMinutes);

  // Create detailed breakdown
  const breakdown = {
    episodes,
    episodeDuration: finalEpisodeDuration,
    baseTime: formatTime(baseMinutes),
    openingTime: includeOpening ? formatTime(openingMinutes) : null,
    endingTime: includeEnding ? formatTime(endingMinutes) : null,
    includeOpening,
    includeEnding
  };

  return {
    baseMinutes,
    openingMinutes,
    endingMinutes,
    totalMinutes,
    formattedTime,
    breakdown
  };
}

/**
 * Creates a time calculator instance with automatic recalculation
 * @param {Object} initialOptions - Initial calculation options
 * @returns {Object} Calculator instance with methods and state
 */
export function createTimeCalculator(initialOptions = {}) {
  let currentOptions = {
    episodes: 0,
    episodeDuration: DEFAULT_EPISODE_DURATION,
    includeOpening: false,
    includeEnding: false,
    ...initialOptions
  };

  let currentResult = null;
  let changeListeners = [];

  /**
   * Recalculates time and notifies listeners
   */
  function recalculate() {
    try {
      if (currentOptions.episodes > 0) {
        currentResult = calculateWatchTime(currentOptions);
      } else {
        currentResult = null;
      }
      
      // Notify all listeners of the change
      changeListeners.forEach(listener => {
        try {
          listener(currentResult, currentOptions);
        } catch (error) {
          console.error('Error in time calculator listener:', error);
        }
      });
    } catch (error) {
      console.error('Error calculating time:', error);
      currentResult = null;
      
      // Notify listeners of error state
      changeListeners.forEach(listener => {
        try {
          listener(null, currentOptions, error.message);
        } catch (listenerError) {
          console.error('Error in time calculator listener:', listenerError);
        }
      });
    }
  }

  return {
    /**
     * Updates anime data and recalculates
     * @param {Object} animeData - Anime data with episodes and duration
     */
    updateAnime(animeData) {
      if (animeData && typeof animeData === 'object') {
        currentOptions.episodes = animeData.episodes || 0;
        currentOptions.episodeDuration = animeData.duration || DEFAULT_EPISODE_DURATION;
        recalculate();
      }
    },

    /**
     * Updates opening theme inclusion and recalculates
     * @param {boolean} include - Whether to include opening themes
     */
    setIncludeOpening(include) {
      currentOptions.includeOpening = Boolean(include);
      recalculate();
    },

    /**
     * Updates ending theme inclusion and recalculates
     * @param {boolean} include - Whether to include ending themes
     */
    setIncludeEnding(include) {
      currentOptions.includeEnding = Boolean(include);
      recalculate();
    },

    /**
     * Updates both opening and ending inclusion
     * @param {boolean} includeOpening - Include opening themes
     * @param {boolean} includeEnding - Include ending themes
     */
    setThemeInclusion(includeOpening, includeEnding) {
      currentOptions.includeOpening = Boolean(includeOpening);
      currentOptions.includeEnding = Boolean(includeEnding);
      recalculate();
    },

    /**
     * Gets current calculation result
     * @returns {TimeCalculationResult|null} Current result or null if no valid data
     */
    getCurrentResult() {
      return currentResult;
    },

    /**
     * Gets current options
     * @returns {TimeCalculationOptions} Current calculation options
     */
    getCurrentOptions() {
      return { ...currentOptions };
    },

    /**
     * Adds a listener for calculation changes
     * @param {Function} listener - Callback function (result, options, error) => void
     */
    addChangeListener(listener) {
      if (typeof listener === 'function') {
        changeListeners.push(listener);
        // Immediately call with current state
        try {
          listener(currentResult, currentOptions);
        } catch (error) {
          console.error('Error in time calculator listener:', error);
        }
      }
    },

    /**
     * Removes a change listener
     * @param {Function} listener - Listener function to remove
     */
    removeChangeListener(listener) {
      const index = changeListeners.indexOf(listener);
      if (index > -1) {
        changeListeners.splice(index, 1);
      }
    },

    /**
     * Manually triggers recalculation
     */
    recalculate() {
      recalculate();
    },

    /**
     * Resets calculator to initial state
     */
    reset() {
      currentOptions = {
        episodes: 0,
        episodeDuration: DEFAULT_EPISODE_DURATION,
        includeOpening: false,
        includeEnding: false
      };
      currentResult = null;
      
      changeListeners.forEach(listener => {
        try {
          listener(null, currentOptions);
        } catch (error) {
          console.error('Error in time calculator listener:', error);
        }
      });
    }
  };
}

/**
 * Utility function to get default episode duration
 * @returns {number} Default episode duration in minutes
 */
export function getDefaultEpisodeDuration() {
  return DEFAULT_EPISODE_DURATION;
}

/**
 * Utility function to get theme durations
 * @returns {Object} Opening and ending theme durations
 */
export function getThemeDurations() {
  return {
    opening: OPENING_THEME_DURATION,
    ending: ENDING_THEME_DURATION
  };
}

/**
 * Validates if anime data is suitable for time calculation
 * @param {Object} animeData - Anime data object
 * @returns {boolean} True if data is valid for calculation
 */
export function canCalculateTime(animeData) {
  if (!animeData || typeof animeData !== 'object') {
    return false;
  }
  
  return typeof animeData.episodes === 'number' && animeData.episodes > 0;
}