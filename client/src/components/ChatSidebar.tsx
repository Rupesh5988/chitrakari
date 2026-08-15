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
      <div className="w-full flex flex-col h-full relative">

         {/* Chat Box */}
         <div className="bg-transparent border-transparent shadow-none flex-1 flex flex-col overflow-hidden relative transition-colors min-h-0">
            <div
               className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scrollbar-thin"
               ref={chatContainerRef}
               onScroll={handleScroll}
            >
               {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 opacity-50">
                     <span className="text-3xl mb-2">💬</span>
                     <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Chat messages will appear here</p>
                  </div>
               )}
               {messages.map(msg => {
                  const p = roomState.players.find(x => x.id === msg.playerId);

                  if (msg.type === 'correct_guess') {
                     return (
                        <div key={msg.id} className="text-center animate-pop">
                           <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 wonky-border-alt">
                              <Sparkles className="w-3 h-3" />
                              {p?.name} guessed the word!
                           </span>
                        </div>
                     );
                  }

                  if (msg.type === 'close_guess') {
                     return (
                        <div key={msg.id} className="text-center">
                           <span className="inline-block bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1.5 wonky-border">
                              {msg.text}
                           </span>
                        </div>
                     );
                  }

                  if (msg.type === 'leak_blocked') {
                     return (
                        <div key={msg.id} className="text-center">
                           <span className="inline-block bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/50 text-rose-600 dark:text-rose-400 text-xs font-bold px-3 py-1.5 wonky-border-alt">
                              ⚠️ {msg.text}
                           </span>
                        </div>
                     );
                  }

                  if (msg.type === 'system') {
                     return (
                        <div key={msg.id} className="text-center text-xs text-slate-500 italic">
                           {msg.text}
                        </div>
                     );
                  }

                  if (msg.type === 'system_meaning') {
                     return (
                        <div key={msg.id} className="text-center my-2 animate-pop">
                           <span className="inline-block bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 sm:px-4 py-2 sm:py-2.5 wonky-border shadow-sm leading-tight max-w-[90%]">
                              📖 {msg.text}
                           </span>
                        </div>
                     );
                  }

                  if (msg.type === 'guessed_chat') {
                     if (!isDrawer && !myPlayerState?.hasGuessedCorrectly) {
                        return null;
                     }
                     return (
                        <div key={msg.id} className="text-sm break-words leading-relaxed flex flex-col">
                           <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-wider">{p?.name}</span>
                           <span className="text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 wonky-border-alt self-start inline-block shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                              {msg.text}
                           </span>
                        </div>
                     );
                  }

                  return (
                     <div key={msg.id} className={`text-sm break-words leading-relaxed flex flex-col animate-float-slow`}>
                        <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">{p?.name}</span>
                        <span className="text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-paper-900/50 px-3 py-2 wonky-border self-start inline-block shadow-sm">
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
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-2 wonky-border-button shadow-lg flex items-center gap-2 hover:bg-primary-600 transition-all z-10 animate-bounce"
               >
                  <ArrowDown className="w-3 h-3" /> New
               </button>
            )}

            {/* Input / Actions Area */}
            <div className="p-2 sm:p-3 bg-slate-50 dark:bg-paper-900/80 border-t border-slate-200 dark:border-slate-700/50 flex flex-col gap-2 transition-colors flex-shrink-0">

               {/* Reactions */}
               <div className="flex gap-3 sm:gap-4 justify-center py-0.5">
                  {['👍', '👎', '😂', '😲', '❤️', '🙏', '🪔', '☕'].map((emoji, idx) => (
                     <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className={`text-lg sm:text-xl p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:scale-125 hover:-translate-y-1 transition-all active:scale-95 drop-shadow-md rounded-xl hover:bg-slate-200/50 dark:hover:bg-paper-700/50 ${idx % 3 === 0 ? 'animate-float-slow' : idx % 3 === 1 ? 'animate-float-medium' : 'animate-float-fast'}`}
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
                     className="w-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/50 p-2.5 sm:p-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-amber-200 dark:hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                     <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                     Give Hint
                  </button>
               ) : (
                  <form onSubmit={handleSubmit} className="flex gap-2">
                     <div className="relative flex-1">
                        <input
                           type="text"
                           value={inputValue}
                           onChange={e => setInputValue(e.target.value)}
                           placeholder={myPlayerState?.hasGuessedCorrectly ? "You guessed it!" : "Type guess here..."}
                           className={`w-full bg-white dark:bg-paper-800 border ${proximity === 'hot' ? 'border-red-500 dark:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                 proximity === 'warm' ? 'border-orange-500 dark:border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                                    'border-slate-200 dark:border-slate-700'
                              } rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 transition-all`}
                        />
                        {myPlayerState?.hasGuessedCorrectly && (
                           <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 pointer-events-none" />
                        )}
                        {proximity && !myPlayerState?.hasGuessedCorrectly && (
                           <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none animate-pulse">
                              {proximity === 'hot' ? '🔥' : proximity === 'warm' ? '🌡️' : '❄️'}
                           </div>
                        )}
                     </div>
                     <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="bg-primary-500 text-white min-w-[48px] min-h-[48px] rounded-2xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 flex-shrink-0 flex items-center justify-center"
                     >
                        <Send className="w-5 h-5" />
                     </button>
                  </form>
               )}
            </div>
         </div>

      </div>
   );
}
