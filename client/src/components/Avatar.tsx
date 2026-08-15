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

  // We use DiceBear's Avataaars style for a highly polished, attractive, and varied look!
  // It guarantees maximum variety up to millions of players while looking complete and professional.
  const url = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

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
