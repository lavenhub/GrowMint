import React from 'react';

// Simple visual replay of keystroke events as animated dots across a horizontal bar
// The component receives the total keystroke count (or any proxy) and renders up to 100 dots
// to avoid overwhelming the UI. Dots are spaced evenly and each animates a subtle pulse.
export default function KeystrokeReplay({ keystrokeCount }) {
  const maxDots = 100;
  const dotCount = Math.min(keystrokeCount, maxDots);
  const dots = Array.from({ length: dotCount }, (_, i) => i);

  return (
    <div className="keystroke-replay">
      {dots.map(i => (
        <span
          key={i}
          className="keystroke-dot"
          style={{ left: `${(i / dotCount) * 100}%` }}
        />
      ))}
    </div>
  );
}
