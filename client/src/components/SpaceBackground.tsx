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
      <div className="fixed inset-0 -z-50 pointer-events-none bg-paper-950 overflow-hidden">
         {/* Static Base Stars */}
         <div 
            className="absolute inset-0 w-[1px] h-[1px]" 
            style={{ boxShadow: starsLayer1 }} 
         />
         
         {/* Twinkling Stars (Slow) */}
         <div 
            className="absolute inset-0 w-[2px] h-[2px] animate-pulse-slow opacity-80" 
            style={{ boxShadow: starsLayer2 }} 
         />
         
         {/* Twinkling Stars (Fast) */}
         <div 
            className="absolute inset-0 w-[2.5px] h-[2.5px] animate-pulse-fast opacity-90" 
            style={{ boxShadow: starsLayer3 }} 
         />

         {/* Nebulae / Galatic Dust blobs */}
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[100px] rounded-full mix-blend-screen" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-600/15 blur-[120px] rounded-full mix-blend-screen" />
         <div className="absolute top-[30%] left-[60%] w-[30%] h-[40%] bg-indigo-600/20 blur-[100px] rounded-full mix-blend-screen" />

         {/* Celestial Bodies */}
         {/* Subtle moon in top right */}
         <div className="absolute top-[10%] right-[15%] w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-slate-300 opacity-[0.15] shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.5)]" />
         
         {/* Ringed planet in bottom left */}
         <div className="absolute bottom-[15%] left-[10%] opacity-[0.15]">
            {/* Planet Body */}
            <div className="absolute w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-amber-900 to-amber-700 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[inset_-15px_-15px_30px_rgba(0,0,0,0.6)]" />
            {/* Planet Ring */}
            <div className="absolute w-32 h-8 sm:w-48 sm:h-12 border-[4px] border-amber-600/30 rounded-[100%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12" />
         </div>
      </div>
   );
}
