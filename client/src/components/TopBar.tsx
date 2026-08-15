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
      <div className="bg-transparent border-transparent shadow-none p-2 sm:p-3 md:p-4 flex items-center justify-between transition-colors gap-2">
         {/* Left: Round info & Room Code */}
         <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-sm font-bold tracking-widest uppercase bg-slate-100 dark:bg-paper-900 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl whitespace-nowrap">
               R{roomState.roundNumber}/{roomState.settings.rounds}
            </div>
            <button
               onClick={copyCode}
               title="Click to copy Room Code"
               className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-mono font-bold tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/50 border border-primary-200 dark:border-primary-800/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl transition-all group shadow-sm active:scale-95"
            >
               <span className="text-[9px] sm:text-[11px] uppercase text-slate-400 dark:text-slate-500 font-sans tracking-normal font-semibold">CODE:</span>
               <span>{roomState.id}</span>
               {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
               ) : (
                  <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
               )}
            </button>
         </div>

         {/* Center: Word hint */}
         <div className="flex-1 flex justify-center text-lg sm:text-2xl md:text-3xl font-display tracking-widest uppercase text-slate-800 dark:text-white min-w-0 overflow-hidden text-center relative h-full min-h-[48px] rounded-xl bg-slate-100/50 dark:bg-slate-900/30 border border-transparent dark:border-slate-800/30 group transition-all">
            {roomState.phase === 'lobby' ? (
               <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 group-hover:opacity-10 transition-opacity">
                     <WavyText text={lobbyPhrase} className="text-sm sm:text-xl truncate" />
                  </div>
                  <MiniDoodleBoard />
               </>
            ) : typeof showWord === 'string' ? (
               <WavyText text={showWord} className="text-sm sm:text-xl truncate my-auto" />
            ) : (
               <div className="my-auto">{showWord}</div>
            )}
         </div>

         {/* Right: Controls + Timer */}
         <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            <button
               onClick={() => setIsHelpOpen(true)}
               title="How to play"
               className="p-1.5 sm:p-2 md:p-3 bg-slate-100 dark:bg-paper-900 text-slate-500 dark:text-slate-400 rounded-xl sm:rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-black text-lg"
            >
               ?
            </button>
            <button
               onClick={toggleMute}
               className="p-1.5 sm:p-2 md:p-3 bg-slate-100 dark:bg-paper-900 text-slate-500 dark:text-slate-400 rounded-xl sm:rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
               {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
               onClick={toggleTheme}
               className="hidden sm:block p-2 md:p-3 bg-slate-100 dark:bg-paper-900 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
               {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
               onClick={handleExit}
               title="Exit Room"
               className="hidden sm:block p-2 md:p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-full hover:bg-rose-200 dark:hover:bg-rose-800/50 transition-colors"
            >
               <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <CircularTimer timeRemaining={timer} totalTime={totalTime} size={40} strokeWidth={4} />
         </div>

         <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </div>
   );
}
