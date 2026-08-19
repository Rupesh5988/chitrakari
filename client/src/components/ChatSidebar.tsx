import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { ChatMessage } from '@chitrakari/shared';
import { Avatar } from './Avatar';
import { Send, CheckCircle2, ArrowDown, Sparkles, X } from 'lucide-react';
import { audioEngine } from '../utils/AudioEngine';

interface ChatSidebarProps {
   onMobileClose?: () => void;
}

export function ChatSidebar({ onMobileClose }: ChatSidebarProps) {
   const { roomState, socket, me } = useSocket();
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   const [inputValue, setInputValue] = useState('');

   const roomStateRef = useRef(roomState);
   useEffect(() => {
      roomStateRef.current = roomState;
   }, [roomState]);

   const chatContainerRef = useRef<HTMLDivElement>(null);
   const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
   const [hasNewMessages, setHasNewMessages] = useState(false);

   // Proximity Meter State
   const [proximity, setProximity] = useState<'hot' | 'warm' | 'cold' | null>(null);
   const proximityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

   useEffect(() => {
      if (!socket) return;

      const handleChat = (msg: ChatMessage) => {
         const mutedPlayers: string[] = JSON.parse(localStorage.getItem('chitrakari_muted_players') || '[]');
         if (mutedPlayers.includes(msg.playerId)) return;

         setMessages(prev => [...prev, msg]);
         if (isAutoScrollPaused) {
            setHasNewMessages(true);
         }

         if (msg.type === 'correct_guess') {
            audioEngine.playCorrect();
            const player = roomStateRef.current?.players.find(p => p.id === msg.playerId);
            if (player) {
               audioEngine.speak(`${player.name} has guessed the word!`);
            }
         } else if (msg.type === 'normal') {
            const player = roomStateRef.current?.players.find(p => p.id === msg.playerId);
            if (player && me && player.id !== me.id) {
               audioEngine.speak(`${player.name} says ${msg.text}`);
            }
         }
      };

      const handleProximity = (data: { status: 'hot' | 'warm' | 'cold' }) => {
         setProximity(data.status);
         if (proximityTimeoutRef.current) clearTimeout(proximityTimeoutRef.current);
         proximityTimeoutRef.current = setTimeout(() => {
            setProximity(null);
         }, 3000);
      };

      socket.on('chat_message_received', handleChat);
      socket.on('guess_proximity_update', handleProximity);
      return () => {
         socket.off('chat_message_received', handleChat);
         socket.off('guess_proximity_update', handleProximity);
         if (proximityTimeoutRef.current) clearTimeout(proximityTimeoutRef.current);
      };
   }, [socket, isAutoScrollPaused]);

   useEffect(() => {
      if (!isAutoScrollPaused && chatContainerRef.current) {
         chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
   }, [messages, isAutoScrollPaused]);

   const handleScroll = () => {
      if (!chatContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      if (isAtBottom) {
         setIsAutoScrollPaused(false);
         setHasNewMessages(false);
      } else {
         setIsAutoScrollPaused(true);
      }
   };

   const scrollToBottom = () => {
      if (chatContainerRef.current) {
         chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
         setIsAutoScrollPaused(false);
         setHasNewMessages(false);
      }
   };

   if (!roomState || !me) return null;

   const isDrawer = roomState.currentDrawerId === me.id;
   const myPlayerState = roomState.players.find(p => p.id === me.id);

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || !socket || isDrawer) return;

      socket.emit('chat_message', { roomId: roomState.id, text: inputValue.trim() });
      setInputValue('');
      scrollToBottom();
   };

   const handleReaction = (emoji: string) => {
      if (socket) {
         socket.emit('send_reaction', { roomId: roomState.id, emoji });
      }
   };

   const handleSpendHint = () => {
      if (socket && isDrawer) {
         socket.emit('spend_hint', { roomId: roomState.id });
      }
   };

   return (
      <div className="w-full flex flex-col h-full relative select-none">

         {/* Chat Box */}
         <div className="flex-1 flex flex-col overflow-hidden relative transition-colors min-h-0">
            <div
               className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5 scrollbar-thin"
               ref={chatContainerRef}
               onScroll={handleScroll}
            >
               {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 opacity-40">
                     <span className="text-2xl mb-1.5">💬</span>
                     <p className="text-xs text-slate-400 font-medium">Type your guesses in the box below!</p>
                  </div>
               )}
               {messages.map(msg => {
                  const p = roomState.players.find(x => x.id === msg.playerId);

                  if (msg.type === 'correct_guess') {
                     return (
                        <div key={msg.id} className="text-center animate-pop my-1">
                           <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full glow-emerald">
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              <span>{p?.name} guessed the word!</span>
                           </span>
                        </div>
                     );
                  }

                  if (msg.type === 'close_guess') {
                     return (
                        <div key={msg.id} className="text-center my-0.5">
                           <span className="inline-block bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full glow-amber">
                              {msg.text}
                           </span>
                        </div>
                     );
                  }

                  if (msg.type === 'system_meaning') {
                     return (
                        <div key={msg.id} className="text-center my-1.5">
                           <div className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs p-2.5 rounded-xl text-left leading-relaxed">
                              <div className="font-bold text-indigo-400 text-[10px] uppercase tracking-wider mb-0.5">Dictionary Definition</div>
                              {msg.text}
                           </div>
                        </div>
                     );
                  }

                  if (msg.type === 'leak_blocked') {
                     return (
                        <div key={msg.id} className="text-center my-0.5">
                           <span className="inline-block bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-medium px-2.5 py-1 rounded-lg">
                              {msg.text}
                           </span>
                        </div>
                     );
                  }

                  if (msg.type === 'guessed_chat') {
                     return (
                        <div key={msg.id} className="text-xs break-words leading-relaxed flex flex-col items-start">
                           <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider mb-0.5">{p?.name}</span>
                           <span className="text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl rounded-tl-sm inline-block shadow-sm">
                              {msg.text}
                           </span>
                        </div>
                     );
                  }

                  return (
                     <div key={msg.id} className="text-xs break-words leading-relaxed flex flex-col items-start">
                        <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">{p?.name}</span>
                        <span className="text-slate-200 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 rounded-xl rounded-tl-sm inline-block">
                           {msg.text}
                        </span>
                     </div>
                  );
               })}
            </div>

            {/* New Messages Jump Button */}
            {hasNewMessages && (
               <button
                  onClick={scrollToBottom}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-emerald-400 transition-all z-10 animate-bounce glow-emerald"
               >
                  <ArrowDown className="w-3.5 h-3.5" /> <span>New</span>
               </button>
            )}

            {/* Input / Actions Area */}
            <div className="p-2.5 bg-slate-950/40 border-t border-white/[0.06] flex flex-col gap-2 flex-shrink-0">

               {/* Quick Reactions */}
               <div className="flex gap-1.5 justify-center py-0.5">
                  {['👍', '😂', '😲', '❤️', '👏', '🪔', '☕'].map((emoji) => (
                     <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="text-base p-1.5 rounded-lg hover:bg-white/[0.08] hover:scale-125 active:scale-95 transition-transform"
                     >
                        {emoji}
                     </button>
                  ))}
               </div>

               {/* Input Form */}
               {isDrawer && roomState.phase === 'drawing' ? (
                  <button
                     onClick={handleSpendHint}
                     disabled={!roomState.hiddenWord || roomState.hiddenWord.split('').filter(c => c === '_').length <= 1 || roomState.phase !== 'drawing'}
                     className="w-full bg-amber-500/15 text-amber-300 border border-amber-500/30 p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-amber"
                  >
                     <Sparkles className="w-4 h-4 text-amber-400" />
                     <span>Reveal Letter Hint</span>
                  </button>
               ) : (
                  <form onSubmit={handleSubmit} className="flex gap-1.5">
                     <div className="relative flex-1">
                        <input
                           type="text"
                           value={inputValue}
                           onChange={e => setInputValue(e.target.value)}
                           placeholder={myPlayerState?.hasGuessedCorrectly ? "You guessed it!" : "Type guess here..."}
                           className={`w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 pr-8 outline-none ${
                              proximity === 'hot' ? 'border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]' :
                              proximity === 'warm' ? 'border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : ''
                           }`}
                        />
                        {myPlayerState?.hasGuessedCorrectly && (
                           <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
                        )}
                        {proximity && !myPlayerState?.hasGuessedCorrectly && (
                           <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none animate-pulse text-xs">
                              {proximity === 'hot' ? '🔥' : proximity === 'warm' ? '🌡️' : '❄️'}
                           </div>
                        )}
                     </div>
                     <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-2 rounded-xl disabled:opacity-30 disabled:hover:bg-emerald-500 transition-all shadow-sm active:scale-95 flex-shrink-0 flex items-center justify-center glow-emerald"
                     >
                        <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                     </button>
                  </form>
               )}
            </div>
         </div>

      </div>
   );
}
