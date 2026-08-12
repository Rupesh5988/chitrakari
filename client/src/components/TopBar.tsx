import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Volume2, VolumeX, Moon, Sun } from 'lucide-react';
import { CircularTimer } from './CircularTimer';
import { useTheme } from '../context/ThemeContext';
import { audioEngine } from '../utils/AudioEngine';

export function TopBar() {
  const { roomState, socket, me } = useSocket();
  const [timer, setTimer] = useState(roomState?.timeRemaining || 0);
  const [hint, setHint] = useState(roomState?.hiddenWord || '');
  const { theme, toggleTheme } = useTheme();
  const [isMuted, setIsMuted] = useState(audioEngine.isMuted);

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

  const toggleMute = () => {
     audioEngine.isMuted = !audioEngine.isMuted;
     setIsMuted(audioEngine.isMuted);
     
     // Unlock TTS context immediately on user interaction
     if (!audioEngine.isMuted && 'speechSynthesis' in window) {
       const unlockUtterance = new SpeechSynthesisUtterance('');
       unlockUtterance.volume = 0;
       window.speechSynthesis.speak(unlockUtterance);
     }
  };

  const formatWord = (word: string) => {
    const letters = word.split('').map((char, i) => (
      <span key={i} className={`mx-1 ${char === '_' ? 'opacity-30 dark:opacity-50' : 'text-primary-500 font-bold'}`}>
        {char}
      </span>
    ));
    const wordLength = word.replace(/ /g, '').length;
    return (
      <div className="flex items-center">
         {letters}
         {wordLength > 0 && (
            <span className="ml-3 text-lg text-slate-400 dark:text-slate-500 font-bold tracking-normal opacity-70">
               ({wordLength})
            </span>
         )}
      </div>
    );
  };

  const totalTime = roomState.phase === 'choosing_word' ? 15 : roomState.settings.drawTime;

  return (
    <div className="bg-white dark:bg-paper-800 border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-soft dark:shadow-soft-dark p-4 flex items-center justify-between transition-colors">
       <div className="flex items-center gap-4 w-1/3">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-bold tracking-widest uppercase bg-slate-100 dark:bg-paper-900 px-4 py-2 rounded-2xl">
             Round {roomState.roundNumber} of {roomState.settings.rounds}
          </div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-3xl font-mono tracking-[0.2em] uppercase text-slate-800 dark:text-white">
             {roomState.phase === 'choosing_word' 
                ? 'Waiting for Drawer...' 
                : (me?.id === roomState.currentDrawerId && roomState.currentWord 
                    ? formatWord(roomState.currentWord) 
                    : formatWord(hint))}
          </div>
          {me?.id === roomState.currentDrawerId && roomState.currentWordMeaning && roomState.phase === 'drawing' && (
             <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-lg text-center leading-tight">
                {roomState.currentWordMeaning}
             </div>
          )}
       </div>

       <div className="flex items-center justify-end gap-3 w-1/3">
          <button 
             onClick={toggleMute}
             className="p-3 bg-slate-100 dark:bg-paper-900 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
             {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button 
             onClick={toggleTheme}
             className="p-3 bg-slate-100 dark:bg-paper-900 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mr-2"
          >
             {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <CircularTimer timeRemaining={timer} totalTime={totalTime} size={56} strokeWidth={5} />
       </div>
    </div>
  );
}
