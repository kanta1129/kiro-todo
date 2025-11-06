'use client';

import { useEffect, useState } from 'react';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { getBackgroundTaskManager, getBackgroundMonitoringStats } from '../../lib/backgroundTaskManager';
import type { BackgroundTaskStats } from '../../lib/backgroundTaskManager';

/**
 * Props for RealTimeStatus component
 */
interface RealTimeStatusProps {
  /** Whether to show detailed statistics (default: false) */
  showDetails?: boolean;
  /** Whether to show controls (default: true) */
  showControls?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * Real-time status component showing freshness update information
 * Requirements: 2.4, 5.1
 */
export function RealTimeStatus({ 
  showDetails = false, 
  showControls = true, 
  className = '',
  compact = false 
}: RealTimeStatusProps) {
  // Real-time updates hook
  const {
    isActive,
    isUpdating,
    lastUpdateCount,
    lastUpdateTime,
    timeUntilNextUpdate,
    start,
    stop,
    forceUpdate,
    resetTimer,
  } = useRealTimeUpdates();

  // Background task statistics
  const [backgroundStats, setBackgroundStats] = useState<BackgroundTaskStats | null>(null);
  const [showStatsDetails, setShowStatsDetails] = useState(false);

  // Update background stats periodically
  useEffect(() => {
    const updateStats = () => {
      const stats = getBackgroundMonitoringStats();
      setBackgroundStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Format time display
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Format duration display
  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // Handle force update
  const handleForceUpdate = async () => {
    try {
      const count = await forceUpdate();
      console.log(`Force update completed: ${count} tasks updated`);
    } catch (error) {
      console.error('Force update failed:', error);
    }
  };

  // Handle background task control
  const handleBackgroundControl = (action: 'start' | 'stop' | 'force') => {
    const manager = getBackgroundTaskManager();
    
    switch (action) {
      case 'start':
        manager.start();
        break;
      case 'stop':
        manager.stop();
        break;
      case 'force':
        manager.forceUpdate();
        break;
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 text-sm ${className}`}>
        {/* Status indicator */}
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            isUpdating ? 'bg-yellow-400 animate-pulse' : 
            isActive ? 'bg-green-400' : 'bg-gray-400'
          }`} />
          <span className="text-gray-600">
            {isUpdating ? '更新中' : isActive ? 'アクティブ' : '停止中'}
          </span>
        </div>

        {/* Next update countdown */}
        {isActive && !isUpdating && (
          <span className="text-gray-500">
            次回: {formatDuration(timeUntilNextUpdate)}
          </span>
        )}

        {/* Force update button */}
        {showControls && (
          <button
            onClick={handleForceUpdate}
            disabled={isUpdating}
            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
            title="今すぐ更新"
          >
            ⟳
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">リアルタイム更新状態</h3>
        
        {showDetails && (
          <button
            onClick={() => setShowStatsDetails(!showStatsDetails)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showStatsDetails ? '詳細を隠す' : '詳細を表示'}
          </button>
        )}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Update Status */}
        <div className="text-center">
          <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
            isUpdating ? 'bg-yellow-400 animate-pulse' : 
            isActive ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <div className="text-sm font-medium text-gray-900">
            {isUpdating ? '更新中' : isActive ? 'アクティブ' : '停止中'}
          </div>
        </div>

        {/* Last Update */}
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{lastUpdateCount}</div>
          <div className="text-sm text-gray-500">前回更新数</div>
        </div>

        {/* Last Update Time */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">
            {formatTime(lastUpdateTime)}
          </div>
          <div className="text-sm text-gray-500">最終更新</div>
        </div>

        {/* Next Update */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">
            {isActive ? formatDuration(timeUntilNextUpdate) : '---'}
          </div>
          <div className="text-sm text-gray-500">次回更新</div>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={isActive ? stop : start}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              isActive 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isActive ? '停止' : '開始'}
          </button>

          <button
            onClick={handleForceUpdate}
            disabled={isUpdating}
            className="px-3 py-1 text-sm font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? '更新中...' : '今すぐ更新'}
          </button>

          <button
            onClick={resetTimer}
            className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            タイマーリセット
          </button>
        </div>
      )}

      {/* Background Task Status */}
      {backgroundStats && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">バックグラウンドタスク</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">状態: </span>
              <span className={`font-medium ${
                backgroundStats.isRunning 
                  ? backgroundStats.isPaused ? 'text-yellow-600' : 'text-green-600'
                  : 'text-red-600'
              }`}>
                {backgroundStats.isRunning 
                  ? backgroundStats.isPaused ? '一時停止' : '実行中'
                  : '停止中'
                }
              </span>
            </div>
            
            <div>
              <span className="text-gray-500">総サイクル: </span>
              <span className="font-medium">{backgroundStats.totalCycles}</span>
            </div>
            
            <div>
              <span className="text-gray-500">総更新数: </span>
              <span className="font-medium">{backgroundStats.totalTasksUpdated}</span>
            </div>
          </div>

          {/* Background Task Controls */}
          {showControls && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleBackgroundControl('start')}
                disabled={backgroundStats.isRunning && !backgroundStats.isPaused}
                className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
              >
                開始
              </button>
              
              <button
                onClick={() => handleBackgroundControl('stop')}
                disabled={!backgroundStats.isRunning}
                className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
              >
                停止
              </button>
              
              <button
                onClick={() => handleBackgroundControl('force')}
                className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                強制実行
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detailed Statistics */}
      {showDetails && showStatsDetails && backgroundStats && (
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">詳細統計</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">連続エラー数:</span>
              <span className={`font-medium ${
                backgroundStats.consecutiveErrors > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {backgroundStats.consecutiveErrors}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">最終成功:</span>
              <span className="font-medium">
                {formatTime(backgroundStats.lastSuccessfulUpdate)}
              </span>
            </div>
            
            {backgroundStats.lastError && (
              <div className="flex justify-between">
                <span className="text-gray-500">最終エラー:</span>
                <span className="font-medium text-red-600">
                  {formatTime(backgroundStats.lastError)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-500">平均更新間隔:</span>
              <span className="font-medium">
                {formatDuration(backgroundStats.averageUpdateInterval)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RealTimeStatus;