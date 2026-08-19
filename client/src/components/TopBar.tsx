import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Volume2, VolumeX, Moon, Sun, LogOut, Copy, Check } from 'lucide-react';
import { CircularTimer } from './CircularTimer';
import { useTheme } from '../context/ThemeContext';
import { audioEngine } from '../utils/AudioEngine';
import { WavyText } from './WavyText';
import { MiniDoodleBoard } from './MiniDoodleBoard';
import { toast } from 'sonner';
import { HelpModal } from './HelpModal';

const LOBBY_PHRASES = [
   "Vibing in the lobby rn",
   "Spitballing ideas, hold tight!",
   "We are cooking something good...",
   "Awaiting the next Picasso.",
   "Just hanging out basically.",
   "Prepare your best doodles!",
   "Drawing skills loading... please wait."
];

export function TopBar() {
   const { roomState, socket, me } = useSocket();
   const [timer, setTimer] = useState(roomState?.timeRemaining || 0);
   const [hint, setHint] = useState(roomState?.hiddenWord || '');
   const { theme, toggleTheme } = useTheme();
   const [isMuted, setIsMuted] = useState(audioEngine.isMuted);
   const [copied, setCopied] = useState(false);
   const [isHelpOpen, setIsHelpOpen] = useState(false);
   const [lobbyPhrase, setLobbyPhrase] = useState(LOBBY_PHRASES[0]);

   useEffect(() => {
      if (roomState?.phase === 'lobby') {
         const randomIndex = Math.floor(Math.random() * LOBBY_PHRASES.length);
         setLobbyPhrase(LOBBY_PHRASES[randomIndex]);
      }
   }, [roomState?.phase]);

   const copyCode = () => {
      if (!roomState?.id) return;
      navigator.clipboard.writeText(roomState.id);
      setCopied(true);
      toast.success(`Room Code ${roomState.id} copied!`);
      setTimeout(() => setCopied(false), 2000);
   };

   const handleExit = () => {
      if (window.confirm('Are you sure you want to leave the room?')) {
         window.location.href = '/';
      }
   };

   useEffect(() => {
      if (!socket) return;

      const handleTick = (timeRemaining: number) => {
         setTimer(timeRemaining);
         if (timeRemaining <= 5 && timeRemaining > 0 && roomState?.phase === 'drawing') {
            audioEngine.playTick();
         }
      };

      const handleHint = (hiddenWord: string) => {
         setHint(hiddenWord);
      };

      socket.on('timer_tick', handleTick);
      socket.on('hint_update', handleHint);

      return () => {
         socket.off('timer_tick', handleTick);
         socket.off('hint_update', handleHint);
      };
   }, [socket, roomState?.phase]);

   useEffect(() => {
      if (roomState?.hiddenWord) setHint(roomState.hiddenWord);
   }, [roomState?.hiddenWord]);

   if (!roomState) return null;

   const toggleMute = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.blur();
      audioEngine.isMuted = !audioEngine.isMuted;
      setIsMuted(audioEngine.isMuted);
      localStorage.setItem('chitrakari_muted', String(audioEngine.isMuted));

      if (!audioEngine.isMuted && 'speechSynthesis' in window) {
         const unlockUtterance = new SpeechSynthesisUtterance('');
         unlockUtterance.volume = 0;
         window.speechSynthesis.speak(unlockUtterance);
      }
   };

   const formatWord = (word: string) => {
      const letters = word.split('').map((char, i) => (
         <span 
            key={i} 
            className={`mx-0.5 sm:mx-1 inline-block animate-float-medium ${char === '_' ? 'opacity-30 dark:opacity-50' : 'text-primary-500 font-bold'}`}
            style={{ animationDelay: `${i * 0.05}s` }}
         >
            {char}
         </span>
      ));
      const wordLength = word.replace(/ /g, '').length;
      return (
         <div className="flex items-center flex-wrap justify-center">
            {letters}
            {wordLength > 0 && (
               <span className="ml-2 sm:ml-3 text-sm sm:text-lg text-slate-400 dark:text-slate-500 font-bold tracking-normal opacity-70 animate-pulse">
                  ({wordLength})
               </span>
            )}
         </div>
      );
   };

   const totalTime = roomState.phase === 'choosing_word' ? (roomState.settings.wordSelectTime || 15) : roomState.settings.drawTime;

   const isDrawer = me?.id === roomState.currentDrawerId;
   const showWord = roomState.phase === 'lobby'
      ? lobbyPhrase
      : roomState.phase === 'choosing_word'
         ? (isDrawer ? 'Pick a word...' : 'Waiting for Drawer...')
         : (isDrawer && roomState.currentWord
            ? formatWord(roomState.currentWord)
            : formatWord(hint));

   return (
      <div className="w-full glass-dock rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between transition-all gap-2 sm:gap-4 shadow-xl">
         {/* Left: Round Badge & Room Code */}
         <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="text-slate-300 text-[10px] sm:text-xs font-mono font-bold tracking-wider px-2 sm:px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] whitespace-nowrap">
               R{roomState.roundNumber}/{roomState.settings.rounds}
            </div>
            <button
               onClick={copyCode}
               title="Click to copy Room Code"
               className="flex items-center gap-1.5 text-xs sm:text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 sm:px-3 py-1 rounded-lg transition-all active:scale-95 group"
            >
               <span className="text-[10px] uppercase font-sans text-emerald-300/70">CODE:</span>
               <span>{roomState.id}</span>
               {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
               ) : (
                  <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
               )}
            </button>
         </div>

         {/* Center: Word hint / Mini Scratchpad */}
         <div className="flex-1 flex justify-center text-base sm:text-2xl font-heading font-extrabold tracking-widest uppercase text-white min-w-0 overflow-hidden text-center relative h-10 sm:h-11 rounded-xl bg-white/[0.02] border border-white/[0.05] group transition-all">
            {roomState.phase === 'lobby' ? (
               <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 group-hover:opacity-10 transition-opacity">
                     <WavyText text={lobbyPhrase} className="text-xs sm:text-sm truncate text-slate-300" />
                  </div>
                  <MiniDoodleBoard />
               </>
            ) : typeof showWord === 'string' ? (
               <WavyText text={showWord} className="text-xs sm:text-base font-bold text-slate-300 truncate my-auto" />
            ) : (
               <div className="my-auto">{showWord}</div>
            )}
         </div>

         {/* Right: Actions + Timer */}
         <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
               onClick={() => setIsHelpOpen(true)}
               title="How to play"
               className="p-1.5 sm:p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition-colors font-bold text-xs"
            >
               <HelpCircle className="w-4 h-4" />
            </button>
            <button
               onClick={toggleMute}
               title={isMuted ? "Unmute audio" : "Mute audio"}
               className="p-1.5 sm:p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition-colors"
            >
               {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
               onClick={handleExit}
               title="Exit Room"
               className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
            >
               <LogOut className="w-4 h-4" />
            </button>

            <CircularTimer timeRemaining={timer} totalTime={totalTime} size={36} strokeWidth={3.5} />
         </div>

         <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </div>
   );
}
