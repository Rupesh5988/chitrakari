import React from 'react';

interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularTimer({ timeRemaining, totalTime, size = 48, strokeWidth = 4 }: CircularTimerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.max(0, timeRemaining / totalTime);
  const strokeDashoffset = circumference - progress * circumference;

  let colorClass = 'text-emerald-500';
  if (timeRemaining <= 5) {
    colorClass = 'text-rose-500 animate-pulse';
  } else if (progress <= 0.3) {
    colorClass = 'text-amber-500';
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          className="text-slate-700/50 dark:text-slate-800/50"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={`transition-all duration-1000 ease-linear ${colorClass}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center font-mono font-bold text-sm ${colorClass}`}>
        {timeRemaining}
      </div>
    </div>
  );
}
