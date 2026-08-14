import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const INDIAN_COLORS = ['#f97316', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

export const Confetti = () => {
   const [particles, setParticles] = useState<any[]>([]);

   useEffect(() => {
      const newParticles = Array.from({ length: 80 }).map((_, i) => ({
         id: i,
         x: Math.random() * 100,
         y: -20 - Math.random() * 100,
         rotation: Math.random() * 360,
         scale: 0.5 + Math.random() * 0.8,
         color: INDIAN_COLORS[Math.floor(Math.random() * INDIAN_COLORS.length)],
         delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);
   }, []);

   return (
      <div className="fixed inset-0 pointer-events-none z-[110] overflow-hidden">
         {particles.map((p) => (
            <motion.div
               key={p.id}
               initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: p.rotation, scale: p.scale }}
               animate={{ 
                  y: '120vh', 
                  x: `${p.x + (Math.random() > 0.5 ? 10 : -10)}vw`,
                  rotate: p.rotation + 360 
               }}
               transition={{ 
                  duration: 2.5 + Math.random() * 2, 
                  delay: p.delay, 
                  ease: "easeOut" 
               }}
               style={{ backgroundColor: p.color }}
               className="absolute w-3 h-3 rounded-sm shadow-sm"
            />
         ))}
      </div>
   );
};
