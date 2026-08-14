import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { TopBar } from '../components/TopBar';
import { ChatSidebar } from '../components/ChatSidebar';
import { Trophy, ArrowRight, MessageSquare, Home, CheckCircle2, Pencil } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { ReactionPayload } from '@chitrakari/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { audioEngine } from '../utils/AudioEngine';

export function GameView() {
   const { roomState, socket, me } = useSocket();
   const [activeReactions, setActiveReactions] = useState<(ReactionPayload & { id: string })[]>([]);
   const [showMobileChat, setShowMobileChat] = useState(false);
   const [unreadCount, setUnreadCount] = useState(0);

   useEffect(() => {
      if (!socket) return;
      const handleReaction = (payload: ReactionPayload) => {
         const reactionObj = { ...payload, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() };
         setActiveReactions(prev => [...prev, reactionObj]);
         setTimeout(() => {
            setActiveReactions(prev => prev.filter(r => r.id !== reactionObj.id));
         }, 2000);
      };

      socket.on('reaction_received', handleReaction);
      return () => {
         socket.off('reaction_received', handleReaction);
      };
   }, [socket]);

   // Track unread messages when mobile chat is closed
   useEffect(() => {
      if (!socket) return;
      const handleChatMsg = () => {
         if (!showMobileChat) {
            setUnreadCount(prev => prev + 1);
         }
      };
      socket.on('chat_message_received', handleChatMsg);
      return () => { socket.off('chat_message_received', handleChatMsg); };
   }, [socket, showMobileChat]);

   // Reset unread when opening chat
   useEffect(() => {
      if (showMobileChat) setUnreadCount(0);
   }, [showMobileChat]);

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
   const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score);

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
                        className="bg-white dark:bg-paper-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-soft dark:shadow-soft-dark max-w-lg w-[90%] text-center"
                     >
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-2">Choose a Word</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">You have {roomState.timeRemaining}s to pick</p>
                        <div className="grid gap-3">
                           {roomState.wordChoices?.map(word => (
                              <button
                                 key={word}
                                 onClick={() => handleWordSelect(word)}
                                 className="w-full py-3 sm:py-4 bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white border border-primary-200 dark:border-primary-500/50 rounded-2xl text-lg sm:text-xl font-bold tracking-widest uppercase transition-all hover:scale-105 active:scale-95"
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
                        <div className="text-3xl sm:text-4xl font-bold text-primary-500 mb-2">{drawerName}</div>
                        <div className="text-lg sm:text-xl text-slate-200">is choosing a word...</div>
                     </motion.div>
                  )}
               </motion.div>
            )}

            {roomState.phase === 'turn_end' && roomState.turnSummary && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-paper-900/90 backdrop-blur-md flex items-center justify-center rounded-3xl p-4"
               >
                  <motion.div
                     initial={{ scale: 0.5, rotate: -5 }}
                     animate={{ scale: 1, rotate: 0 }}
                     transition={{ type: "spring", bounce: 0.5 }}
                     className="bg-white dark:bg-paper-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-soft dark:shadow-soft-dark max-w-lg w-[90%] text-center"
                  >
                     <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">The word was</h2>
                     <div className="text-3xl sm:text-5xl font-black text-secondary-500 uppercase tracking-widest mb-6 sm:mb-8">{roomState.turnSummary.word}</div>

                     <div className="grid gap-2 sm:gap-3 mb-6 max-h-48 sm:max-h-64 overflow-y-auto w-full max-w-md mx-auto scrollbar-thin">
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
                  <div className="text-8xl sm:text-9xl font-black text-red-500 opacity-30 drop-shadow-2xl">
                     {roomState.timeRemaining}
                  </div>
               </motion.div>
            )}

            {roomState.phase === 'game_end' && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-[100] bg-paper-950/95 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6"
               >
                  <div className="max-w-2xl w-full text-center">
                     <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                     >
                        <Trophy className="w-16 h-16 sm:w-24 sm:h-24 text-amber-400 mx-auto mb-4 sm:mb-6 drop-shadow-2xl" />
                     </motion.div>

                     <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-200 to-amber-600 mb-2"
                     >
                        {(() => {
                           const sorted = [...roomState.players].sort((a, b) => b.score - a.score);
                           return sorted[0]?.name;
                        })()} Wins!
                     </motion.h1>

                     <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex justify-center items-end gap-2 sm:gap-6 mb-8 sm:mb-10 mt-10 sm:mt-16 h-36 sm:h-48"
                     >
                        {(() => {
                           const sorted = [...roomState.players].sort((a, b) => b.score - a.score);
                           const podium = [sorted[1], sorted[0], sorted[2]].filter(Boolean);

                           return podium.map((p) => {
                              const isFirst = p.id === sorted[0]?.id;
                              const isSecond = p.id === sorted[1]?.id;

                              const height = isFirst ? 'h-36 sm:h-48' : isSecond ? 'h-28 sm:h-36' : 'h-20 sm:h-24';
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
                                    className={`w-20 sm:w-32 ${height} ${color} rounded-t-xl border-t-4 border-l-2 border-r-2 flex flex-col items-center justify-start pt-4 relative shadow-lg`}
                                 >
                                    <div className="absolute -top-10 sm:-top-12">
                                       <Avatar seed={p.avatarSeed} size={isFirst ? 48 : 40} className={isFirst ? 'ring-4 ring-amber-400 sm:w-16 sm:h-16' : ''} />
                                    </div>
                                    <div className={`font-black mt-1 sm:mt-2 ${isFirst ? 'text-amber-600 dark:text-amber-400 text-lg sm:text-xl' : 'text-slate-600 dark:text-slate-300 text-sm'}`}>{rank}</div>
                                    <div className="font-bold text-slate-800 dark:text-white truncate w-full px-1 sm:px-2 text-center text-xs sm:text-sm">{p.name}</div>
                                    <div className="text-primary-600 dark:text-primary-400 font-mono font-bold mt-auto pb-2 sm:pb-4 text-sm sm:text-base">{p.score}</div>
                                 </motion.div>
                              );
                           });
                        })()}
                     </motion.div>

                     <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3"
                     >
                        {me.isHost && (
                           <button
                              onClick={() => socket?.emit('start_game', { roomId: roomState.id })}
                              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary-500 text-white font-bold rounded-2xl shadow-lg hover:bg-primary-600 hover:scale-105 active:scale-95 transition-all text-lg sm:text-xl"
                           >
                              Play Again
                              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                           </button>
                        )}
                        <button
                           onClick={() => window.location.href = '/'}
                           className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                           <Home className="w-5 h-5" />
                           Back to Home
                        </button>
                     </motion.div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      );
   };

   // --- Mobile horizontal player strip ---
   const renderMobilePlayerStrip = () => (
      <div className="flex md:hidden gap-2 overflow-x-auto scrollbar-none px-1 py-1 bg-white dark:bg-paper-800 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-soft dark:shadow-soft-dark flex-shrink-0">
         {sortedPlayers.filter(p => !p.isSpectator).map((p, idx) => (
            <div
               key={p.id}
               className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl flex-shrink-0 transition-colors ${p.id === me.id ? 'bg-primary-50 dark:bg-primary-500/10' : 'bg-slate-50 dark:bg-paper-900/50'
                  } ${p.connected === false ? 'opacity-40 grayscale' : ''}`}
            >
               <div className="relative">
                  <div className={`${roomState.currentDrawerId === p.id ? 'ring-2 ring-amber-400 rounded-full' : ''}`}>
                     <Avatar seed={p.avatarSeed} size={24} />
                  </div>
                  {p.hasGuessedCorrectly && (
                     <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full border border-white dark:border-paper-800">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                     </div>
                  )}
               </div>
               <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[60px]">{p.name}</div>
                  <div className="text-[9px] text-primary-500 font-mono font-bold">{p.score}</div>
               </div>
            </div>
         ))}
      </div>
   );

   // --- Desktop player sidebar ---
   const renderPlayerSidebar = () => (
      <div className="hidden md:flex w-56 lg:w-64 flex-col bg-white dark:bg-paper-800 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-soft dark:shadow-soft-dark flex-shrink-0 overflow-hidden">
         <div className="p-3 border-b border-slate-100 dark:border-slate-700/50">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
               <span>👥</span> Players · R{roomState.roundNumber}/{roomState.settings.rounds}
            </h2>
         </div>
         <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
            {sortedPlayers.filter(p => !p.isSpectator).map((p, idx) => {
               const isCurrentDrawer = roomState.currentDrawerId === p.id;
               return (
                  <div
                     key={p.id}
                     className={`flex items-center gap-2 p-2 rounded-2xl transition-all ${p.id === me.id
                           ? 'bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/30'
                           : isCurrentDrawer
                              ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30'
                              : 'bg-slate-50 dark:bg-paper-900/50 border border-transparent'
                        } ${p.connected === false ? 'opacity-40 grayscale' : ''}`}
                  >
                     <div className="text-slate-400 dark:text-slate-500 font-mono text-[10px] w-3 text-right">
                        #{idx + 1}
                     </div>
                     <div className="relative flex-shrink-0">
                        <div className={`transition-all duration-300 ${isCurrentDrawer ? 'scale-110 ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-paper-800 rounded-full' : ''}`}>
                           <Avatar seed={p.avatarSeed} size={32} />
                        </div>
                        {p.hasGuessedCorrectly && (
                           <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full border-2 border-white dark:border-paper-800 z-10 animate-pop">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                           </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate flex items-center gap-1">
                           {p.name}
                           {p.id === me.id && <span className="text-[8px] text-primary-500 font-black">(YOU)</span>}
                        </div>
                        <div className="flex items-center gap-1">
                           <span className="text-[10px] text-primary-500 font-mono font-bold">{p.score} pts</span>
                           {isCurrentDrawer && (
                              <span className="text-[8px] font-bold uppercase text-amber-500 flex items-center gap-0.5">
                                 <Pencil className="w-2.5 h-2.5" /> Drawing
                              </span>
                           )}
                        </div>
                     </div>
                     {p.connected === false && (
                        <div className="text-[8px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded leading-none">OFF</div>
                     )}
                  </div>
               );
            })}
         </div>

         {/* Spectators */}
         {roomState.players.some(p => p.isSpectator) && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-700/50">
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Spectators</div>
               <div className="flex flex-wrap gap-1">
                  {roomState.players.filter(p => p.isSpectator).map(p => (
                     <div key={p.id} className="flex items-center gap-1 bg-slate-50 dark:bg-paper-900 px-1.5 py-1 rounded-lg">
                        <Avatar seed={p.avatarSeed} size={16} />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{p.name}</span>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </div>
   );

   return (
      <div className="h-[100dvh] overflow-hidden bg-paper-100 dark:bg-paper-950 flex flex-col">
         {/* TopBar: fixed, never scrolls away */}
         <div className="flex-shrink-0 p-2 pb-0 md:p-3 md:pb-0">
            <TopBar />
         </div>

         {/* Main content area */}
         <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-3 p-2 md:p-3 min-h-0 max-w-[1800px] mx-auto w-full">

            {/* Mobile: horizontal player strip */}
            {renderMobilePlayerStrip()}

            {/* Desktop: left player sidebar */}
            {renderPlayerSidebar()}

            {/* Center: Canvas area */}
            <div className="flex-1 relative rounded-3xl overflow-hidden shadow-soft dark:shadow-soft-dark border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-paper-800 min-h-0">
               <DrawingCanvas isDrawer={isDrawer} drawerName={drawerName} roomId={roomState.id} />
               {renderPhaseOverlay()}

               {/* Floating Reactions Layer */}
               <div className="absolute bottom-0 right-4 md:right-10 pointer-events-none z-40 w-16 h-full overflow-visible">
                  {activeReactions.map((r) => (
                     <div
                        key={r.id}
                        className="absolute bottom-0 animate-float text-3xl sm:text-4xl drop-shadow-lg"
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

            {/* Desktop: right chat sidebar */}
            <div className="hidden md:flex md:w-72 lg:w-80 min-h-0">
               <ChatSidebar />
            </div>

            {/* Mobile: Chat overlay */}
            <AnimatePresence>
               {showMobileChat && (
                  <motion.div
                     initial={{ y: '100%' }}
                     animate={{ y: 0 }}
                     exit={{ y: '100%' }}
                     transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                     className="md:hidden fixed inset-0 z-[90] bg-paper-100/95 dark:bg-paper-950/95 backdrop-blur-md flex flex-col pt-2"
                  >
                     <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
                        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chat & Scores</h2>
                        <button
                           onClick={() => setShowMobileChat(false)}
                           className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                           ✕ Close
                        </button>
                     </div>
                     <div className="flex-1 px-2 pb-2 min-h-0">
                        <ChatSidebar onMobileClose={() => setShowMobileChat(false)} />
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            {/* Mobile: Chat FAB (floating action button) */}
            {!showMobileChat && (
               <button
                  onClick={() => setShowMobileChat(true)}
                  className="md:hidden fixed bottom-4 right-4 z-[80] bg-primary-500 hover:bg-primary-600 text-white p-4 rounded-full shadow-lg active:scale-95 transition-all animate-pulse-glow"
               >
                  <MessageSquare className="w-6 h-6" />
                  {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                     </span>
                  )}
               </button>
            )}
         </div>
      </div>
   );
}
