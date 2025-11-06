/**
 * Performance Dashboard Component
 * Requirements: 2.4
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePerformanceMetrics, usePerformanceBenchmark } from '../../hooks/usePerformanceMonitor';
import { 
  generateMockBundleStats, 
  analyzeBundleSize, 
  formatBytes,
  BundleSizeMonitor,
  DEFAULT_PERFORMANCE_BUDGET 
} from '../../lib/bundleAnalysis';
import { 
  runPerformanceBenchmarkSuite, 
  generateBenchmarkReport,
  exportBenchmarkResults 
} from '../../lib/performanceBenchmarks';

interface PerformanceDashboardProps {
  className?: string;
}

export function PerformanceDashboard({ className = '' }: PerformanceDashboardProps) {
  const performanceMetrics = usePerformanceMetrics('PerformanceDashboard');
  const benchmarkHook = usePerformanceBenchmark();
  
  const [bundleMonitor] = useState(() => new BundleSizeMonitor());
  const [bundleStats, setBundleStats] = useState(() => generateMockBundleStats());
  const [isRunningBenchmarks, setIsRunningBenchmarks] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'bundle' | 'benchmarks'>('metrics');

  // Update bundle stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = generateMockBundleStats();
      // Add some variation to simulate real changes
      newStats.totalSize += Math.floor((Math.random() - 0.5) * 10000);
      setBundleStats(newStats);
      bundleMonitor.addSnapshot(newStats);
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [bundleMonitor]);

  const runBenchmarks = useCallback(async () => {
    setIsRunningBenchmarks(true);
    try {
      const results = await runPerformanceBenchmarkSuite();
      setBenchmarkResults(results);
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunningBenchmarks(false);
    }
  }, []);

  const exportMetrics = useCallback(() => {
    performanceMetrics.exportMetrics();
  }, [performanceMetrics]);

  const exportBenchmarks = useCallback(() => {
    if (benchmarkResults) {
      exportBenchmarkResults(benchmarkResults);
    }
  }, [benchmarkResults]);

  const bundleAnalysis = analyzeBundleSize(bundleStats);
  const metrics = performanceMetrics.getMetrics();

  return (
    <div className={`performance-dashboard bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={exportMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Export Metrics
          </button>
          {benchmarkResults && (
            <button
              onClick={exportBenchmarks}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Export Benchmarks
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: 'metrics', label: 'Real-time Metrics' },
          { id: 'bundle', label: 'Bundle Analysis' },
          { id: 'benchmarks', label: 'Benchmarks' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Render Time"
              value={`${metrics.renderTime.toFixed(2)}ms`}
              status={metrics.renderTime < 16 ? 'good' : metrics.renderTime < 33 ? 'warning' : 'critical'}
            />
            <MetricCard
              title="FPS"
              value={performanceMetrics.fps.toString()}
              status={performanceMetrics.fps >= 55 ? 'good' : performanceMetrics.fps >= 30 ? 'warning' : 'critical'}
            />
            <MetricCard
              title="Re-renders"
              value={metrics.reRenderCount.toString()}
              status={metrics.reRenderCount < 10 ? 'good' : metrics.reRenderCount < 50 ? 'warning' : 'critical'}
            />
            <MetricCard
              title="Memory Usage"
              value={metrics.memoryUsage ? `${metrics.memoryUsage.percentage}%` : 'N/A'}
              status={
                !metrics.memoryUsage ? 'unknown' :
                metrics.memoryUsage.percentage < 70 ? 'good' :
                metrics.memoryUsage.percentage < 85 ? 'warning' : 'critical'
              }
            />
          </div>

          {/* Memory Chart */}
          {performanceMetrics.memoryHistory.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Memory Usage Trend</h3>
              <div className="h-32 flex items-end space-x-1">
                {performanceMetrics.memoryHistory.slice(-20).map((entry, index) => (
                  <div
                    key={index}
                    className="bg-blue-500 rounded-t"
                    style={{
                      height: `${(entry.percentage / 100) * 100}%`,
                      width: '4px',
                    }}
                    title={`${entry.percentage}% at ${new Date(entry.timestamp).toLocaleTimeString()}`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Trend: {performanceMetrics.getMemoryTrend()}
              </div>
            </div>
          )}

          {/* Operation Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Operation Performance</h3>
            <div className="space-y-2">
              {Object.entries(performanceMetrics.operationStats).map(([operation, stats]) => (
                <div key={operation} className="flex justify-between items-center">
                  <span className="font-medium">{operation}</span>
                  <div className="text-sm text-gray-600">
                    Avg: {stats.avg.toFixed(2)}ms | 
                    Min: {stats.min.toFixed(2)}ms | 
                    Max: {stats.max.toFixed(2)}ms | 
                    Count: {stats.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bundle Analysis Tab */}
      {activeTab === 'bundle' && (
        <div className="space-y-6">
          {/* Bundle Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total Size"
              value={formatBytes(bundleStats.totalSize)}
              status={bundleAnalysis.status}
              subtitle={`${bundleAnalysis.budgetUsage.total.toFixed(1)}% of budget`}
            />
            <MetricCard
              title="Gzipped Size"
              value={formatBytes(bundleStats.gzippedSize)}
              status="good"
              subtitle={`${((1 - bundleStats.gzippedSize / bundleStats.totalSize) * 100).toFixed(1)}% compression`}
            />
            <MetricCard
              title="Chunks"
              value={bundleStats.chunks.length.toString()}
              status="good"
              subtitle="Code splitting active"
            />
          </div>

          {/* Bundle Issues */}
          {bundleAnalysis.issues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Issues</h3>
              <ul className="space-y-1">
                {bundleAnalysis.issues.map((issue, index) => (
                  <li key={index} className="text-red-700 text-sm">⚠️ {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Bundle Recommendations */}
          {bundleAnalysis.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {bundleAnalysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-blue-700 text-sm">💡 {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Chunks Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Chunks Breakdown</h3>
            <div className="space-y-3">
              {bundleStats.chunks.map((chunk, index) => (
                <div key={chunk.name} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{chunk.name}</span>
                    <div className="text-sm text-gray-600">
                      {chunk.modules.length} modules
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatBytes(chunk.size)}</div>
                    <div className="text-sm text-gray-600">
                      {bundleAnalysis.budgetUsage.chunks[index]?.toFixed(1)}% of budget
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dependencies */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Dependencies</h3>
            <div className="space-y-2">
              {bundleStats.dependencies
                .sort((a, b) => b.size - a.size)
                .map((dep, index) => (
                  <div key={dep.name} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{dep.name}</span>
                      <span className="text-sm text-gray-600 ml-2">v{dep.version}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatBytes(dep.size)}</div>
                      <div className="text-sm text-gray-600">
                        {bundleAnalysis.budgetUsage.dependencies[index]?.toFixed(1)}% of budget
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Benchmarks Tab */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance Benchmarks</h3>
            <button
              onClick={runBenchmarks}
              disabled={isRunningBenchmarks}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isRunningBenchmarks ? 'Running...' : 'Run Benchmarks'}
            </button>
          </div>

          {isRunningBenchmarks && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-800">Running performance benchmarks...</span>
              </div>
            </div>
          )}

          {benchmarkResults && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Total Time"
                  value={`${benchmarkResults.summary.totalTime.toFixed(2)}ms`}
                  status="good"
                />
                <MetricCard
                  title="Avg Ops/Sec"
                  value={benchmarkResults.summary.averageOpsPerSecond.toFixed(0)}
                  status="good"
                />
                <MetricCard
                  title="Memory Efficiency"
                  value={`${benchmarkResults.summary.memoryEfficiency.toFixed(2)} B/op`}
                  status="good"
                />
              </div>

              {/* Detailed Results */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-4">Detailed Results</h4>
                <div className="space-y-3">
                  {benchmarkResults.results.map((result: any, index: number) => (
                    <div key={index} className="bg-white rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{result.name}</h5>
                          <div className="text-sm text-gray-600">
                            {result.iterations.toLocaleString()} iterations
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{result.averageTime.toFixed(4)}ms avg</div>
                          <div className="text-sm text-gray-600">
                            {result.opsPerSecond.toFixed(0)} ops/sec
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Min: {result.minTime.toFixed(4)}ms | 
                        Max: {result.maxTime.toFixed(4)}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  status: 'good' | 'warning' | 'critical' | 'unknown';
  subtitle?: string;
}

function MetricCard({ title, value, status, subtitle }: MetricCardProps) {
  const statusColors = {
    good: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
    unknown: 'bg-gray-50 border-gray-200 text-gray-800',
  };

  const statusIcons = {
    good: '✅',
    warning: '⚠️',
    critical: '❌',
    unknown: '❓',
  };

  return (
    <div className={`rounded-lg border p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-lg">{statusIcons[status]}</span>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <div className="text-sm opacity-75 mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );
}