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
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
               <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white dark:bg-paper-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]"
               >
                  <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50 dark:bg-paper-900/50">
                     <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="text-3xl">🎨</span> How to Play Chitrakari
                     </h2>
                     <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-paper-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                     >
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="p-4 sm:p-6 overflow-y-auto scrollbar-thin space-y-6">
                     <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-amber-50 dark:bg-amber-500/10 p-5 rounded-2xl border border-amber-200 dark:border-amber-500/20">
                           <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                                 <Palette className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-amber-900 dark:text-amber-400">When Drawing</h3>
                           </div>
                           <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200/80 font-medium">
                              <li className="flex items-start gap-2">
                                 <span className="text-amber-500 mt-0.5">•</span>
                                 Pick a word from the choices.
                              </li>
                              <li className="flex items-start gap-2">
                                 <span className="text-amber-500 mt-0.5">•</span>
                                 Draw it using the tools (pen, fill, sizes, colors).
                              </li>
                              <li className="flex items-start gap-2">
                                 <span className="text-amber-500 mt-0.5">•</span>
                                 <strong>Don't write the word!</strong> (It ruins the fun).
                              </li>
                           </ul>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
                           <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm">
                                 <MessageSquare className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-emerald-900 dark:text-emerald-400">When Guessing</h3>
                           </div>
                           <ul className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200/80 font-medium">
                              <li className="flex items-start gap-2">
                                 <span className="text-emerald-500 mt-0.5">•</span>
                                 Watch the drawing and type your guess in the chat.
                              </li>
                              <li className="flex items-start gap-2">
                                 <span className="text-emerald-500 mt-0.5">•</span>
                                 Watch for "Hot", "Warm", or "Cold" hints!
                              </li>
                              <li className="flex items-start gap-2">
                                 <span className="text-emerald-500 mt-0.5">•</span>
                                 Guess quickly for more points.
                              </li>
                           </ul>
                        </div>
                     </div>

                     <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/20">
                        <div className="flex items-center gap-3 mb-3">
                           <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-sm">
                              <Trophy className="w-5 h-5" />
                           </div>
                           <h3 className="font-bold text-indigo-900 dark:text-indigo-400">Winning</h3>
                        </div>
                        <p className="text-sm text-indigo-800 dark:text-indigo-200/80 font-medium">
                           The game ends after all rounds are complete. The player with the most points at the end wins! Drawers get points based on how many people guessed correctly.
                        </p>
                     </div>
                  </div>

                  <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-paper-900/50 text-center">
                     <button
                        onClick={onClose}
                        className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-transform active:scale-95"
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
