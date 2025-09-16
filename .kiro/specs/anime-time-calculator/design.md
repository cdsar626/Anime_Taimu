# Design Document

## Overview

The Anime Time Calculator is a single-page Astro application that provides a clean, modern interface for calculating anime watch times. The application uses the AniList GraphQL API to fetch anime data and presents it in an aquamarine-themed UI with smooth animations and responsive design.

## Architecture

### Technology Stack
- **Framework**: Astro (Static Site Generation with client-side interactivity)
- **Styling**: CSS with custom properties for theming, CSS Grid/Flexbox for layout
- **API**: AniList GraphQL API (https://graphql.anilist.co)
- **Client-side Logic**: Vanilla JavaScript for interactivity
- **Build Tool**: Vite (included with Astro)

### Application Structure
```
src/
├── pages/
│   └── index.astro          # Main page component
├── components/
│   ├── AnimeSearch.astro    # Search input component
│   ├── AnimeDisplay.astro   # Anime info display component
│   └── TimeCalculator.astro # Time calculation component
├── styles/
│   └── global.css          # Global styles and theme
└── scripts/
    └── anime-api.js        # AniList API integration
```

## Components and Interfaces

### AnimeSearch Component
- **Purpose**: Handles user input for anime title search
- **Props**: None (self-contained)
- **State**: Search query, loading state, error state
- **Events**: Emits search events to parent component

### AnimeDisplay Component
- **Purpose**: Shows anime cover, title, and episode information
- **Props**: Anime data object
- **Features**: 
  - Responsive image loading with fallback
  - Smooth fade-in animations
  - Loading skeleton while data fetches

### TimeCalculator Component
- **Purpose**: Calculates and displays total watch time
- **Props**: Episode count, episode duration, opening/ending preferences
- **Features**:
  - Real-time calculation updates
  - Checkbox controls for OP/ED inclusion
  - Formatted time display (hours:minutes)

### AniList API Integration
```javascript
// GraphQL Query Structure
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
```

## Data Models

### Anime Data Model
```typescript
interface AnimeData {
  id: number;
  title: {
    romaji: string;
    english?: string;
    native: string;
  };
  coverImage: {
    large: string;
    medium: string;
  };
  episodes: number | null;
  duration: number | null; // minutes per episode
  status: string;
  description?: string;
}
```

### Time Calculation Model
```typescript
interface TimeCalculation {
  baseMinutes: number;
  openingMinutes: number;
  endingMinutes: number;
  totalMinutes: number;
  formattedTime: string; // "X hours Y minutes"
}
```

## User Interface Design

### Color Palette (Aquamarine Theme)
```css
:root {
  --primary-aqua: #40E0D0;
  --primary-aqua-light: #7FFFD4;
  --primary-aqua-dark: #20B2AA;
  --background: #F0FFFF;
  --surface: #FFFFFF;
  --text-primary: #2F4F4F;
  --text-secondary: #708090;
  --shadow: rgba(64, 224, 208, 0.2);
  --error: #FF6B6B;
  --success: #51CF66;
}
```

### Layout Structure
1. **Header Section**: Application title with subtle aquamarine gradient
2. **Main Content Area**: 
   - Anime cover (large, centered when loaded)
   - Anime title (prominent typography)
   - Search input (modern design with aquamarine accents)
3. **Information Panel**: Episode count, duration, and calculated time
4. **Controls Section**: Opening/Ending checkboxes with smooth toggle animations
5. **Footer**: Minimal, with API attribution

### Responsive Breakpoints
- Mobile: < 768px (single column, stacked layout)
- Tablet: 768px - 1024px (adjusted spacing, medium cover size)
- Desktop: > 1024px (optimal layout with large cover)

## Error Handling

### API Error Scenarios
1. **Network Errors**: Display retry button with friendly message
2. **No Results Found**: Show "No anime found" with search suggestions
3. **Rate Limiting**: Implement exponential backoff with user notification
4. **Invalid Response**: Graceful degradation with default values

### Error UI Components
- Toast notifications for temporary errors
- Inline error messages for search-related issues
- Loading states with skeleton screens
- Fallback images for broken cover art

### Default Values
- Episode duration: 24 minutes (standard anime episode length)
- Episode count: Display "Unknown" if not available
- Cover image: Placeholder with anime-themed icon

## Testing Strategy

### Unit Tests
- Time calculation logic with various inputs
- API response parsing and error handling
- Component state management
- Input validation and sanitization

### Integration Tests
- Complete user flow: search → display → calculate
- API integration with mock responses
- Error scenario handling
- Responsive design across breakpoints

### Performance Considerations
- Image lazy loading for anime covers
- API request debouncing (300ms delay)
- CSS animations using transform/opacity for smooth performance
- Minimal JavaScript bundle size with Astro's partial hydration

## Accessibility Features

### WCAG Compliance
- Semantic HTML structure with proper headings
- Alt text for anime cover images
- Keyboard navigation support
- High contrast ratios meeting AA standards
- Screen reader friendly labels and descriptions

### Interactive Elements
- Focus indicators with aquamarine theme
- ARIA labels for checkboxes and buttons
- Loading announcements for screen readers
- Error message association with form inputs

## Animation and UX Details

### Micro-interactions
- Smooth hover effects on interactive elements
- Gentle fade-in for anime cover loading
- Checkbox toggle animations with aquamarine accents
- Search input focus states with subtle glow
- Loading spinner with aquamarine gradient

### Performance Optimizations
- CSS transforms for animations (GPU acceleration)
- Preload critical fonts and icons
- Optimize images with appropriate formats (WebP with fallbacks)
- Minimize layout shifts during content loading