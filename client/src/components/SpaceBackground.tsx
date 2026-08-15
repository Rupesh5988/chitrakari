import React, { useMemo } from 'react';

// Generates a random box-shadow string for N stars
const generateStars = (count: number) => {
   let shadow = '';
   for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * 100); // vw
      const y = Math.floor(Math.random() * 100); // vh
      const size = Math.random() * 2; // px
      const opacity = 0.4 + Math.random() * 0.6;
      shadow += `${x}vw ${y}vh 0 ${size}px rgba(255, 255, 255, ${opacity})${i < count - 1 ? ',' : ''}`;
   }
   return shadow;
};

export function SpaceBackground() {
   // Generate starfields once to prevent re-rendering flicker
   const starsLayer1 = useMemo(() => generateStars(100), []);
   const starsLayer2 = useMemo(() => generateStars(80), []);
   const starsLayer3 = useMemo(() => generateStars(40), []);

   return (
      <div className="fixed inset-0 -z-50 pointer-events-none bg-[#0a0a1a] overflow-hidden">
         {/* Subtle background gradient to add a tiny bit of depth without being heavy */}
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-fuchsia-900/10" />

         {/* Static Base Stars */}
         <div 
            className="absolute inset-0 w-[1px] h-[1px] opacity-60" 
            style={{ boxShadow: starsLayer1 }} 
         />
         
         {/* Twinkling Stars (Slow) */}
         <div 
            className="absolute inset-0 w-[2px] h-[2px] animate-pulse-slow opacity-70" 
            style={{ boxShadow: starsLayer2 }} 
         />
         
         {/* Twinkling Stars (Fast) */}
         <div 
            className="absolute inset-0 w-[2.5px] h-[2.5px] animate-pulse-fast opacity-80" 
            style={{ boxShadow: starsLayer3 }} 
         />
      </div>
   );
}
