'use client';

import { useEffect, useState } from 'react';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { getBackgroundMonitoringStats } from '../../lib/backgroundTaskManager';
import { getFreshnessUpdateMetrics } from '../../lib/enhancedFreshnessUpdater';

/**
 * Props for RealTimeMetrics component
 */
interface RealTimeMetricsProps {
  /** Whether to show detailed metrics (default: false) */
  showDetails?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Refresh interval for metrics in milliseconds (default: 5000) */
  refreshInterval?: number;
}

/**
 * Real-time metrics component showing performance data
 * Requirements: 2.4, 5.1
 */
export function RealTimeMetrics({ 
  showDetails = false, 
  className = '',
  refreshInterval = 5000 
}: RealTimeMetricsProps) {
  // Real-time updates hook
  const { getPerformanceMetrics, isActive, isUpdating } = useRealTimeUpdates();
  
  // Local state for metrics
  const [hookMetrics, setHookMetrics] = useState(getPerformanceMetrics());
  const [backgroundStats, setBackgroundStats] = useState(getBackgroundMonitoringStats());
  const [enhancedMetrics, setEnhancedMetrics] = useState(getFreshnessUpdateMetrics());

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setHookMetrics(getPerformanceMetrics());
      setBackgroundStats(getBackgroundMonitoringStats());
      setEnhancedMetrics(getFreshnessUpdateMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [getPerformanceMetrics, refreshInterval]);

  // Format duration in milliseconds
  const formatDuration = (ms: number): string => {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Format numbers with appropriate precision
  const formatNumber = (num: number): string => {
    if (num < 1) return num.toFixed(2);
    if (num < 10) return num.toFixed(1);
    return Math.round(num).toString();
  };

  if (!showDetails) {
    // Compact view
    return (
      <div className={`inline-flex items-center space-x-4 text-sm text-gray-600 ${className}`}>
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            isUpdating ? 'bg-yellow-400 animate-pulse' : 
            isActive ? 'bg-green-400' : 'bg-gray-400'
          }`} />
          <span>リアルタイム</span>
        </div>
        
        {hookMetrics.totalUpdates > 0 && (
          <>
            <span>平均: {formatDuration(hookMetrics.averageDuration)}</span>
            <span>更新数: {formatNumber(hookMetrics.averageUpdateCount)}</span>
          </>
        )}
      </div>
    );
  }

  // Detailed view
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">リアルタイム更新メトリクス</h3>
      
      {/* Hook Performance Metrics */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">フック パフォーマンス</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {formatDuration(hookMetrics.averageDuration)}
            </div>
            <div className="text-xs text-gray-500">平均処理時間</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {formatNumber(hookMetrics.averageUpdateCount)}
            </div>
            <div className="text-xs text-gray-500">平均更新数</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {hookMetrics.totalUpdates}
            </div>
            <div className="text-xs text-gray-500">総更新回数</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {formatDuration(hookMetrics.lastUpdateDuration)}
            </div>
            <div className="text-xs text-gray-500">最新処理時間</div>
          </div>
        </div>
      </div>

      {/* Background Task Metrics */}
      {backgroundStats && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">バックグラウンド タスク</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-lg font-bold ${
                backgroundStats.isRunning 
                  ? backgroundStats.isPaused ? 'text-yellow-600' : 'text-green-600'
                  : 'text-red-600'
              }`}>
                {backgroundStats.isRunning 
                  ? backgroundStats.isPaused ? '一時停止' : '実行中'
                  : '停止中'
                }
              </div>
              <div className="text-xs text-gray-500">状態</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {backgroundStats.totalCycles}
              </div>
              <div className="text-xs text-gray-500">総サイクル数</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {backgroundStats.totalTasksUpdated}
              </div>
              <div className="text-xs text-gray-500">総更新タスク数</div>
            </div>
          </div>
          
          {backgroundStats.consecutiveErrors > 0 && (
            <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
              連続エラー数: {backgroundStats.consecutiveErrors}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Updater Metrics */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">拡張アップデーター</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-600">
              {formatDuration(enhancedMetrics.averageProcessingTime)}
            </div>
            <div className="text-xs text-gray-500">平均処理時間</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-teal-600">
              {formatNumber(enhancedMetrics.averageUpdatedCount)}
            </div>
            <div className="text-xs text-gray-500">平均更新数</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-pink-600">
              {formatNumber(enhancedMetrics.averageTotalProcessed)}
            </div>
            <div className="text-xs text-gray-500">平均処理数</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-cyan-600">
              {enhancedMetrics.totalUpdates}
            </div>
            <div className="text-xs text-gray-500">総更新回数</div>
          </div>
        </div>
      </div>

      {/* Performance Health Indicator */}
      <div className="mt-4 p-3 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">パフォーマンス状態</span>
          <div className="flex items-center space-x-2">
            {/* Performance indicator based on average processing time */}
            <div className={`w-3 h-3 rounded-full ${
              hookMetrics.averageDuration < 50 ? 'bg-green-400' :
              hookMetrics.averageDuration < 100 ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-sm text-gray-600">
              {hookMetrics.averageDuration < 50 ? '良好' :
               hookMetrics.averageDuration < 100 ? '普通' : '要改善'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealTimeMetrics;