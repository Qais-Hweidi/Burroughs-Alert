/**
 * App Initializer Component - Handles app-wide initialization in Next.js
 * Status: ✅ IMPLEMENTED - Server-side initialization component
 * Purpose: Initialize background services when the app starts
 * Usage: Include in root layout to ensure initialization happens on every request
 */

import { initializeApp, registerShutdownHandlers } from '@/lib/app-init';

/**
 * Server component that handles app initialization
 * This runs on the server side for every request, but initialization
 * is protected by a singleton pattern to prevent multiple runs
 */
export default async function AppInitializer() {
  // Only run on server side and in production or when explicitly enabled
  if (typeof window === 'undefined') {
    try {
      // Only register shutdown handlers in production or when background jobs are enabled
      const shouldInit =
        process.env.NODE_ENV === 'production' ||
        process.env.ENABLE_BACKGROUND_JOBS_DEV === 'true';

      if (shouldInit) {
        // Register shutdown handlers (safe to call multiple times)
        registerShutdownHandlers();

        // Initialize the app (job system, etc.)
        await initializeApp();
      }
    } catch (error) {
      // Log error but don't crash the app
      console.error('App initialization error:', error);
    }
  }

  // This component renders nothing - it's just for side effects
  return null;
}

/**
 * Alternative: Use this if you want to show initialization status
 * Uncomment and use instead of the null return above
 */
/*
export default async function AppInitializer() {
  if (typeof window === 'undefined') {
    try {
      registerShutdownHandlers();
      await initializeApp();
    } catch (error) {
      console.error('App initialization error:', error);
    }
  }

  // Optional: Show initialization indicator in development
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
          App Initialized
        </div>
      </div>
    );
  }

  return null;
}
*/
