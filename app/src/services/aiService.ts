// AI Service - Wrapper for Tauri USI engine commands

import { invoke } from '@tauri-apps/api/core';

/**
 * Initialize the AI engine
 * @param enginePath Optional path to engine binary (not used for mock engine)
 * @returns Success message
 */
export async function initEngine(enginePath?: string): Promise<string> {
  try {
    const result = await invoke<string>('init_engine', { enginePath });
    return result;
  } catch (error) {
    throw new Error(`Failed to initialize engine: ${error}`);
  }
}

/**
 * Get AI move for a given position
 * @param sfen SFEN string representing the current position
 * @param timeMs Time limit in milliseconds
 * @returns USI move string (e.g., "7g7f" or "P*5e")
 */
export async function getAIMove(sfen: string, timeMs: number): Promise<string> {
  try {
    const result = await invoke<string>('get_ai_move', {
      sfen,
      timeMs,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to get AI move: ${error}`);
  }
}

/**
 * Shutdown the AI engine
 * @returns Success message
 */
export async function shutdownEngine(): Promise<string> {
  try {
    const result = await invoke<string>('shutdown_engine');
    return result;
  } catch (error) {
    throw new Error(`Failed to shutdown engine: ${error}`);
  }
}

/**
 * Check if the engine is ready
 * @returns True if engine is initialized and ready
 */
export async function isEngineReady(): Promise<boolean> {
  try {
    const result = await invoke<boolean>('is_engine_ready');
    return result;
  } catch (error) {
    console.error('Failed to check engine status:', error);
    return false;
  }
}

/**
 * Get time limit in milliseconds based on AI difficulty level
 * @param level AI difficulty level
 * @returns Time limit in milliseconds
 */
export function getTimeForLevel(level: 'easy' | 'medium' | 'hard'): number {
  switch (level) {
    case 'easy':
      return 500;
    case 'medium':
      return 2000;
    case 'hard':
      return 5000;
    default:
      return 2000;
  }
}
