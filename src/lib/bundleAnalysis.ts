/**
 * Bundle size analysis utilities
 * Requirements: 2.4
 */

export interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    gzippedSize: number;
    modules: string[];
  }>;
  dependencies: Array<{
    name: string;
    size: number;
    version: string;
  }>;
  recommendations: string[];
}

export interface PerformanceBudget {
  maxBundleSize: number; // in bytes
  maxChunkSize: number;
  maxDependencySize: number;
  warningThreshold: number; // percentage
}

/**
 * Default performance budget for the application
 */
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  maxBundleSize: 500 * 1024, // 500KB
  maxChunkSize: 200 * 1024,  // 200KB
  maxDependencySize: 100 * 1024, // 100KB
  warningThreshold: 80, // 80%
};

/**
 * Analyze bundle size and provide recommendations
 */
export function analyzeBundleSize(stats: BundleStats, budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET): {
  status: 'good' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  budgetUsage: {
    total: number;
    chunks: number[];
    dependencies: number[];
  };
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check total bundle size
  const totalUsage = (stats.totalSize / budget.maxBundleSize) * 100;
  if (stats.totalSize > budget.maxBundleSize) {
    issues.push(`Total bundle size (${formatBytes(stats.totalSize)}) exceeds budget (${formatBytes(budget.maxBundleSize)})`);
    recommendations.push('Consider code splitting or removing unused dependencies');
  } else if (totalUsage > budget.warningThreshold) {
    issues.push(`Total bundle size is ${totalUsage.toFixed(1)}% of budget`);
    recommendations.push('Monitor bundle size growth carefully');
  }
  
  // Check individual chunks
  const chunkUsages: number[] = [];
  stats.chunks.forEach(chunk => {
    const usage = (chunk.size / budget.maxChunkSize) * 100;
    chunkUsages.push(usage);
    
    if (chunk.size > budget.maxChunkSize) {
      issues.push(`Chunk "${chunk.name}" (${formatBytes(chunk.size)}) exceeds budget (${formatBytes(budget.maxChunkSize)})`);
      recommendations.push(`Split chunk "${chunk.name}" into smaller pieces`);
    }
  });
  
  // Check dependencies
  const dependencyUsages: number[] = [];
  stats.dependencies.forEach(dep => {
    const usage = (dep.size / budget.maxDependencySize) * 100;
    dependencyUsages.push(usage);
    
    if (dep.size > budget.maxDependencySize) {
      issues.push(`Dependency "${dep.name}" (${formatBytes(dep.size)}) is large`);
      recommendations.push(`Consider alternatives to "${dep.name}" or use tree shaking`);
    }
  });
  
  // Determine overall status
  let status: 'good' | 'warning' | 'critical' = 'good';
  if (stats.totalSize > budget.maxBundleSize || stats.chunks.some(c => c.size > budget.maxChunkSize)) {
    status = 'critical';
  } else if (totalUsage > budget.warningThreshold) {
    status = 'warning';
  }
  
  return {
    status,
    issues,
    recommendations,
    budgetUsage: {
      total: totalUsage,
      chunks: chunkUsages,
      dependencies: dependencyUsages,
    },
  };
}

/**
 * Generate bundle analysis report
 */
export function generateBundleReport(stats: BundleStats, budget?: PerformanceBudget): string {
  const analysis = analyzeBundleSize(stats, budget);
  
  let report = '# Bundle Size Analysis Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  
  // Overall status
  report += `## Overall Status: ${analysis.status.toUpperCase()}\n\n`;
  
  // Bundle overview
  report += '## Bundle Overview\n\n';
  report += `- **Total Size:** ${formatBytes(stats.totalSize)}\n`;
  report += `- **Gzipped Size:** ${formatBytes(stats.gzippedSize)}\n`;
  report += `- **Compression Ratio:** ${((1 - stats.gzippedSize / stats.totalSize) * 100).toFixed(1)}%\n`;
  report += `- **Number of Chunks:** ${stats.chunks.length}\n`;
  report += `- **Number of Dependencies:** ${stats.dependencies.length}\n\n`;
  
  // Budget usage
  report += '## Budget Usage\n\n';
  report += `- **Total Bundle:** ${analysis.budgetUsage.total.toFixed(1)}% of budget\n`;
  
  // Chunks breakdown
  report += '## Chunks Breakdown\n\n';
  stats.chunks.forEach((chunk, index) => {
    const usage = analysis.budgetUsage.chunks[index];
    report += `### ${chunk.name}\n`;
    report += `- **Size:** ${formatBytes(chunk.size)} (${usage.toFixed(1)}% of chunk budget)\n`;
    report += `- **Gzipped:** ${formatBytes(chunk.gzippedSize)}\n`;
    report += `- **Modules:** ${chunk.modules.length}\n\n`;
  });
  
  // Dependencies breakdown
  report += '## Dependencies Breakdown\n\n';
  const sortedDeps = [...stats.dependencies].sort((a, b) => b.size - a.size);
  sortedDeps.forEach((dep, index) => {
    const usage = analysis.budgetUsage.dependencies[index];
    report += `- **${dep.name}@${dep.version}:** ${formatBytes(dep.size)} (${usage.toFixed(1)}% of dependency budget)\n`;
  });
  report += '\n';
  
  // Issues
  if (analysis.issues.length > 0) {
    report += '## Issues\n\n';
    analysis.issues.forEach(issue => {
      report += `- ⚠️ ${issue}\n`;
    });
    report += '\n';
  }
  
  // Recommendations
  if (analysis.recommendations.length > 0) {
    report += '## Recommendations\n\n';
    analysis.recommendations.forEach(rec => {
      report += `- 💡 ${rec}\n`;
    });
    report += '\n';
  }
  
  return report;
}

/**
 * Mock bundle stats for development/testing
 */
export function generateMockBundleStats(): BundleStats {
  return {
    totalSize: 450 * 1024, // 450KB
    gzippedSize: 135 * 1024, // 135KB
    chunks: [
      {
        name: 'main',
        size: 200 * 1024,
        gzippedSize: 60 * 1024,
        modules: ['src/app/page.tsx', 'src/components/TaskList.tsx', 'src/stores/taskStore.ts'],
      },
      {
        name: 'vendor',
        size: 180 * 1024,
        gzippedSize: 54 * 1024,
        modules: ['react', 'react-dom', 'next', 'zustand'],
      },
      {
        name: 'utils',
        size: 70 * 1024,
        gzippedSize: 21 * 1024,
        modules: ['date-fns', 'zod', 'clsx'],
      },
    ],
    dependencies: [
      { name: 'react', size: 45 * 1024, version: '18.2.0' },
      { name: 'react-dom', size: 130 * 1024, version: '18.2.0' },
      { name: 'next', size: 85 * 1024, version: '14.2.15' },
      { name: 'zustand', size: 12 * 1024, version: '5.0.8' },
      { name: 'date-fns', size: 35 * 1024, version: '4.1.0' },
      { name: 'zod', size: 28 * 1024, version: '4.1.12' },
      { name: 'clsx', size: 3 * 1024, version: '2.1.1' },
    ],
    recommendations: [
      'Consider using React 18 concurrent features for better performance',
      'Implement code splitting for non-critical components',
      'Use tree shaking for date-fns imports',
    ],
  };
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Compare two bundle stats
 */
export function compareBundleStats(
  current: BundleStats,
  previous: BundleStats
): {
  totalSizeDiff: number;
  gzippedSizeDiff: number;
  chunksDiff: Array<{
    name: string;
    sizeDiff: number;
    status: 'added' | 'removed' | 'changed' | 'unchanged';
  }>;
  dependenciesDiff: Array<{
    name: string;
    sizeDiff: number;
    versionChange?: { from: string; to: string };
    status: 'added' | 'removed' | 'changed' | 'unchanged';
  }>;
} {
  const totalSizeDiff = current.totalSize - previous.totalSize;
  const gzippedSizeDiff = current.gzippedSize - previous.gzippedSize;
  
  // Compare chunks
  const chunksDiff = current.chunks.map(currentChunk => {
    const previousChunk = previous.chunks.find(c => c.name === currentChunk.name);
    
    if (!previousChunk) {
      return {
        name: currentChunk.name,
        sizeDiff: currentChunk.size,
        status: 'added' as const,
      };
    }
    
    const sizeDiff = currentChunk.size - previousChunk.size;
    return {
      name: currentChunk.name,
      sizeDiff,
      status: sizeDiff === 0 ? 'unchanged' as const : 'changed' as const,
    };
  });
  
  // Add removed chunks
  previous.chunks.forEach(previousChunk => {
    if (!current.chunks.find(c => c.name === previousChunk.name)) {
      chunksDiff.push({
        name: previousChunk.name,
        sizeDiff: -previousChunk.size,
        status: 'removed',
      });
    }
  });
  
  // Compare dependencies
  const dependenciesDiff = current.dependencies.map(currentDep => {
    const previousDep = previous.dependencies.find(d => d.name === currentDep.name);
    
    if (!previousDep) {
      return {
        name: currentDep.name,
        sizeDiff: currentDep.size,
        status: 'added' as const,
      };
    }
    
    const sizeDiff = currentDep.size - previousDep.size;
    const versionChange = currentDep.version !== previousDep.version
      ? { from: previousDep.version, to: currentDep.version }
      : undefined;
    
    return {
      name: currentDep.name,
      sizeDiff,
      versionChange,
      status: sizeDiff === 0 && !versionChange ? 'unchanged' as const : 'changed' as const,
    };
  });
  
  // Add removed dependencies
  previous.dependencies.forEach(previousDep => {
    if (!current.dependencies.find(d => d.name === previousDep.name)) {
      dependenciesDiff.push({
        name: previousDep.name,
        sizeDiff: -previousDep.size,
        status: 'removed',
      });
    }
  });
  
  return {
    totalSizeDiff,
    gzippedSizeDiff,
    chunksDiff,
    dependenciesDiff,
  };
}

/**
 * Bundle size monitoring utility
 */
export class BundleSizeMonitor {
  private history: Array<{ timestamp: number; stats: BundleStats }> = [];
  private budget: PerformanceBudget;
  
  constructor(budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET) {
    this.budget = budget;
  }
  
  addSnapshot(stats: BundleStats): void {
    this.history.push({
      timestamp: Date.now(),
      stats,
    });
    
    // Keep only last 50 snapshots
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
  }
  
  getLatest(): BundleStats | null {
    return this.history.length > 0 ? this.history[this.history.length - 1].stats : null;
  }
  
  getTrend(days: number = 7): 'increasing' | 'decreasing' | 'stable' {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentHistory = this.history.filter(h => h.timestamp > cutoff);
    
    if (recentHistory.length < 2) return 'stable';
    
    const first = recentHistory[0].stats.totalSize;
    const last = recentHistory[recentHistory.length - 1].stats.totalSize;
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }
  
  getAlerts(): string[] {
    const latest = this.getLatest();
    if (!latest) return [];
    
    const analysis = analyzeBundleSize(latest, this.budget);
    return analysis.issues;
  }
  
  exportHistory(): string {
    return JSON.stringify({
      budget: this.budget,
      history: this.history,
      exported: new Date().toISOString(),
    }, null, 2);
  }
}