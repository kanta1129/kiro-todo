import { describe, it, expect } from 'vitest';
import {
  analyzeBundleSize,
  generateBundleReport,
  generateMockBundleStats,
  formatBytes,
  compareBundleStats,
  BundleSizeMonitor,
  DEFAULT_PERFORMANCE_BUDGET,
} from '../bundleAnalysis';

describe('Bundle Analysis', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('analyzeBundleSize', () => {
    it('should analyze bundle within budget', () => {
      const stats = generateMockBundleStats();
      stats.totalSize = 300 * 1024; // 300KB - within 500KB budget
      
      // Ensure all chunks are within budget
      stats.chunks.forEach(chunk => {
        chunk.size = Math.min(chunk.size, 150 * 1024); // Max 150KB per chunk
      });
      
      // Ensure all dependencies are within budget
      stats.dependencies.forEach(dep => {
        dep.size = Math.min(dep.size, 80 * 1024); // Max 80KB per dependency
      });
      
      const analysis = analyzeBundleSize(stats);
      
      expect(analysis.status).toBe('good');
      expect(analysis.issues).toHaveLength(0);
      expect(analysis.budgetUsage.total).toBe(60); // 300KB / 500KB * 100
    });

    it('should detect budget overrun', () => {
      const stats = generateMockBundleStats();
      stats.totalSize = 600 * 1024; // 600KB - exceeds 500KB budget
      
      const analysis = analyzeBundleSize(stats);
      
      expect(analysis.status).toBe('critical');
      expect(analysis.issues.length).toBeGreaterThan(0);
      expect(analysis.issues[0]).toContain('exceeds budget');
    });

    it('should detect warning threshold', () => {
      const stats = generateMockBundleStats();
      stats.totalSize = 450 * 1024; // 450KB - 90% of budget (above 80% warning)
      
      const analysis = analyzeBundleSize(stats);
      
      expect(analysis.status).toBe('warning');
      expect(analysis.budgetUsage.total).toBe(90);
    });

    it('should analyze individual chunks', () => {
      const stats = generateMockBundleStats();
      stats.chunks[0].size = 250 * 1024; // Exceeds 200KB chunk budget
      
      const analysis = analyzeBundleSize(stats);
      
      expect(analysis.issues.some(issue => issue.includes('Chunk'))).toBe(true);
      expect(analysis.recommendations.some(rec => rec.includes('Split chunk'))).toBe(true);
    });

    it('should analyze dependencies', () => {
      const stats = generateMockBundleStats();
      stats.dependencies[0].size = 150 * 1024; // Exceeds 100KB dependency budget
      
      const analysis = analyzeBundleSize(stats);
      
      expect(analysis.issues.some(issue => issue.includes('Dependency'))).toBe(true);
      expect(analysis.recommendations.some(rec => rec.includes('alternatives'))).toBe(true);
    });

    it('should use custom budget', () => {
      const stats = generateMockBundleStats();
      const customBudget = {
        maxBundleSize: 200 * 1024, // 200KB
        maxChunkSize: 100 * 1024,  // 100KB
        maxDependencySize: 50 * 1024, // 50KB
        warningThreshold: 70, // 70%
      };
      
      const analysis = analyzeBundleSize(stats, customBudget);
      
      expect(analysis.status).toBe('critical'); // 450KB > 200KB
      expect(analysis.budgetUsage.total).toBeGreaterThan(200);
    });
  });

  describe('generateBundleReport', () => {
    it('should generate comprehensive report', () => {
      const stats = generateMockBundleStats();
      const report = generateBundleReport(stats);
      
      expect(report).toContain('# Bundle Size Analysis Report');
      expect(report).toContain('## Overall Status');
      expect(report).toContain('## Bundle Overview');
      expect(report).toContain('## Budget Usage');
      expect(report).toContain('## Chunks Breakdown');
      expect(report).toContain('## Dependencies Breakdown');
    });

    it('should include issues and recommendations', () => {
      const stats = generateMockBundleStats();
      stats.totalSize = 600 * 1024; // Exceed budget to generate issues
      
      const report = generateBundleReport(stats);
      
      expect(report).toContain('## Issues');
      expect(report).toContain('## Recommendations');
      expect(report).toContain('⚠️');
      expect(report).toContain('💡');
    });

    it('should calculate compression ratio', () => {
      const stats = generateMockBundleStats();
      const report = generateBundleReport(stats);
      
      const expectedRatio = ((1 - stats.gzippedSize / stats.totalSize) * 100).toFixed(1);
      expect(report).toContain(`**Compression Ratio:** ${expectedRatio}%`);
    });
  });

  describe('compareBundleStats', () => {
    it('should compare bundle stats correctly', () => {
      const previous = generateMockBundleStats();
      const current = generateMockBundleStats();
      
      // Modify current stats
      current.totalSize = previous.totalSize + 50 * 1024; // +50KB
      current.gzippedSize = previous.gzippedSize + 15 * 1024; // +15KB
      
      const comparison = compareBundleStats(current, previous);
      
      expect(comparison.totalSizeDiff).toBe(50 * 1024);
      expect(comparison.gzippedSizeDiff).toBe(15 * 1024);
    });

    it('should detect added chunks', () => {
      const previous = generateMockBundleStats();
      const current = generateMockBundleStats();
      
      // Add new chunk
      current.chunks.push({
        name: 'new-chunk',
        size: 100 * 1024,
        gzippedSize: 30 * 1024,
        modules: ['new-module.js'],
      });
      
      const comparison = compareBundleStats(current, previous);
      
      const addedChunk = comparison.chunksDiff.find(c => c.name === 'new-chunk');
      expect(addedChunk?.status).toBe('added');
      expect(addedChunk?.sizeDiff).toBe(100 * 1024);
    });

    it('should detect removed chunks', () => {
      const previous = generateMockBundleStats();
      const current = generateMockBundleStats();
      
      // Remove a chunk
      const removedChunk = current.chunks.pop()!;
      
      const comparison = compareBundleStats(current, previous);
      
      const removedChunkDiff = comparison.chunksDiff.find(c => c.name === removedChunk.name);
      expect(removedChunkDiff?.status).toBe('removed');
      expect(removedChunkDiff?.sizeDiff).toBe(-removedChunk.size);
    });

    it('should detect dependency changes', () => {
      const previous = generateMockBundleStats();
      const current = generateMockBundleStats();
      
      // Change dependency version and size
      current.dependencies[0].version = '19.0.0';
      current.dependencies[0].size = previous.dependencies[0].size + 10 * 1024;
      
      const comparison = compareBundleStats(current, previous);
      
      const changedDep = comparison.dependenciesDiff.find(d => d.name === current.dependencies[0].name);
      expect(changedDep?.status).toBe('changed');
      expect(changedDep?.versionChange).toEqual({
        from: previous.dependencies[0].version,
        to: '19.0.0',
      });
      expect(changedDep?.sizeDiff).toBe(10 * 1024);
    });
  });

  describe('BundleSizeMonitor', () => {
    it('should add and track snapshots', () => {
      const monitor = new BundleSizeMonitor();
      const stats1 = generateMockBundleStats();
      const stats2 = generateMockBundleStats();
      
      monitor.addSnapshot(stats1);
      monitor.addSnapshot(stats2);
      
      expect(monitor.getLatest()).toBe(stats2);
    });

    it('should limit history size', () => {
      const monitor = new BundleSizeMonitor();
      
      // Add more than 50 snapshots
      for (let i = 0; i < 55; i++) {
        const stats = generateMockBundleStats();
        stats.totalSize = i * 1000; // Different sizes
        monitor.addSnapshot(stats);
      }
      
      const history = JSON.parse(monitor.exportHistory());
      expect(history.history.length).toBe(50);
    });

    it('should calculate trend', () => {
      const monitor = new BundleSizeMonitor();
      
      // Add snapshots with increasing size
      const baseStats = generateMockBundleStats();
      for (let i = 0; i < 5; i++) {
        const stats = { ...baseStats };
        stats.totalSize = baseStats.totalSize + (i * 50 * 1024); // Increasing by 50KB each
        monitor.addSnapshot(stats);
      }
      
      const trend = monitor.getTrend(7);
      expect(trend).toBe('increasing');
    });

    it('should detect stable trend', () => {
      const monitor = new BundleSizeMonitor();
      const stats = generateMockBundleStats();
      
      // Add snapshots with same size
      for (let i = 0; i < 5; i++) {
        monitor.addSnapshot({ ...stats });
      }
      
      const trend = monitor.getTrend(7);
      expect(trend).toBe('stable');
    });

    it('should generate alerts', () => {
      const monitor = new BundleSizeMonitor();
      const stats = generateMockBundleStats();
      stats.totalSize = 600 * 1024; // Exceed budget
      
      monitor.addSnapshot(stats);
      
      const alerts = monitor.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toContain('exceeds budget');
    });

    it('should export history', () => {
      const monitor = new BundleSizeMonitor();
      const stats = generateMockBundleStats();
      
      monitor.addSnapshot(stats);
      
      const exported = monitor.exportHistory();
      const parsed = JSON.parse(exported);
      
      expect(parsed.budget).toEqual(DEFAULT_PERFORMANCE_BUDGET);
      expect(parsed.history).toHaveLength(1);
      expect(parsed.exported).toBeDefined();
    });

    it('should handle empty history', () => {
      const monitor = new BundleSizeMonitor();
      
      expect(monitor.getLatest()).toBeNull();
      expect(monitor.getTrend()).toBe('stable');
      expect(monitor.getAlerts()).toEqual([]);
    });
  });

  describe('generateMockBundleStats', () => {
    it('should generate valid mock data', () => {
      const stats = generateMockBundleStats();
      
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.gzippedSize).toBeLessThan(stats.totalSize);
      expect(stats.chunks.length).toBeGreaterThan(0);
      expect(stats.dependencies.length).toBeGreaterThan(0);
      
      // Verify chunk structure
      stats.chunks.forEach(chunk => {
        expect(chunk.name).toBeDefined();
        expect(chunk.size).toBeGreaterThan(0);
        expect(chunk.gzippedSize).toBeLessThan(chunk.size);
        expect(Array.isArray(chunk.modules)).toBe(true);
      });
      
      // Verify dependency structure
      stats.dependencies.forEach(dep => {
        expect(dep.name).toBeDefined();
        expect(dep.version).toBeDefined();
        expect(dep.size).toBeGreaterThan(0);
      });
    });
  });
});