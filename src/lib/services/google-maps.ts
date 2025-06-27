/**
 * Simple Google Maps Distance Matrix Service
 * Calculates commute times between apartments and work locations
 */

interface CommuteResult {
  minutes: number | null;
  status: 'success' | 'error' | 'no_route';
}

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate commute time using Google Maps Distance Matrix API
 * Returns transit time in minutes, or null if unavailable
 */
export async function calculateCommuteTime(
  apartmentCoords: Coordinates,
  workCoords: Coordinates
): Promise<CommuteResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('[GoogleMaps] API key not configured');
    return { minutes: null, status: 'error' };
  }

  try {
    // Build Distance Matrix API URL
    const origin = `${apartmentCoords.lat},${apartmentCoords.lng}`;
    const destination = `${workCoords.lat},${workCoords.lng}`;

    const url = new URL(
      'https://maps.googleapis.com/maps/api/distancematrix/json'
    );
    url.searchParams.set('origins', origin);
    url.searchParams.set('destinations', destination);
    url.searchParams.set('mode', 'transit'); // Public transportation
    url.searchParams.set('units', 'metric');
    url.searchParams.set('key', apiKey);

    console.log(`[GoogleMaps] Calculating commute: ${origin} → ${destination}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[GoogleMaps] API request failed: ${response.status}`);
      return { minutes: null, status: 'error' };
    }

    const data = await response.json();

    // Check API response status
    if (data.status !== 'OK') {
      console.warn(`[GoogleMaps] API returned status: ${data.status}`);
      return { minutes: null, status: 'error' };
    }

    // Extract duration from response
    const element = data.rows?.[0]?.elements?.[0];

    if (!element) {
      console.warn('[GoogleMaps] No route data in response');
      return { minutes: null, status: 'no_route' };
    }

    if (element.status !== 'OK') {
      console.warn(`[GoogleMaps] Route status: ${element.status}`);
      return { minutes: null, status: 'no_route' };
    }

    const durationSeconds = element.duration?.value;
    if (!durationSeconds) {
      console.warn('[GoogleMaps] No duration in response');
      return { minutes: null, status: 'no_route' };
    }

    const minutes = Math.round(durationSeconds / 60);
    console.log(`[GoogleMaps] Commute time: ${minutes} minutes`);

    return { minutes, status: 'success' };
  } catch (error) {
    console.error('[GoogleMaps] Error calculating commute:', error);
    return { minutes: null, status: 'error' };
  }
}

/**
 * Simple in-memory cache for commute times
 * Format: "lat1,lng1|lat2,lng2" → { minutes, timestamp }
 */
const commuteCache = new Map<string, { minutes: number; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(coords1: Coordinates, coords2: Coordinates): string {
  return `${coords1.lat},${coords1.lng}|${coords2.lat},${coords2.lng}`;
}

/**
 * Get cached commute time if available and not expired
 */
export function getCachedCommuteTime(
  apartmentCoords: Coordinates,
  workCoords: Coordinates
): number | null {
  const key = getCacheKey(apartmentCoords, workCoords);
  const cached = commuteCache.get(key);

  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    commuteCache.delete(key);
    return null;
  }

  return cached.minutes;
}

/**
 * Cache commute time result
 */
export function setCachedCommuteTime(
  apartmentCoords: Coordinates,
  workCoords: Coordinates,
  minutes: number
): void {
  const key = getCacheKey(apartmentCoords, workCoords);
  commuteCache.set(key, {
    minutes,
    timestamp: Date.now(),
  });
}

/**
 * Calculate commute time with caching
 * This is the main function to use in the matcher
 */
export async function getCommuteTime(
  apartmentCoords: Coordinates,
  workCoords: Coordinates
): Promise<number | null> {
  // Try cache first
  const cached = getCachedCommuteTime(apartmentCoords, workCoords);
  if (cached !== null) {
    console.log(`[GoogleMaps] Using cached commute time: ${cached} minutes`);
    return cached;
  }

  // Calculate new commute time
  const result = await calculateCommuteTime(apartmentCoords, workCoords);

  if (result.status === 'success' && result.minutes !== null) {
    // Cache successful results
    setCachedCommuteTime(apartmentCoords, workCoords, result.minutes);
    return result.minutes;
  }

  // Return null for errors/no routes (don't filter apartment)
  return null;
}
