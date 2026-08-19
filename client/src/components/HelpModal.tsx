import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, MessageSquare, Trophy, MousePointer2 } from 'lucide-react';

interface HelpModalProps {
   isOpen: boolean;
   onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
   useEffect(() => {
      if (!isOpen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, onClose]);

   return createPortal(
      <AnimatePresence>
         {isOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
               <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="glass-card rounded-3xl w-full max-w-xl shadow-2xl border border-white/15 overflow-hidden flex flex-col max-h-[90vh]"
               >
                  <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                     <h2 className="text-lg sm:text-xl font-heading font-black text-white flex items-center gap-2.5">
                        <span className="text-2xl">🎨</span> How to Play Chitrakari
                     </h2>
                     <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-full border border-white/10 transition-colors"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </div>

                  <div className="p-4 sm:p-5 overflow-y-auto scrollbar-thin space-y-4 text-xs">
                     <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                           <div className="flex items-center gap-2.5 mb-2.5">
                              <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg shadow-sm">
                                 <Palette className="w-4 h-4" />
                              </div>
                              <h3 className="font-bold text-amber-300">When Drawing</h3>
                           </div>
                           <ul className="space-y-1.5 text-slate-300 leading-relaxed">
                              <li>• Pick 1 of 3 words from your choices.</li>
                              <li>• Sketch it using brushes, fills, and shapes.</li>
                              <li>• <strong className="text-amber-200">Don't write out letters!</strong></li>
                           </ul>
                        </div>

                        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                           <div className="flex items-center gap-2.5 mb-2.5">
                              <div className="p-1.5 bg-emerald-400 text-slate-950 rounded-lg shadow-sm">
                                 <MessageSquare className="w-4 h-4" />
                              </div>
                              <h3 className="font-bold text-emerald-300">When Guessing</h3>
                           </div>
                           <ul className="space-y-1.5 text-slate-300 leading-relaxed">
                              <li>• Watch the drawing & type guesses in chat.</li>
                              <li>• Check for 🔥 Hot / Warm proximity hints.</li>
                              <li>• Fastest correct guesses get max points!</li>
                           </ul>
                        </div>
                     </div>

                     <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
                        <div className="flex items-center gap-2.5 mb-2">
                           <div className="p-1.5 bg-indigo-400 text-slate-950 rounded-lg shadow-sm">
                              <Trophy className="w-4 h-4" />
                           </div>
                           <h3 className="font-bold text-indigo-300">Scoring & Winning</h3>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                           The match finishes after all rounds complete. Highest total score takes the podium gold! Artists score bonus points when more guessers figure out their sketch.
                        </p>
                     </div>
                  </div>

                  <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-white/[0.02] text-center">
                     <button
                        onClick={onClose}
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-2.5 px-7 rounded-xl text-xs shadow-md glow-emerald transition-all active:scale-95"
                     >
                        Got it, let's play!
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>,
      document.body
   );
};
