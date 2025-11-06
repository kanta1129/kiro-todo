'use client';

import React, { useState } from 'react';
import type { FreshnessState } from '../../types';
import { VisualEffectWrapper } from './VisualEffectWrapper';

const FRESHNESS_STATES: FreshnessState[] = ['新規', '期限接近', '期限間近', '期限切れ'];

/**
 * Demo component to showcase visual effects for different freshness states
 * Requirements: 1.3, 2.2, 2.3, 3.2
 */
export function VisualEffectsDemo() {
  const [selectedState, setSelectedState] = useState<FreshnessState>('新規');
  const [isRevealed, setIsRevealed] = useState(false);

  const handleStateChange = (newState: FreshnessState, previousState?: FreshnessState) => {
    console.log(`State changed from ${previousState} to ${newState}`);
  };

  const handleTombstoneClick = () => {
    if (selectedState === '期限切れ') {
      setIsRevealed(!isRevealed);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Visual Effects Demo</h2>
      
      {/* State Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Select Freshness State:</label>
        <div className="flex gap-2">
          {FRESHNESS_STATES.map((state) => (
            <button
              key={state}
              onClick={() => {
                setSelectedState(state);
                setIsRevealed(false);
              }}
              className={`px-3 py-1 rounded text-sm ${
                selectedState === state
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Effect Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current State: {selectedState}</h3>
        
        <VisualEffectWrapper
          freshnessState={selectedState}
          isRevealed={isRevealed}
          onStateChange={handleStateChange}
          onClick={handleTombstoneClick}
          className="p-6 border-2 rounded-lg transition-all duration-300"
        >
          <div className="space-y-2">
            <h4 className="font-medium">Sample Task</h4>
            <p className="text-sm opacity-75">
              This is a sample task showing the {selectedState} freshness state.
            </p>
            <div className="text-xs opacity-50">
              {selectedState === '期限切れ' && !isRevealed && 'Click to reveal content'}
              {selectedState === '期限切れ' && isRevealed && 'Content revealed!'}
            </div>
          </div>
        </VisualEffectWrapper>
      </div>

      {/* State Descriptions */}
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold">State Descriptions:</h3>
        <ul className="space-y-1 text-gray-600">
          <li><strong>新規:</strong> Fresh tasks with vibrant colors and glow effects</li>
          <li><strong>期限接近:</strong> Tasks approaching deadline with reduced saturation</li>
          <li><strong>期限間近:</strong> Urgent tasks with decay effects and mold appearance</li>
          <li><strong>期限切れ:</strong> Overdue tasks in tombstone mode (click to reveal)</li>
        </ul>
      </div>
    </div>
  );
}

export default VisualEffectsDemo;