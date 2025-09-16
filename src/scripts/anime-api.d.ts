/**
 * TypeScript declarations for AniList API integration module
 */

export interface AnimeTitle {
  romaji: string;
  english: string | null;
  native: string;
}

export interface CoverImage {
  large: string;
  medium: string;
}

export interface AnimeData {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  episodes: number | null;
  duration: number | null;
  status: string;
  description: string | null;
}

export interface ApiResponse {
  data: AnimeData | null;
  error: string | null;
}

/**
 * Searches for anime by title with debouncing and error handling
 */
export function searchAnime(searchTerm: string): Promise<ApiResponse>;

/**
 * Cancels any pending search requests
 */
export function cancelPendingSearch(): void;

/**
 * Gets the default episode duration when API doesn't provide one
 */
export function getDefaultEpisodeDuration(): number;

/**
 * Validates if an anime has sufficient data for time calculation
 */
export function canCalculateTime(anime: AnimeData): boolean;