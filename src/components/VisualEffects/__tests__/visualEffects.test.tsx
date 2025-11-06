import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VisualEffectEngine } from '../VisualEffectEngine';
import { ParticleEffect } from '../ParticleEffect';
import { VisualEffectWrapper } from '../VisualEffectWrapper';
import type { FreshnessState } from '../../../types';

// Mock the visual effects utilities
vi.mock('../../../lib/visualEffects', () => ({
  getFreshnessClassName: (state: FreshnessState) => `freshness-${state}`,
  getTransitionClassName: (from: FreshnessState, to: FreshnessState) => `transition-${from}-to-${to}`,
  generateFilterEffects: (state: FreshnessState) => `filter-${state}`,
  getCSSVariablesObject: (state: FreshnessState) => ({ '--test-var': state }),
  hasParticleEffects: (state: FreshnessState) => ['新規', '期限間近', '期限切れ'].includes(state),
  getParticleConfig: (state: FreshnessState) => ({
    count: 3,
    size: '2px',
    color: 'rgba(0,0,0,0.5)',
    animation: 'test-animation',
    duration: '2s',
  }),
}));

describe('VisualEffectEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders with correct freshness class', () => {
    render(
      <VisualEffectEngine freshnessState="新規">
        <div>Test content</div>
      </VisualEffectEngine>
    );

    const container = screen.getByText('Test content').parentElement;
    expect(container).toHaveClass('freshness-新規');
    expect(container).toHaveAttribute('data-freshness-state', '新規');
  });

  it('applies transition classes during state change', async () => {
    const { rerender } = render(
      <VisualEffectEngine freshnessState="新規" previousState="期限接近">
        <div>Test content</div>
      </VisualEffectEngine>
    );

    const container = screen.getByText('Test content').parentElement;
    expect(container).toHaveAttribute('data-transitioning', 'true');

    // Wait for transition to complete
    await waitFor(() => {
      expect(container).toHaveAttribute('data-transitioning', 'false');
    }, { timeout: 1000 });
  });

  it('applies revealed class for tombstone state', () => {
    render(
      <VisualEffectEngine freshnessState="期限切れ" isRevealed={true}>
        <div>Test content</div>
      </VisualEffectEngine>
    );

    const container = screen.getByText('Test content').parentElement;
    expect(container).toHaveClass('revealed');
    expect(container).toHaveAttribute('data-revealed', 'true');
  });
});

describe('ParticleEffect', () => {
  it('renders particles for supported freshness states', () => {
    render(<ParticleEffect freshnessState="新規" />);
    
    const container = document.querySelector('.particle-container');
    expect(container).toBeInTheDocument();
    
    const particles = document.querySelectorAll('.particle');
    expect(particles.length).toBeGreaterThan(0);
  });

  it('does not render particles for unsupported states', () => {
    render(<ParticleEffect freshnessState="期限接近" />);
    
    const container = document.querySelector('.particle-container');
    expect(container).not.toBeInTheDocument();
  });

  it('does not render when inactive', () => {
    render(<ParticleEffect freshnessState="新規" isActive={false} />);
    
    const container = document.querySelector('.particle-container');
    expect(container).not.toBeInTheDocument();
  });
});

describe('VisualEffectWrapper', () => {
  it('renders children with visual effects applied', () => {
    render(
      <VisualEffectWrapper freshnessState="新規">
        <div>Wrapped content</div>
      </VisualEffectWrapper>
    );

    expect(screen.getByText('Wrapped content')).toBeInTheDocument();
    expect(screen.getByTestId('visual-effect-content')).toBeInTheDocument();
  });

  it('handles click events when onClick is provided', () => {
    const handleClick = vi.fn();
    
    render(
      <VisualEffectWrapper freshnessState="期限切れ" onClick={handleClick}>
        <div>Clickable content</div>
      </VisualEffectWrapper>
    );

    const content = screen.getByTestId('visual-effect-content');
    expect(content).toHaveClass('cursor-pointer');
    
    fireEvent.click(content);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('calls onStateChange when state changes', async () => {
    const handleStateChange = vi.fn();
    
    const { rerender } = render(
      <VisualEffectWrapper 
        freshnessState="新規" 
        onStateChange={handleStateChange}
      >
        <div>Content</div>
      </VisualEffectWrapper>
    );

    rerender(
      <VisualEffectWrapper 
        freshnessState="期限接近" 
        onStateChange={handleStateChange}
      >
        <div>Content</div>
      </VisualEffectWrapper>
    );

    await waitFor(() => {
      expect(handleStateChange).toHaveBeenCalled();
    });
  });
});