import { validateAndRecoverLocalStorage, recoverTaskArray, classifyError } from './dataValidation';
import type { Task } from '../types';

/**
 * Error recovery service for handling various types of errors
 * Requirements: All requirements need proper error handling
 */

export interface RecoveryResult {
  success: boolean;
  message: string;
  recoveredData?: any;
  backupCreated?: boolean;
}

export interface ErrorRecoveryOptions {
  createBackup?: boolean;
  attemptAutoRecovery?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private recoveryAttempts = new Map<string, number>();
  private maxRetries = 3;

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  /**
   * Recover from local storage corruption
   */
  async recoverLocalStorage(
    key: string, 
    options: ErrorRecoveryOptions = {}
  ): Promise<RecoveryResult> {
    const { createBackup = true, attemptAutoRecovery = true } = options;

    try {
      // First, try to validate and recover existing data
      const recovered = validateAndRecoverLocalStorage(key);
      
      if (recovered) {
        return {
          success: true,
          message: 'ローカルストレージのデータを正常に復旧しました',
          recoveredData: recovered,
        };
      }

      // If no data exists, check for backup
      if (attemptAutoRecovery) {
        const backupResult = await this.restoreFromBackup(key);
        if (backupResult.success) {
          return backupResult;
        }
      }

      // Initialize with empty state
      const emptyState = {
        state: {
          tasks: [],
          isLoading: false,
          error: null,
          lastUpdated: null,
        },
        version: 0,
      };

      localStorage.setItem(key, JSON.stringify(emptyState));

      return {
        success: true,
        message: 'ローカルストレージを初期化しました',
        recoveredData: emptyState,
      };
    } catch (error) {
      console.error('Local storage recovery failed:', error);
      return {
        success: false,
        message: 'ローカルストレージの復旧に失敗しました',
      };
    }
  }

  /**
   * Recover from task data corruption
   */
  async recoverTaskData(corruptedTasks: any): Promise<RecoveryResult> {
    try {
      const recovered = recoverTaskArray(corruptedTasks);
      
      return {
        success: true,
        message: `${recovered.length}個のタスクを復旧しました`,
        recoveredData: recovered,
      };
    } catch (error) {
      console.error('Task data recovery failed:', error);
      return {
        success: false,
        message: 'タスクデータの復旧に失敗しました',
      };
    }
  }

  /**
   * Handle component errors with automatic recovery
   */
  async handleComponentError(
    error: Error,
    componentName: string,
    options: ErrorRecoveryOptions = {}
  ): Promise<RecoveryResult> {
    const { maxRetries = this.maxRetries, retryDelay = 1000 } = options;
    const errorKey = `${componentName}_${error.message}`;
    
    // Track retry attempts
    const attempts = this.recoveryAttempts.get(errorKey) || 0;
    this.recoveryAttempts.set(errorKey, attempts + 1);

    // Classify the error
    const classification = classifyError(error);

    // If too many attempts, give up
    if (attempts >= maxRetries) {
      return {
        success: false,
        message: `${componentName}の復旧試行回数が上限に達しました`,
      };
    }

    // Handle different error types
    switch (classification.type) {
      case 'storage':
        return await this.recoverLocalStorage('task-freshness-todo-store');
      
      case 'animation':
        // For animation errors, just disable animations temporarily
        return {
          success: true,
          message: 'アニメーションを一時的に無効化しました',
        };
      
      case 'validation':
        // For validation errors, try to sanitize data
        return {
          success: true,
          message: 'データを修正して続行します',
        };
      
      case 'network':
        // For network errors, suggest retry
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return {
            success: true,
            message: 'ネットワークエラーから復旧を試行中...',
          };
        }
        break;
      
      default:
        return {
          success: false,
          message: '不明なエラーが発生しました',
        };
    }

    return {
      success: false,
      message: `${componentName}の復旧に失敗しました`,
    };
  }

  /**
   * Create backup of current data
   */
  async createBackup(key: string, data: any): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString();
      const backupKey = `${key}_backup_${timestamp}`;
      
      localStorage.setItem(backupKey, JSON.stringify({
        originalKey: key,
        timestamp,
        data,
      }));

      // Keep only the last 5 backups
      this.cleanupOldBackups(key);
      
      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  /**
   * Restore from the most recent backup
   */
  async restoreFromBackup(key: string): Promise<RecoveryResult> {
    try {
      const backups = this.getAvailableBackups(key);
      
      if (backups.length === 0) {
        return {
          success: false,
          message: 'バックアップが見つかりません',
        };
      }

      // Get the most recent backup
      const latestBackup = backups[0];
      const backupData = JSON.parse(localStorage.getItem(latestBackup.key) || '{}');
      
      if (backupData.data) {
        localStorage.setItem(key, JSON.stringify(backupData.data));
        
        return {
          success: true,
          message: `バックアップから復元しました (${latestBackup.timestamp})`,
          recoveredData: backupData.data,
        };
      }

      return {
        success: false,
        message: 'バックアップデータが無効です',
      };
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return {
        success: false,
        message: 'バックアップからの復元に失敗しました',
      };
    }
  }

  /**
   * Get list of available backups
   */
  private getAvailableBackups(key: string): Array<{ key: string; timestamp: string }> {
    const backups: Array<{ key: string; timestamp: string }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(`${key}_backup_`)) {
        const timestamp = storageKey.replace(`${key}_backup_`, '');
        backups.push({ key: storageKey, timestamp });
      }
    }

    // Sort by timestamp (newest first)
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Clean up old backups to prevent storage bloat
   */
  private cleanupOldBackups(key: string, keepCount: number = 5): void {
    const backups = this.getAvailableBackups(key);
    
    // Remove old backups beyond keepCount
    for (let i = keepCount; i < backups.length; i++) {
      localStorage.removeItem(backups[i].key);
    }
  }

  /**
   * Reset recovery attempts for a specific error
   */
  resetRecoveryAttempts(errorKey: string): void {
    this.recoveryAttempts.delete(errorKey);
  }

  /**
   * Clear all recovery attempts
   */
  clearAllRecoveryAttempts(): void {
    this.recoveryAttempts.clear();
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats(): {
    totalAttempts: number;
    activeErrors: number;
    errorTypes: Record<string, number>;
  } {
    const totalAttempts = Array.from(this.recoveryAttempts.values()).reduce((sum, count) => sum + count, 0);
    const activeErrors = this.recoveryAttempts.size;
    const errorTypes: Record<string, number> = {};

    for (const [errorKey, count] of this.recoveryAttempts.entries()) {
      const type = errorKey.split('_')[0];
      errorTypes[type] = (errorTypes[type] || 0) + count;
    }

    return {
      totalAttempts,
      activeErrors,
      errorTypes,
    };
  }
}

// Export singleton instance
export const errorRecoveryService = ErrorRecoveryService.getInstance();

// Utility functions
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  componentName: string,
  options?: ErrorRecoveryOptions
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const recovery = await errorRecoveryService.handleComponentError(
      error as Error,
      componentName,
      options
    );

    if (recovery.success) {
      // Retry the operation once after recovery
      try {
        return await operation();
      } catch (retryError) {
        throw retryError;
      }
    }

    throw error;
  }
}

export function withSyncErrorRecovery<T>(
  operation: () => T,
  fallback: T,
  componentName: string
): T {
  try {
    return operation();
  } catch (error) {
    console.error(`Error in ${componentName}:`, error);
    
    // Log for recovery service
    errorRecoveryService.handleComponentError(
      error as Error,
      componentName
    );

    return fallback;
  }
}

export default errorRecoveryService;