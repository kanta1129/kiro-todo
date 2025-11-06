'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { FreshnessState } from '../../types';
import { getParticleConfig, hasParticleEffects } from '../../lib/visualEffects';

interface ParticleEffectProps {
  freshnessState: FreshnessState;
  isActive?: boolean;
  className?: string;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  delay: number;
}

/**
 * ParticleEffect component for adding dynamic particle animations
 * Requirements: 1.3, 2.2, 2.3, 3.2
 */
export function ParticleEffect({ 
  freshnessState, 
  isActive = true, 
  className = '' 
}: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const particleConfig = useMemo(() => {
    return hasParticleEffects(freshnessState) ? getParticleConfig(freshnessState) : null;
  }, [freshnessState]);

  useEffect(() => {
    if (!isActive || !particleConfig) {
      setParticles([]);
      return;
    }

    // Generate particles with random positions
    const newParticles: Particle[] = Array.from({ length: particleConfig.count }, (_, i) => ({
      id: `particle-${i}-${Date.now()}`,
      x: Math.random() * 100, // Percentage
      y: Math.random() * 100, // Percentage
      size: Math.random() * 0.5 + 0.5, // 0.5 to 1.0 multiplier
      delay: Math.random() * 2, // 0 to 2 seconds delay
    }));

    setParticles(newParticles);
  }, [freshnessState, isActive, particleConfig]);

  if (!isActive || !particleConfig || particles.length === 0) {
    return null;
  }

  const getParticleClassName = () => {
    switch (freshnessState) {
      case '新規':
        return 'particle-sparkle';
      case '期限間近':
        return 'particle-mold';
      case '期限切れ':
        return 'particle-dust';
      default:
        return '';
    }
  };

  return (
    <div className={`particle-container ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`particle ${getParticleClassName()}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `calc(${particleConfig.size} * ${particle.size})`,
            height: `calc(${particleConfig.size} * ${particle.size})`,
            animationDelay: `${particle.delay}s`,
            animationDuration: particleConfig.duration,
          }}
        />
      ))}
    </div>
  );
}

export default ParticleEffect;