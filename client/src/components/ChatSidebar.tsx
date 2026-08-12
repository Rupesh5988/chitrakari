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
      } else if (msg.type === 'chat') {
         const player = roomStateRef.current?.players.find(p => p.id === msg.playerId);
         if (player && player.id !== me.id) {
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

  const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score);
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
    <div className="w-full md:w-80 flex flex-col gap-4 h-full relative">
      
      {/* Mobile Close Button */}
      {onMobileClose && (
        <button 
           onClick={onMobileClose} 
           className="md:hidden absolute -top-12 right-0 p-2 bg-paper-800 text-slate-200 rounded-full shadow-lg"
        >
           <X />
        </button>
      )}

      {/* Scoreboard */}
      <div className="bg-white dark:bg-paper-800 border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-soft dark:shadow-soft-dark p-4 flex-shrink-0 flex flex-col max-h-[40%] transition-colors">
         <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Scoreboard</h2>
         <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
            {sortedPlayers.map((p, idx) => (
               <div key={p.id} className={`flex items-center gap-3 p-2 rounded-2xl transition-colors ${p.id === me.id ? 'bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/30' : 'bg-slate-50 dark:bg-paper-900/50'}`}>
                  <div className="text-slate-400 dark:text-slate-500 font-mono text-xs w-3 text-right">#{idx + 1}</div>
                  <div className="relative">
                     <div className={`transition-all duration-300 ${roomState.currentDrawerId === p.id ? 'scale-110 ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-paper-800 rounded-full' : ''}`}>
                        <Avatar seed={p.avatarSeed} size={36} />
                     </div>
                     {p.hasGuessedCorrectly && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full border-2 border-white dark:border-paper-800 z-10 animate-pop">
                           <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate flex items-center gap-2">
                        {p.name}
                     </div>
                     <div className="text-xs text-primary-500 font-mono font-bold">{p.score} pts</div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Chat Box */}
      <div className="bg-white dark:bg-paper-800 border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-soft dark:shadow-soft-dark flex-1 flex flex-col overflow-hidden relative transition-colors">
         <div 
           className="flex-1 overflow-y-auto p-4 space-y-4"
           ref={chatContainerRef}
           onScroll={handleScroll}
         >
            {messages.map(msg => {
               const p = roomState.players.find(x => x.id === msg.playerId);
               
               if (msg.type === 'correct_guess') {
                  return (
                     <div key={msg.id} className="text-center animate-pop">
                        <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
                           <Sparkles className="w-3 h-3" />
                           {p?.name} guessed the word!
                        </span>
                     </div>
                  );
               }
               
               if (msg.type === 'close_guess') {
                  return (
                     <div key={msg.id} className="text-center">
                        <span className="inline-block bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full">
                           {msg.text}
                        </span>
                     </div>
                  );
               }

               if (msg.type === 'leak_blocked') {
                  return (
                     <div key={msg.id} className="text-center">
                        <span className="inline-block bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/50 text-rose-600 dark:text-rose-400 text-xs font-bold px-3 py-1.5 rounded-full">
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

               return (
                  <div key={msg.id} className="text-sm break-words leading-relaxed flex flex-col">
                     <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">{p?.name}</span>
                     <span className="text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-paper-900/50 px-3 py-2 rounded-xl rounded-tl-sm self-start inline-block shadow-sm">
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
               className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-primary-600 transition-all z-10 animate-bounce"
            >
               <ArrowDown className="w-4 h-4" /> New Messages
            </button>
         )}
         
         {/* Input / Actions Area */}
         <div className="p-3 bg-slate-50 dark:bg-paper-900/80 border-t border-slate-200 dark:border-slate-700/50 flex flex-col gap-3 transition-colors">
            
            <div className="flex gap-4 justify-center py-1">
               {['👍', '👎', '😂', '😲', '❤️'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-xl hover:scale-125 hover:-translate-y-1 transition-all active:scale-95 drop-shadow-md"
                  >
                     {emoji}
                  </button>
               ))}
            </div>

            {/* Input Form */}
            {isDrawer ? (
               <button 
                 onClick={handleSpendHint}
                 disabled={!myPlayerState || myPlayerState.hintTokens <= 0 || roomState.phase !== 'drawing'}
                 className="w-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/50 p-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-amber-200 dark:hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
               >
                 <Sparkles className="w-5 h-5" />
                 Spend Hint Token ({myPlayerState?.hintTokens || 0})
               </button>
            ) : (
               <form onSubmit={handleSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                     <input
                       type="text"
                       value={inputValue}
                       onChange={e => setInputValue(e.target.value)}
                       placeholder={myPlayerState?.hasGuessedCorrectly ? "You guessed it!" : "Type guess here..."}
                       className={`w-full bg-white dark:bg-paper-800 border ${
                         proximity === 'hot' ? 'border-red-500 dark:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                         proximity === 'warm' ? 'border-orange-500 dark:border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                         'border-slate-200 dark:border-slate-700'
                       } rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 transition-all`}
                     />
                     {myPlayerState?.hasGuessedCorrectly && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 pointer-events-none" />
                     )}
                     {/* Proximity Indicator */}
                     {proximity && !myPlayerState?.hasGuessedCorrectly && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none animate-pulse">
                           {proximity === 'hot' ? '🔥' : proximity === 'warm' ? '🌡️' : '❄️'}
                        </div>
                     )}
                  </div>
                  <button 
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="bg-primary-500 text-white p-3 rounded-2xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
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
