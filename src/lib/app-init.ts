/**
 * Next.js App Initialization - Handles startup tasks for the application
 * Status: ✅ IMPLEMENTED - App-wide initialization including job system
 * Purpose: Initialize background services when Next.js app starts
 * Features:
 * - Automatic job system startup in production
 * - Development mode controls
 * - Graceful error handling
 * - Environment-based configuration
 * - Singleton pattern to prevent multiple initializations
 */

import { autoStartBackgroundJobs, getJobSystemStatus } from './jobs/startup';

// ================================
// Initialization State
// ================================

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the application - safe to call multiple times
 * This should be called when the Next.js app starts
 */
export async function initializeApp(): Promise<void> {
  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Return immediately if already initialized
  if (isInitialized) {
    return;
  }

  // Create initialization promise
  initializationPromise = performInitialization();

  return initializationPromise;
}

/**
 * Perform the actual initialization
 */
async function performInitialization(): Promise<void> {
  try {
    console.log('🚀 Initializing Burroughs Alert application...');

    // Log environment info
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Job system enabled: ${shouldEnableJobSystem()}`);

    // Initialize background job system if enabled
    if (shouldEnableJobSystem()) {
      await autoStartBackgroundJobs();

      // Log job system status
      const status = getJobSystemStatus();
      if (status.running) {
        console.log('✅ Background job system initialized successfully');
      } else {
        console.log('⚠️ Background job system failed to start:', status.error);
      }
    } else {
      console.log('⏭️ Background job system disabled');
    }

    isInitialized = true;
    console.log('✅ Application initialization complete');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);

    // Reset state on failure
    isInitialized = false;
    initializationPromise = null;

    // Don't throw in production - let app continue without background jobs
    if (process.env.NODE_ENV === 'production') {
      console.error('Continuing without background job system in production');
    } else {
      throw error;
    }
  }
}

/**
 * Check if job system should be enabled based on environment
 */
function shouldEnableJobSystem(): boolean {
  // Explicitly disabled
  if (process.env.DISABLE_BACKGROUND_JOBS === 'true') {
    return false;
  }

  // Never run in test environment
  if (process.env.NODE_ENV === 'test') {
    return false;
  }

  // In development, only run if explicitly enabled
  if (process.env.NODE_ENV === 'development') {
    return process.env.ENABLE_BACKGROUND_JOBS_DEV === 'true';
  }

  // In production, run by default unless disabled
  return true;
}

/**
 * Get application initialization status
 */
export function getAppInitStatus() {
  return {
    initialized: isInitialized,
    initializing: initializationPromise !== null && !isInitialized,
    jobSystemEnabled: shouldEnableJobSystem(),
    environment: process.env.NODE_ENV,
  };
}

/**
 * Force re-initialization (for testing or error recovery)
 */
export async function reinitializeApp(): Promise<void> {
  console.log('🔄 Force re-initializing application...');

  isInitialized = false;
  initializationPromise = null;

  return initializeApp();
}

// ================================
// Graceful Shutdown Handling
// ================================

let shutdownHandlersRegistered = false;

/**
 * Register shutdown handlers for graceful cleanup
 */
export function registerShutdownHandlers(): void {
  if (shutdownHandlersRegistered) {
    return;
  }

  // Check current listener count before adding more
  const sigintListeners = process.listenerCount('SIGINT');
  const sigtermListeners = process.listenerCount('SIGTERM');

  // Only register if we don't already have too many listeners
  if (sigintListeners >= 10 || sigtermListeners >= 10) {
    console.log(
      '⚠️ Too many signal listeners already registered, skipping shutdown handler registration'
    );
    shutdownHandlersRegistered = true;
    return;
  }

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

    try {
      // Import here to avoid circular dependencies
      const { stopBackgroundJobs } = await import('./jobs/startup');
      await stopBackgroundJobs();
      console.log('✅ Background jobs stopped');
    } catch (error) {
      console.error('❌ Error stopping background jobs:', error);
    }

    console.log('👋 Application shutdown complete');
    process.exit(0);
  };

  // Increase max listeners to prevent warnings
  process.setMaxListeners(20);

  // Handle different termination signals (use once() to prevent multiple registrations)
  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

  // Handle uncaught exceptions
  process.once('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.once('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  shutdownHandlersRegistered = true;
  console.log('🛡️ Graceful shutdown handlers registered');
}

// ================================
// Health Check API
// ================================

/**
 * Get overall application health status
 */
export function getAppHealth() {
  const initStatus = getAppInitStatus();
  const jobStatus = getJobSystemStatus();

  return {
    status: initStatus.initialized ? 'healthy' : 'initializing',
    timestamp: new Date().toISOString(),
    app: initStatus,
    jobs: jobStatus,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
  };
}
