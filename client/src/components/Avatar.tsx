import React from 'react';

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
  return Math.abs(hash);
};

export const Avatar: React.FC<AvatarProps> = ({ seed, size = 48, className = '' }) => {
  const hash = hashString(seed || 'default');
  const floatClass = hash % 3 === 0 ? 'animate-float-slow' : hash % 3 === 1 ? 'animate-float-medium' : 'animate-float-fast';

  // We use DiceBear's Micah style for a highly polished, creative, and gender-neutral look.
  const url = `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f97316,f59e0b,10b981,06b6d4,8b5cf6,ec4899`;

  return (
    <img
      src={url}
      width={size}
      height={size}
      alt="Player Avatar"
      className={`rounded-full shadow-inner select-none ${floatClass} ${className}`}
    />
  );
};
