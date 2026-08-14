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

const FACE_COLORS = [
  '#FF9933', // Indian Saffron / Warm Orange
  '#FFD13B', // Sunny Yellow
  '#FF6B8B', // Rani / Coral Pink
  '#2EC4B6', // Fresh Teal
  '#4ADE80', // Mint Green
  '#38BDF8', // Sky Blue
  '#A78BFA', // Soft Violet
  '#F472B6', // Bubblegum Pink
  '#FB923C', // Bright Amber
  '#60A5FA', // Dodger Blue
  '#F87171', // Ruby Red
  '#34D399'  // Emerald
];

export const Avatar: React.FC<AvatarProps> = ({ seed, size = 48, className = '' }) => {
  const hash = hashString(seed || 'default');

  const bg = FACE_COLORS[hash % FACE_COLORS.length];
  const eyeType = (hash >> 2) % 8;
  const mouthType = (hash >> 5) % 8;
  const accessoryType = (hash >> 8) % 6;
  const hasBlush = (hash >> 3) % 2 === 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-full shadow-inner select-none ${className}`}
      style={{ backgroundColor: bg }}
    >
      {/* Head outline subtle shading */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="#000000" strokeWidth="4" strokeOpacity="0.15" />

      {/* Hair / Headgear / Accessory */}
      {accessoryType === 1 && (
        /* Artist Beret */
        <g>
          <path d="M 20 28 Q 50 8 80 28 Q 50 36 20 28 Z" fill="#1e293b" />
          <circle cx="50" cy="14" r="3" fill="#1e293b" />
        </g>
      )}

      {accessoryType === 2 && (
        /* Cute Doodle Hair Tuft */
        <path d="M 45 15 Q 50 2 56 12 Q 62 4 60 16" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      )}

      {accessoryType === 3 && (
        /* Tilak / Bindi */
        <g>
          <circle cx="50" cy="28" r="4" fill="#dc2626" />
          <path d="M 50 22 L 50 26" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {accessoryType === 4 && (
        /* Doodle Cap */
        <g>
          <path d="M 22 30 Q 50 12 78 30 Z" fill="#2563eb" />
          <path d="M 70 30 Q 92 32 94 36 Q 80 40 70 34" fill="#1d4ed8" />
        </g>
      )}

      {accessoryType === 5 && (
        /* Star Earring / Headband */
        <path d="M 20 32 Q 50 22 80 32" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
      )}

      {/* Blush Cheeks */}
      {hasBlush && (
        <g opacity="0.45">
          <ellipse cx="24" cy="54" rx="7" ry="4" fill="#ef4444" />
          <ellipse cx="76" cy="54" rx="7" ry="4" fill="#ef4444" />
        </g>
      )}

      {/* Eyes Styles */}
      {eyeType === 0 && (
        /* Happy ^ ^ eyes */
        <g stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M 28 44 Q 36 34 44 44" />
          <path d="M 56 44 Q 64 34 72 44" />
        </g>
      )}

      {eyeType === 1 && (
        /* Big Cartoon Pupils with shine */
        <g fill="#1e293b">
          <circle cx="36" cy="42" r="7" />
          <circle cx="64" cy="42" r="7" />
          <circle cx="34" cy="40" r="2.5" fill="#ffffff" />
          <circle cx="62" cy="40" r="2.5" fill="#ffffff" />
        </g>
      )}

      {eyeType === 2 && (
        /* Cool Round Glasses 🤓 */
        <g stroke="#1e293b" strokeWidth="3.5" fill="rgba(255,255,255,0.4)">
          <circle cx="35" cy="42" r="10" />
          <circle cx="65" cy="42" r="10" />
          <line x1="45" y1="42" x2="55" y2="42" />
          <circle cx="35" cy="42" r="3" fill="#1e293b" stroke="none" />
          <circle cx="65" cy="42" r="3" fill="#1e293b" stroke="none" />
        </g>
      )}

      {eyeType === 3 && (
        /* Cool Dark Sunglasses / Chashma 😎 */
        <g fill="#0f172a" stroke="#000000" strokeWidth="2">
          <path d="M 22 36 L 46 36 L 44 48 Q 34 52 24 48 Z" />
          <path d="M 54 36 L 78 36 L 76 48 Q 66 52 56 48 Z" />
          <line x1="46" y1="40" x2="54" y2="40" stroke="#0f172a" strokeWidth="3" />
          {/* Glasses glint */}
          <line x1="26" y1="40" x2="32" y2="46" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <line x1="58" y1="40" x2="64" y2="46" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </g>
      )}

      {eyeType === 4 && (
        /* Winking Eye (> o) */
        <g stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M 28 38 L 40 44 L 28 50" />
          <circle cx="64" cy="42" r="6" fill="#1e293b" stroke="none" />
          <circle cx="62" cy="40" r="2" fill="#ffffff" stroke="none" />
        </g>
      )}

      {eyeType === 5 && (
        /* Surprised Wide Open O O */
        <g stroke="#1e293b" strokeWidth="3.5" fill="#ffffff">
          <circle cx="36" cy="42" r="8" />
          <circle cx="64" cy="42" r="8" />
          <circle cx="36" cy="42" r="3.5" fill="#1e293b" />
          <circle cx="64" cy="42" r="3.5" fill="#1e293b" />
        </g>
      )}

      {eyeType === 6 && (
        /* Star Eyes (* *) */
        <g fill="#f59e0b" stroke="#1e293b" strokeWidth="1.5">
          <path d="M 36 34 L 38 40 L 44 42 L 38 44 L 36 50 L 34 44 L 28 42 L 34 40 Z" />
          <path d="M 64 34 L 66 40 L 72 42 L 66 44 L 64 50 L 62 44 L 56 42 L 62 40 Z" />
        </g>
      )}

      {eyeType === 7 && (
        /* Cute Curved Closed Eyes */
        <g stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M 28 42 Q 36 50 44 42" />
          <path d="M 56 42 Q 64 50 72 42" />
        </g>
      )}

      {/* Mouth & Mustache Styles */}
      {mouthType === 0 && (
        /* Big Open Happy Grin with Tongue */
        <g>
          <path d="M 32 58 Q 50 82 68 58 Z" fill="#dc2626" stroke="#1e293b" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M 42 70 Q 50 64 58 70 Q 50 80 42 70 Z" fill="#f472b6" />
        </g>
      )}

      {mouthType === 1 && (
        /* Classic Sweet Smile */
        <path d="M 34 60 Q 50 74 66 60" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      )}

      {mouthType === 2 && (
        /* Tongue Sticking Out Cheeky 😛 */
        <g>
          <path d="M 32 60 Q 50 72 68 60" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          <path d="M 44 65 Q 44 78 50 78 Q 56 78 56 65 Z" fill="#f43f5e" stroke="#1e293b" strokeWidth="2.5" />
          <line x1="50" y1="66" x2="50" y2="73" stroke="#be123c" strokeWidth="1.5" />
        </g>
      )}

      {mouthType === 3 && (
        /* Indian Curved Mustache (Mooch) + Smile 👨 */
        <g>
          <path d="M 30 68 Q 50 76 70 68" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
          {/* Mooch */}
          <path d="M 50 60 Q 38 52 24 58 Q 36 66 50 61 Q 64 66 76 58 Q 62 52 50 60 Z" fill="#1e293b" />
        </g>
      )}

      {mouthType === 4 && (
        /* Royal Handlebar Mustache (Raja Style Mooch) */
        <g>
          <path d="M 50 62 Q 34 54 20 62 Q 16 54 22 50 Q 36 56 50 60 Q 64 56 78 50 Q 84 54 80 62 Q 66 54 50 62 Z" fill="#0f172a" />
          <circle cx="50" cy="68" r="3" fill="#dc2626" />
        </g>
      )}

      {mouthType === 5 && (
        /* Toothy Silly Grid Smile 😬 */
        <g>
          <rect x="32" y="58" width="36" height="14" rx="7" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
          <line x1="44" y1="58" x2="44" y2="72" stroke="#1e293b" strokeWidth="2" />
          <line x1="56" y1="58" x2="56" y2="72" stroke="#1e293b" strokeWidth="2" />
          <line x1="32" y1="65" x2="68" y2="65" stroke="#1e293b" strokeWidth="2" />
        </g>
      )}

      {mouthType === 6 && (
        /* Cute Surprised 'o' */
        <ellipse cx="50" cy="65" rx="6" ry="8" fill="#1e293b" />
      )}

      {mouthType === 7 && (
        /* Smirk / Chill Grin 😏 */
        <path d="M 36 66 Q 52 68 66 56" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      )}
    </svg>
  );
};
