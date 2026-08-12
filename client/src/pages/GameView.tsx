import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { TopBar } from '../components/TopBar';
import { ChatSidebar } from '../components/ChatSidebar';
import { Trophy, ArrowRight, MessageSquare } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { ReactionPayload } from '@chitrakari/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { audioEngine } from '../utils/AudioEngine';

export function GameView() {
  const { roomState, socket, me } = useSocket();
  const [activeReactions, setActiveReactions] = useState<(ReactionPayload & { id: string })[]>([]);

  useEffect(() => {
     if (!socket) return;
     const handleReaction = (payload: ReactionPayload) => {
        const reactionObj = { ...payload, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() };
        setActiveReactions(prev => [...prev, reactionObj]);
        
        // Remove after animation finishes (2s)
        setTimeout(() => {
           setActiveReactions(prev => prev.filter(r => r.id !== reactionObj.id));
        }, 2000);
     };

     socket.on('reaction_received', handleReaction);
     return () => {
        socket.off('reaction_received', handleReaction);
     };
  }, [socket]);

  useEffect(() => {
     if (roomState?.phase === 'drawing') {
        audioEngine.playTurnStart();
     }
     if (roomState?.phase === 'game_end') {
        audioEngine.playFanfare();
     }
  }, [roomState?.phase]);

  if (!roomState || !me) return null;

  const isDrawer = roomState.currentDrawerId === me.id;
  const drawerName = roomState.players.find(p => p.id === roomState.currentDrawerId)?.name || 'Someone';

  const handleWordSelect = (word: string) => {
    if (socket) {
      socket.emit('choose_word', { roomId: roomState.id, word });
    }
  };

  const renderPhaseOverlay = () => {
    return (
      <AnimatePresence>
        {roomState.phase === 'choosing_word' && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 z-50 bg-paper-900/80 backdrop-blur-sm flex items-center justify-center rounded-3xl"
           >
             {isDrawer ? (
               <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white dark:bg-paper-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-soft dark:shadow-soft-dark max-w-lg w-full text-center"
               >
                 <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Choose a Word</h2>
                 <p className="text-slate-500 dark:text-slate-400 mb-6">You have {roomState.timeRemaining}s to pick</p>
                 <div className="grid gap-3">
                    {roomState.wordChoices?.map(word => (
                      <button 
                        key={word}
                        onClick={() => handleWordSelect(word)}
                        className="w-full py-4 bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white border border-primary-200 dark:border-primary-500/50 rounded-2xl text-xl font-bold tracking-widest uppercase transition-all hover:scale-105 active:scale-95"
                      >
                        {word}
                      </button>
                    ))}
                 </div>
               </motion.div>
             ) : (
               <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-center animate-pulse"
               >
                  <div className="text-4xl font-bold text-primary-500 mb-2">{drawerName}</div>
                  <div className="text-xl text-slate-200">is choosing a word...</div>
               </motion.div>
             )}
           </motion.div>
        )}

        {roomState.phase === 'turn_end' && roomState.turnSummary && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 z-50 bg-paper-900/90 backdrop-blur-md flex items-center justify-center rounded-3xl"
           >
             <motion.div 
               initial={{ scale: 0.5, rotate: -5 }}
               animate={{ scale: 1, rotate: 0 }}
               transition={{ type: "spring", bounce: 0.5 }}
               className="bg-white dark:bg-paper-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-soft dark:shadow-soft-dark max-w-lg w-full text-center"
             >
               <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">The word was</h2>
                <div className="text-5xl font-black text-secondary-500 uppercase tracking-widest mb-8">{roomState.turnSummary.word}</div>
                
                <div className="grid gap-3 mb-6 max-h-64 overflow-y-auto w-full max-w-md mx-auto">
                   {Object.entries(roomState.turnSummary.guesserPoints).length > 0 ? (
                      Object.entries(roomState.turnSummary.guesserPoints).map(([pid, pts]) => {
                         const p = roomState.players.find(x => x.id === pid);
                         if (!p) return null;
                         return (
                            <div key={pid} className="flex items-center justify-between bg-white dark:bg-paper-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                               <div className="flex items-center gap-3">
                                  <Avatar seed={p.avatarSeed} size={32} />
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{p.name}</span>
                               </div>
                               <span className="text-emerald-500 font-bold">+{pts}</span>
                            </div>
                         );
                      })
                   ) : (
                      <div className="text-slate-400 font-bold italic">No one guessed it!</div>
                   )}
                   {roomState.turnSummary.drawerPoints > 0 && (
                      <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-700/50 mt-2">
                         <div className="flex items-center gap-3">
                            <span className="text-xl">🖌️</span>
                            <span className="font-bold text-amber-700 dark:text-amber-400">Drawer Bonus</span>
                         </div>
                         <span className="text-amber-600 dark:text-amber-400 font-bold">+{roomState.turnSummary.drawerPoints}</span>
                      </div>
                   )}
                </div>

                <div className="flex items-center justify-center gap-4 text-slate-600 dark:text-slate-300 font-bold animate-pulse">
                   Next turn starting in {roomState.timeRemaining}s...
                </div>
              </motion.div>
            </motion.div>
         )}

         {roomState.phase === 'drawing' && roomState.timeRemaining <= 5 && roomState.timeRemaining > 0 && (
            <motion.div 
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 1.5, opacity: 0 }}
               key={roomState.timeRemaining}
               className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            >
               <div className="text-9xl font-black text-red-500 opacity-30 drop-shadow-2xl">
                  {roomState.timeRemaining}
               </div>
            </motion.div>
         )}
        
        {roomState.phase === 'game_end' && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="absolute inset-0 z-50 bg-paper-950/95 backdrop-blur-lg flex items-center justify-center rounded-3xl p-6"
           >
             <div className="max-w-2xl w-full text-center">
               <motion.div 
                 initial={{ scale: 0 }} 
                 animate={{ scale: 1 }} 
                 transition={{ delay: 0.2, type: "spring" }}
               >
                 <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-6 drop-shadow-2xl" />
               </motion.div>
               
               <motion.h1 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  transition={{ delay: 0.4 }}
                  className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-200 to-amber-600 mb-2"
               >
                  {(() => {
                     const sorted = [...roomState.players].sort((a,b) => b.score - a.score);
                     return sorted[0].name;
                  })()} Wins!
               </motion.h1>
               
               <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   transition={{ delay: 0.8 }}
                   className="flex justify-center items-end gap-2 sm:gap-6 mb-10 mt-16 h-48"
                >
                   {(() => {
                      const sorted = [...roomState.players].sort((a,b) => b.score - a.score);
                      const podium = [sorted[1], sorted[0], sorted[2]].filter(Boolean); // Order: 2nd, 1st, 3rd
                      
                      return podium.map((p, idx) => {
                         const isFirst = p.id === sorted[0]?.id;
                         const isSecond = p.id === sorted[1]?.id;
                         
                         const height = isFirst ? 'h-48' : isSecond ? 'h-36' : 'h-24';
                         const color = isFirst ? 'bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-600/40 dark:to-amber-500/20 border-amber-300' :
                                       isSecond ? 'bg-gradient-to-t from-slate-300 to-slate-100 dark:from-slate-600/40 dark:to-slate-500/20 border-slate-300' :
                                       'bg-gradient-to-t from-orange-300 to-orange-100 dark:from-orange-700/40 dark:to-orange-600/20 border-orange-300';
                         
                         const rank = isFirst ? '1st' : isSecond ? '2nd' : '3rd';
                         const delay = isFirst ? 1.5 : isSecond ? 1.2 : 1.0;

                         return (
                            <motion.div 
                              key={p.id} 
                              initial={{ y: 50, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay, type: 'spring' }}
                              className={`w-24 sm:w-32 ${height} ${color} rounded-t-xl border-t-4 border-l-2 border-r-2 flex flex-col items-center justify-start pt-4 relative shadow-lg`}
                            >
                               <div className="absolute -top-12">
                                  <Avatar seed={p.avatarSeed} size={isFirst ? 64 : 48} className={isFirst ? 'ring-4 ring-amber-400' : ''} />
                               </div>
                               <div className={`font-black mt-2 ${isFirst ? 'text-amber-600 dark:text-amber-400 text-xl' : 'text-slate-600 dark:text-slate-300'}`}>{rank}</div>
                               <div className="font-bold text-slate-800 dark:text-white truncate w-full px-2 text-center text-sm">{p.name}</div>
                               <div className="text-primary-600 dark:text-primary-400 font-mono font-bold mt-auto pb-4">{p.score}</div>
                            </motion.div>
                         );
                      });
                   })()}
                </motion.div>
               
               {me.isHost && (
                  <motion.button 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    transition={{ delay: 2 }}
                    onClick={() => socket?.emit('start_game', { roomId: roomState.id })}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-bold rounded-2xl shadow-lg hover:bg-primary-600 hover:scale-105 active:scale-95 transition-all text-xl"
                  >
                     Play Next Match (Round 1)
                     <ArrowRight className="w-6 h-6" />
                  </motion.button>
               )}
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-paper-100 dark:bg-paper-950 p-2 md:p-4 flex flex-col gap-4">
      <TopBar />
      
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 flex-1 h-0 min-h-[600px] relative">
         <div className="flex-1 md:flex-[2] relative rounded-3xl overflow-hidden shadow-soft dark:shadow-soft-dark border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-paper-800">
            <DrawingCanvas isDrawer={isDrawer} drawerName={drawerName} roomId={roomState.id} />
            {renderPhaseOverlay()}
            
            {/* Floating Reactions Layer */}
            <div className="absolute bottom-0 right-4 md:right-10 pointer-events-none z-40 w-16 h-full overflow-visible">
               {activeReactions.map((r, i) => (
                  <div 
                     key={r.id} 
                     className="absolute bottom-0 animate-float text-4xl drop-shadow-lg"
                     style={{ 
                        left: `${Math.random() * 40 - 20}px`,
                        animationDelay: `${Math.random() * 0.2}s`
                     }}
                  >
                     {r.emoji}
                  </div>
               ))}
            </div>
         </div>
         
         <div className="flex-1 md:flex-1 flex min-h-[300px] md:min-h-0 bg-paper-100/95 dark:bg-paper-950/95">
             <ChatSidebar />
         </div>
      </div>
    </div>
  );
}
