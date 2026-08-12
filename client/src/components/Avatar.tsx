import React, { useMemo } from 'react';

interface AvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

// Simple deterministic hash
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

// Generate deterministic shapes/colors based on hash
export const Avatar: React.FC<AvatarProps> = ({ seed, size = 48, className = '' }) => {
  const hash = hashString(seed);
  
  const colors = [
    '#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6',
    '#FB923C', '#4ADE80', '#2DD4BF', '#38BDF8', '#818CF8', '#E879F9'
  ];
  
  const bg = colors[Math.abs(hash) % colors.length];
  const fg = colors[Math.abs(hash * 13) % colors.length];
  
  // Decide which shapes to draw deterministically
  const showCircle = Math.abs(hash) % 2 === 0;
  const showRect = Math.abs(hash * 7) % 2 === 0;
  const showTriangle = Math.abs(hash * 11) % 2 === 0;
  
  const cx = 50 + (Math.abs(hash * 3) % 40) - 20;
  const cy = 50 + (Math.abs(hash * 5) % 40) - 20;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-full shadow-inner ${className}`}
      style={{ backgroundColor: bg }}
    >
      {/* Base blobs */}
      <circle cx="50" cy="50" r="40" fill={fg} opacity="0.4" />
      <circle cx={cx} cy={cy} r="30" fill={fg} opacity="0.6" />
      
      {showCircle && (
         <circle cx={100 - cx} cy={100 - cy} r="20" fill="#ffffff" opacity="0.8" />
      )}
      
      {showRect && (
        <rect x={cx - 10} y={100 - cy - 10} width="30" height="30" rx="5" fill="#ffffff" opacity="0.7" transform={`rotate(${hash % 90} ${cx} ${100-cy})`} />
      )}
      
      {showTriangle && (
        <polygon points="50,20 80,80 20,80" fill={fg} opacity="0.8" transform={`rotate(${hash % 180} 50 50) scale(0.5)`} />
      )}
      
      {/* Face features (eyes) */}
      <circle cx="35" cy="45" r="4" fill="#1e293b" />
      <circle cx="65" cy="45" r="4" fill="#1e293b" />
      
      {/* Mouth */}
      <path 
        d={`M 35 ${55 + (hash%10)} Q 50 ${70 + (hash%20)} 65 ${55 + (hash%10)}`} 
        fill="none" 
        stroke="#1e293b" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
    </svg>
  );
};
