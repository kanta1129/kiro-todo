import { z } from 'zod';

// Freshness state type
export type FreshnessState = '新規' | '期限接近' | '期限間近' | '期限切れ';

// Visual theme interface for different freshness states
export interface VisualTheme {
  colors: string[];
  effects: string[];
  animations: string[];
}

// Visual theme configuration for each freshness state
export interface FreshnessVisualConfig {
  [key: string]: VisualTheme;
}

// Priority multiplier for freshness calculation
export interface PriorityMultiplier {
  high: number;
  medium: number;
  low: number;
}

// Freshness calculation result
export interface FreshnessCalculationResult {
  state: FreshnessState;
  daysUntilDue: number;
  adjustedDays: number;
  shouldUpdate: boolean;
}

// Zod schemas for validation
export const FreshnessStateSchema = z.enum(['新規', '期限接近', '期限間近', '期限切れ']);

export const VisualThemeSchema = z.object({
  colors: z.array(z.string()),
  effects: z.array(z.string()),
  animations: z.array(z.string()),
});

export const FreshnessVisualConfigSchema = z.record(z.string(), VisualThemeSchema);

export const PriorityMultiplierSchema = z.object({
  high: z.number().positive(),
  medium: z.number().positive(),
  low: z.number().positive(),
});

export const FreshnessCalculationResultSchema = z.object({
  state: FreshnessStateSchema,
  daysUntilDue: z.number(),
  adjustedDays: z.number(),
  shouldUpdate: z.boolean(),
});