import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { TopBar } from '../components/TopBar';
import { ChatSidebar } from '../components/ChatSidebar';
import { Trophy, ArrowRight, MessageSquare, Home, CheckCircle2, Pencil, Ban } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Player, ReactionPayload } from '@chitrakari/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { audioEngine } from '../utils/AudioEngine';
import { Confetti } from '../components/Confetti';
import { PlayerContextMenu } from '../components/PlayerContextMenu';

export function GameView() {
   const { roomState, socket, me } = useSocket();
   const [activeReactions, setActiveReactions] = useState<(ReactionPayload & { id: string })[]>([]);
   const [showMobileChat, setShowMobileChat] = useState(false);
   const [unreadCount, setUnreadCount] = useState(0);
   const [menuTarget, setMenuTarget] = useState<Player | null>(null);

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
      if (roomState?.phase === 'turn_end') {
         audioEngine.playRoundEnd();
      }
      if (roomState?.phase === 'game_end') {
         audioEngine.playGameEnd();
      }
   }, [roomState?.phase]);

   if (!roomState || !me) return null;

   const isDrawer = roomState.currentDrawerId === me.id;
   const drawerName = roomState.players.find(p => p.id === roomState.currentDrawerId)?.name || 'Someone';
   const sortedPlayers = React.useMemo(() => {
      return [...roomState.players].sort((a, b) => b.score - a.score);
   }, [roomState.players]);

   const handleWordSelect = (word: string) => {
      if (socket) {
         socket.emit('choose_word', { roomId: roomState.id, word });
      }
   };

   // Keyboard Shortcuts for Word Selection
   useEffect(() => {
      if (roomState.phase === 'choosing_word' && isDrawer && roomState.wordChoices) {
         const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '1' && roomState.wordChoices![0]) handleWordSelect(roomState.wordChoices![0]);
            else if (e.key === '2' && roomState.wordChoices![1]) handleWordSelect(roomState.wordChoices![1]);
            else if (e.key === '3' && roomState.wordChoices![2]) handleWordSelect(roomState.wordChoices![2]);
         };
         window.addEventListener('keydown', handleKeyDown);
         return () => window.removeEventListener('keydown', handleKeyDown);
      }
   }, [roomState.phase, isDrawer, roomState.wordChoices]);

   const renderPhaseOverlay = () => {
      return (
         <AnimatePresence>
            {roomState.phase === 'choosing_word' && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
               >
                  {isDrawer ? (
                     <motion.div
                        initial={{ scale: 0.9, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full text-center border border-white/15 glow-cyan"
                     >
                        <span className="text-3xl mb-1.5 block animate-bounce">🎨</span>
                        <h2 className="text-2xl sm:text-3xl font-heading font-black text-white mb-1">Pick a Word to Draw</h2>
                        <p className="text-xs font-bold text-amber-400 mb-5">⏳ You have {roomState.timeRemaining}s remaining</p>
                        
                        <div className="grid gap-2.5">
                           {roomState.wordChoices?.map((word, idx) => {
                              const gradients = [
                                 'from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 glow-cyan',
                                 'from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 glow-emerald',
                                 'from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 glow-indigo'
                              ];
                              return (
                                 <button
                                    key={word}
                                    onClick={() => handleWordSelect(word)}
                                    className={`w-full py-3.5 px-5 bg-gradient-to-r ${gradients[idx % gradients.length]} rounded-2xl text-lg sm:text-xl font-heading font-black tracking-wider uppercase transition-all shadow-md hover:scale-[1.02] active:scale-95 text-slate-950 flex items-center justify-between`}
                                 >
                                    <span className="opacity-60 text-xs font-mono">#{idx + 1}</span>
                                    <span>{word}</span>
                                    <span className="opacity-60 text-xs font-sans">SELECT</span>
                                 </button>
                              );
                           })}
                        </div>
                     </motion.div>
                  ) : (
                     <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="glass-card rounded-3xl p-6 sm:p-8 text-center max-w-sm w-full border border-white/15"
                     >
                        <div className="text-3xl mb-2 animate-bounce">✏️</div>
                        <div className="text-xl sm:text-2xl font-heading font-extrabold text-cyan-400 mb-1">{drawerName}</div>
                        <div className="text-xs text-slate-300 font-medium">is choosing a word to sketch...</div>
                        <div className="text-[11px] text-slate-500 mt-3">Get your artist guesses ready!</div>
                     </motion.div>
                  )}
               </motion.div>
            )}

            {roomState.phase === 'turn_end' && roomState.turnSummary && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
               >
                  <motion.div
                     initial={{ scale: 0.9 }}
                     animate={{ scale: 1 }}
                     transition={{ type: "spring", bounce: 0.3 }}
                     className="glass-card rounded-3xl p-5 sm:p-7 max-w-md w-full text-center border border-white/15 shadow-2xl"
                  >
                     <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Round Solution</h2>
                     <div className="text-3xl sm:text-4xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-300 uppercase tracking-widest mb-4 inline-block">{roomState.turnSummary.word}</div>

                     <div className="grid gap-1.5 mb-4 max-h-48 overflow-y-auto w-full scrollbar-thin">
                        {Object.entries(roomState.turnSummary.guesserPoints).length > 0 ? (
                           Object.entries(roomState.turnSummary.guesserPoints).map(([pid, pts]) => {
                              const p = roomState.players.find(x => x.id === pid);
                              if (!p) return null;
                              return (
                                 <div key={pid} className="flex items-center justify-between bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05]">
                                    <div className="flex items-center gap-2.5">
                                       <Avatar seed={p.avatarSeed} size={28} />
                                       <span className="font-bold text-xs text-white">{p.name}</span>
                                    </div>
                                    <span className="text-emerald-400 font-mono font-bold text-xs">+{pts}</span>
                                 </div>
                              );
                           })
                        ) : (
                           <div className="text-slate-400 text-xs font-semibold py-2">No one guessed it!</div>
                        )}
                        {roomState.turnSummary.drawerPoints > 0 && (
                           <div className="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 mt-1">
                              <div className="flex items-center gap-2">
                                 <span className="text-base">🖌️</span>
                                 <span className="font-bold text-xs text-amber-300">Artist Reward</span>
                              </div>
                              <span className="text-amber-400 font-mono font-bold text-xs">+{roomState.turnSummary.drawerPoints}</span>
                           </div>
                        )}
                     </div>

                     <div className="flex items-center gap-3 justify-center mb-4">
                        <button
                           onClick={() => socket?.emit('rate_drawing', { roomId: roomState.id, like: true })}
                           className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${roomState.turnSummary.likes?.includes(me?.id || '') ? 'bg-emerald-500 text-slate-950 glow-emerald' : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]'}`}
                        >
                           <span>👍</span> {roomState.turnSummary.likes?.length || 0}
                        </button>
                        <button
                           onClick={() => socket?.emit('rate_drawing', { roomId: roomState.id, like: false })}
                           className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${roomState.turnSummary.dislikes?.includes(me?.id || '') ? 'bg-rose-500 text-white glow-amber' : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]'}`}
                        >
                           <span>👎</span> {roomState.turnSummary.dislikes?.length || 0}
                        </button>
                     </div>

                     <div className="text-xs text-slate-400 font-medium">
                        Next turn in <span className="font-bold text-white">{roomState.timeRemaining}s</span>...
                     </div>
                  </motion.div>
               </motion.div>
            )}

            {roomState.phase === 'game_end' && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
               >
                  <Confetti />
                  <div className="max-w-xl w-full text-center">
                     <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                     >
                        <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3 drop-shadow-2xl" />
                     </motion.div>

                     <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl sm:text-5xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 mb-1"
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
                        className="flex justify-center items-end gap-3 sm:gap-6 mb-6 mt-8 h-32 sm:h-44"
                     >
                        {(() => {
                           const sorted = [...roomState.players].sort((a, b) => b.score - a.score);
                           const podium = [sorted[1], sorted[0], sorted[2]].filter(Boolean);

                           return podium.map((p) => {
                              const isFirst = p.id === sorted[0]?.id;
                              const isSecond = p.id === sorted[1]?.id;

                              const height = isFirst ? 'h-32 sm:h-44' : isSecond ? 'h-24 sm:h-32' : 'h-18 sm:h-24';
                              const color = isFirst ? 'bg-gradient-to-t from-amber-500/30 to-amber-500/10 border-amber-400/50' :
                                 isSecond ? 'bg-gradient-to-t from-slate-500/30 to-slate-500/10 border-slate-400/50' :
                                    'bg-gradient-to-t from-orange-500/30 to-orange-500/10 border-orange-400/50';

                              const rank = isFirst ? '1st' : isSecond ? '2nd' : '3rd';
                              const delay = isFirst ? 1.5 : isSecond ? 1.2 : 1.0;

                              return (
                                 <motion.div
                                    key={p.id}
                                    initial={{ y: 40, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay, type: 'spring' }}
                                    className={`w-20 sm:w-28 ${height} ${color} rounded-t-2xl border-t-2 border-l border-r flex flex-col items-center justify-start pt-3 relative shadow-lg`}
                                 >
                                    <div className="absolute -top-7 sm:-top-8">
                                       <Avatar seed={p.avatarSeed} size={isFirst ? 42 : 34} className={isFirst ? 'ring-2 ring-amber-400' : ''} />
                                    </div>
                                    <div className={`font-bold mt-2 ${isFirst ? 'text-amber-400 text-sm' : 'text-slate-300 text-xs'}`}>{rank}</div>
                                    <div className="font-semibold text-white truncate w-full px-1 text-center text-xs">{p.name}</div>
                                    <div className="text-emerald-400 font-mono font-bold mt-auto pb-2 text-xs sm:text-sm">{p.score}</div>
                                 </motion.div>
                              );
                           });
                        })()}
                     </motion.div>

                     <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="flex flex-col items-center justify-center gap-3 mt-4"
                     >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                           {roomState.playAgainVotes?.includes(me.id) ? (
                              <button
                                 disabled
                                 className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/30 text-emerald-300 font-bold rounded-xl text-sm min-w-[180px]"
                              >
                                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                 <span>Waiting for votes...</span>
                              </button>
                           ) : (
                              <button
                                 onClick={() => socket?.emit('play_again_vote', { roomId: roomState.id })}
                                 className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all text-sm min-w-[180px] glow-emerald"
                              >
                                 <span>Play Again ({roomState.timeRemaining}s)</span>
                                 <ArrowRight className="w-4 h-4" />
                              </button>
                           )}
                           <button
                              onClick={() => window.location.href = '/'}
                              className="inline-flex items-center gap-2 px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-bold rounded-xl border border-white/[0.08] transition-all text-xs"
                           >
                              <Home className="w-4 h-4" />
                              <span>Leave Room</span>
                           </button>
                        </div>
                     </motion.div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      );
   };

   // --- Mobile horizontal player strip ---
   const renderMobilePlayerStrip = () => (
      <div className="flex lg:hidden gap-1.5 overflow-x-auto scrollbar-none px-2 py-1.5 glass-card rounded-xl flex-shrink-0">
         {sortedPlayers.map((p) => (
            <div
               key={p.id}
               className={`flex items-center gap-1.5 px-2 py-1 rounded-lg flex-shrink-0 transition-colors ${
                  p.id === me.id ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-white/[0.03]'
               } ${p.connected === false ? 'opacity-40 grayscale' : ''}`}
            >
               <div className="relative">
                  <div className={`${roomState.currentDrawerId === p.id ? 'ring-2 ring-cyan-400 rounded-full' : ''}`}>
                     <Avatar seed={p.avatarSeed} size={22} />
                  </div>
                  {p.hasGuessedCorrectly && (
                     <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                     </div>
                  )}
               </div>
               <div className="flex flex-col">
                  <div className="text-[10px] font-bold text-white truncate max-w-[50px]">{p.name}</div>
                  <div className="text-[9px] text-emerald-400 font-mono font-bold">{p.score}</div>
               </div>
               {roomState.currentDrawerId === p.id && <Pencil className="w-2.5 h-2.5 text-cyan-400 ml-0.5" />}
            </div>
         ))}
      </div>
   );

   // --- Desktop player sidebar ---
   const renderPlayerSidebar = () => (
      <div className="hidden lg:flex lg:w-60 flex-col glass-card rounded-2xl p-2.5 flex-shrink-0 overflow-hidden">
         <div className="px-2 py-1.5 border-b border-white/[0.06] mb-1.5">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
               <span>👥 Artists</span>
               <span className="font-mono text-emerald-400">R{roomState.roundNumber}/{roomState.settings.rounds}</span>
            </h2>
         </div>
         <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1 pr-0.5">
            {sortedPlayers.map((p, idx) => {
               const isCurrentDrawer = roomState.currentDrawerId === p.id;
               return (
                  <div
                     key={p.id}
                     onClick={() => p.id !== me.id && setMenuTarget(menuTarget?.id === p.id ? null : p)}
                     className={`group relative cursor-pointer flex items-center gap-2 p-2 rounded-xl transition-all border ${
                        p.id === me.id
                           ? 'bg-emerald-500/10 border-emerald-500/30'
                           : isCurrentDrawer
                              ? 'bg-cyan-500/10 border-cyan-500/30'
                              : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05]'
                     } ${menuTarget?.id === p.id ? 'bg-white/10' : ''} ${p.connected === false ? 'opacity-40 grayscale' : ''}`}
                  >
                     <div className="text-slate-500 font-mono text-[10px] w-3 text-right">
                        #{idx + 1}
                     </div>
                     <div className="relative flex-shrink-0">
                        <div className={`transition-all duration-300 ${isCurrentDrawer ? 'scale-105 ring-2 ring-cyan-400 rounded-full' : ''}`}>
                           <Avatar seed={p.avatarSeed} size={28} />
                        </div>
                        {p.hasGuessedCorrectly && (
                           <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full z-10">
                              <CheckCircle2 className="w-2.5 h-2.5 text-slate-950" />
                           </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                           {p.name}
                           {isCurrentDrawer && <Pencil className="w-3 h-3 text-cyan-400" />}
                           {p.id === me.id && <span className="text-[8px] text-emerald-400 font-extrabold">(YOU)</span>}
                        </div>
                        <div className="flex items-center gap-1">
                           <span className="text-[10px] text-emerald-400 font-mono font-bold">{p.score} pts</span>
                           {isCurrentDrawer && (
                              <span className="text-[8px] font-bold uppercase text-cyan-400">
                                 Drawing
                              </span>
                           )}
                        </div>
                     </div>
                     {menuTarget?.id === p.id && (
                        <div className="absolute right-2 top-8 z-50">
                           <PlayerContextMenu target={p} onClose={() => setMenuTarget(null)} />
                        </div>
                     )}
                  </div>
               );
            })}
         </div>
      </div>
   );

   return (
      <div className="h-[100dvh] overflow-hidden text-white flex flex-col p-2 sm:p-3 gap-2 select-none">
         {/* TopBar */}
         <div className="flex-shrink-0 max-w-[1800px] mx-auto w-full">
            <TopBar />
         </div>

         {/* Main content area */}
         <div className="flex-1 flex flex-col lg:flex-row gap-2 lg:gap-3 min-h-0 max-w-[1800px] mx-auto w-full">

            {/* Mobile: horizontal player strip */}
            {renderMobilePlayerStrip()}

            {/* Desktop: left player sidebar */}
            {renderPlayerSidebar()}

            {/* Center: Canvas area */}
            <div className={`flex flex-col relative overflow-hidden glass-card rounded-2xl border border-white/10 ${!isDrawer ? 'flex-1 lg:flex-[2] min-h-[180px]' : 'flex-1'} min-h-0`}>
               <DrawingCanvas isDrawer={isDrawer} drawerName={drawerName} roomId={roomState.id} />
               {renderPhaseOverlay()}

               {/* Floating Reactions Layer */}
               <div className="absolute bottom-0 right-4 lg:right-10 pointer-events-none z-40 w-16 h-full overflow-visible">
                  {activeReactions.map((r) => (
                     <div
                        key={r.id}
                        className="absolute bottom-0 animate-float z-50 pointer-events-none"
                        style={{
                           left: `${Math.random() * 40 - 20}px`,
                           animationDelay: `${Math.random() * 0.2}s`
                        }}
                     >
                        <div className="animate-squiggly text-4xl sm:text-5xl drop-shadow-lg">
                           {r.emoji}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Guesser Mobile Chat & Guess Box docked beneath Canvas */}
            {!isDrawer && (
               <div className="flex lg:hidden h-44 sm:h-52 flex-shrink-0 flex-col min-h-0 glass-card rounded-2xl overflow-hidden">
                  <ChatSidebar />
               </div>
            )}

            {/* Desktop: right chat sidebar */}
            <div className="hidden lg:flex lg:w-72 min-h-0 glass-card rounded-2xl overflow-hidden">
               <ChatSidebar />
            </div>

            {/* Drawer Mobile Chat overlay toggle */}
            <AnimatePresence>
               {isDrawer && showMobileChat && (
                  <motion.div
                     initial={{ y: '100%' }}
                     animate={{ y: 0 }}
                     exit={{ y: '100%' }}
                     transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                     className="lg:hidden fixed inset-0 z-[90] bg-slate-950/95 backdrop-blur-xl flex flex-col pt-2"
                  >
                     <div className="flex items-center justify-between px-4 py-2 flex-shrink-0 border-b border-white/10">
                        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Chat & Guesses</h2>
                        <button
                           onClick={() => setShowMobileChat(false)}
                           className="p-1.5 px-3 bg-white/10 text-slate-200 rounded-lg text-xs font-bold hover:bg-white/20 transition-colors"
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

            {/* Drawer Mobile Chat FAB */}
            {isDrawer && !showMobileChat && (
               <button
                  onClick={() => setShowMobileChat(true)}
                  className="lg:hidden fixed bottom-[max(env(safe-area-inset-bottom),1.5rem)] right-4 z-50 p-3.5 bg-emerald-500 text-slate-950 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform glow-emerald"
                  title="Open Chat"
               >
                  <MessageSquare className="w-5 h-5" />
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
