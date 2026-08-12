import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { generateRoomCode } from '@chitrakari/shared';
import { Palette, Play, Sparkles } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('chitrakari_name') || '');

  useEffect(() => {
    const roomFromUrl = searchParams.get('room');
    if (roomFromUrl && roomFromUrl.length === 6) {
       setJoinCode(roomFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleCreateRoom = () => {
    if (playerName.trim()) localStorage.setItem('chitrakari_name', playerName.trim());
    const code = generateRoomCode();
    navigate(`/room/${code}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) localStorage.setItem('chitrakari_name', playerName.trim());
    if (joinCode.trim().length === 6) {
      navigate(`/room/${joinCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />

      <div className="max-w-md w-full bg-white dark:bg-paper-800 rounded-[3rem] p-8 md:p-12 shadow-soft dark:shadow-soft-dark border border-slate-200 dark:border-slate-700/50 z-10 relative">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-tr from-primary-400 to-primary-600 rounded-3xl rotate-12 flex items-center justify-center shadow-lg relative group">
            <Palette className="w-12 h-12 text-white -rotate-12 group-hover:scale-110 transition-transform" />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-300 animate-pulse" />
          </div>
        </div>

        <h1 className="text-5xl font-black text-center mb-2 text-slate-800 dark:text-white tracking-tight">Chitrakari</h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-10 font-medium">Draw, guess, and laugh together.</p>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2">Your Name</label>
            <input
              type="text"
              placeholder="Enter your nickname..."
              maxLength={15}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700/50 rounded-2xl px-6 py-4 text-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
            />
          </div>

          <button
            onClick={handleCreateRoom}
            className="w-full group bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 text-lg"
          >
            <Play className="w-5 h-5 fill-current" />
            Create New Room
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-3">
            <input
              type="text"
              placeholder="Enter 6-letter Room Code"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-50 dark:bg-paper-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-center text-2xl font-bold tracking-[0.2em] py-4 px-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-colors uppercase placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:text-lg placeholder:tracking-normal placeholder:font-normal"
            />
            <button
              type="submit"
              disabled={joinCode.length !== 6}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-6 rounded-2xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
