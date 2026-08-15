import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { generateRoomCode } from '@chitrakari/shared';
import { Avatar } from '../components/Avatar';
import { Dice5, ChevronLeft, ChevronRight, HelpCircle, BookOpen, PenTool, Sparkles, User, Loader2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { toast } from 'sonner';

const AVATAR_SEEDS = [
  'Arjun', 'Priya', 'Ravi', 'Kavya',
  'Dev', 'Ananya', 'Rahul', 'Neha',
  'Vikram', 'Sneha', 'Aditya', 'Maya',
  'Rohan', 'Diya', 'Kabir', 'Tara'
];

export function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('chitrakari_name') || '');
  const [seedIndex, setSeedIndex] = useState(0);
  const [avatarSeed, setAvatarSeed] = useState(() => {
    return localStorage.getItem('chitrakari_avatar') || AVATAR_SEEDS[0];
  });

  const { socket, connected } = useSocket();
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const isInvited = !!searchParams.get('room');

  useEffect(() => {
    const roomFromUrl = searchParams.get('room');
    if (roomFromUrl && roomFromUrl.length === 6) {
      setJoinCode(roomFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const savePlayerInfo = () => {
    const finalName = playerName.trim() || `Player_${Math.floor(Math.random() * 900 + 100)}`;
    localStorage.setItem('chitrakari_name', finalName);
    localStorage.setItem('chitrakari_avatar', avatarSeed);
    return finalName;
  };

  const handleCreatePrivateRoom = () => {
    savePlayerInfo();
    const code = generateRoomCode();
    navigate(`/room/${code}`);
  };

  const handlePlayQuick = () => {
    if (!socket || !connected) {
      toast.error('Not connected to server');
      return;
    }
    
    setIsFindingMatch(true);
    const finalName = savePlayerInfo();
    
    socket.emit('join_random_room', { name: finalName, avatarSeed }, (response: any) => {
      setIsFindingMatch(false);
      if (response && response.success) {
        navigate(`/room/${response.roomId}`);
      } else {
        toast.error('Failed to find or create a match');
      }
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      savePlayerInfo();
      navigate(`/room/${joinCode.toUpperCase()}`);
    }
  };



  const randomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 10);
    setAvatarSeed(randomSeed);
    localStorage.setItem('chitrakari_avatar', randomSeed);
  };

  // Color array for Chitrakari logo letters
  const logoColors = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E'
  ];
  const logoTitle = "chitrakari.io!".split('');

  return (
    <div className="h-[100dvh] overflow-y-auto overflow-x-hidden text-white flex flex-col items-center justify-between p-2.5 sm:p-6 pb-[max(env(safe-area-inset-bottom),1rem)] select-none relative">

      <div className="max-w-4xl w-full flex flex-col items-center z-10 flex-1 justify-center py-2 sm:py-4">

        {/* Skribbl Style Colorful Logo */}
        <div className="flex flex-col items-center mb-3 sm:mb-6 text-center">
          <div className="flex items-center justify-center flex-wrap text-4xl sm:text-7xl md:text-8xl font-black tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] font-display">
            {logoTitle.map((letter, i) => (
              <span 
                key={i} 
                style={{ color: logoColors[i % logoColors.length] }}
                className="inline-block hover:scale-125 hover:-rotate-6 transition-transform cursor-pointer drop-shadow-md"
              >
                {letter}
              </span>
            ))}
            <span className="text-2xl sm:text-5xl ml-1 animate-bounce">✏️</span>
          </div>
        </div>

        {/* Center Main Card (Skribbl Play Box) */}
        <div className="w-full max-w-sm sm:max-w-md bg-transparent border-transparent rounded-3xl p-4 sm:p-6 shadow-none relative mb-6">
          
          {/* Top Row: Clean Full-Width Name Input */}
          <div className="relative mb-3.5">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Enter your name"
              maxLength={16}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-white/50 font-bold pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border-2 border-white/20 focus:outline-none focus:border-white/60 text-base sm:text-lg shadow-inner"
            />
          </div>

          {/* Avatar Studio Box with Grid */}
          <div className="bg-transparent border-transparent rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-center gap-4 relative shadow-none">
            
            {/* Selected Big Avatar */}
            <div className="relative flex-shrink-0">
              <div className="p-2 bg-white/10 rounded-2xl border border-white/20 shadow-lg relative">
                <Avatar seed={avatarSeed} size={88} className="sm:w-24 sm:h-24" />
                <button
                  type="button"
                  onClick={randomizeAvatar}
                  className="absolute -top-2 -right-2 w-9 h-9 flex items-center justify-center bg-amber-400 hover:bg-amber-300 active:scale-90 text-slate-900 rounded-full shadow-md transition-transform border-2 border-white/20"
                  title="Roll Random Avatar"
                >
                  <Dice5 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid Options */}
            <div className="flex-1 grid grid-cols-4 sm:grid-cols-4 gap-2 w-full max-w-[240px]">
              {AVATAR_SEEDS.slice(0, 8).map((s, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    setAvatarSeed(s);
                    localStorage.setItem('chitrakari_avatar', s);
                  }}
                  className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-200 border-2 ${
                    avatarSeed === s 
                      ? 'border-amber-400 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
                      : 'border-transparent hover:border-white/30 hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title="Select this avatar"
                >
                  <Avatar seed={s} size={48} className="w-full h-auto aspect-square bg-white/5" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons & Forms */}
          {isInvited ? (
            <div className="space-y-2.5">
               <button
                 onClick={handleJoinRoom}
                 disabled={joinCode.length !== 6}
                 className="w-full bg-[#53b827] hover:bg-[#469e20] active:scale-[0.98] text-white font-black text-xl sm:text-2xl py-3 sm:py-3.5 rounded-2xl shadow-[0_4px_0_#2e7011] transition-all flex items-center justify-center gap-2"
               >
                 <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                 Play!
               </button>
            </div>
          ) : (
            <>
              <div className="space-y-2.5 flex flex-col items-center">
                
                {/* Only show these if they aren't typing a room code */}
                {joinCode.length !== 6 && (
                  <div className="w-full space-y-2.5 mb-2">
                    {/* Randomly Play Button (Big Green) */}

                    <button
                      onClick={handlePlayQuick}
                      disabled={isFindingMatch}
                      className="w-full bg-[#53b827] hover:bg-[#469e20] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed text-white font-black text-xl sm:text-2xl py-3 sm:py-3.5 rounded-2xl shadow-[0_4px_0_#2e7011] transition-all flex items-center justify-center gap-2"
                    >
                      {isFindingMatch ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />}
                      {isFindingMatch ? 'Finding Match...' : 'Randomly Play!'}
                    </button>

                    {/* Create Private Room Button (Big Blue) */}
                    <button
                      onClick={handleCreatePrivateRoom}
                      className="w-full bg-[#1e88e5] hover:bg-[#1976d2] active:scale-[0.98] text-white font-bold text-base sm:text-lg py-2.5 sm:py-3 rounded-2xl shadow-[0_4px_0_#1565c0] transition-all"
                    >
                      Create Private Room
                    </button>
                  </div>
                )}

              {/* Divider */}
              <div className="relative flex items-center my-3 sm:my-4">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-3 text-[11px] font-bold uppercase tracking-widest text-blue-200/60">or join code</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              {/* Join Room Form */}
              <form onSubmit={handleJoinRoom} className="flex gap-2">
                <input
                  type="text"
                  placeholder="ROOM CODE"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-white/10 text-white text-center font-mono font-black tracking-[0.2em] px-3 py-2 sm:py-2.5 rounded-xl border-2 border-white/20 focus:outline-none focus:border-white/60 uppercase text-base sm:text-lg shadow-inner placeholder:font-normal placeholder:tracking-normal placeholder:text-xs placeholder:text-white/50"
                />
                <button
                  type="submit"
                  disabled={joinCode.length !== 6}
                  className="bg-[#fb8c00] hover:bg-[#f57c00] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-[0_3px_0_#e65100] active:scale-95 transition-all text-xs sm:text-sm uppercase tracking-wider"
                >
                  Join
                </button>
              </form>
            </>
          )}

        </div>

        {/* Bottom 3-Card Information Grid (About, News, How to Play) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 max-w-4xl">
          
          {/* 1. About Card */}
          <div className="bg-transparent border-transparent rounded-2xl p-3.5 sm:p-4 shadow-none flex flex-col">
            <div className="flex items-center gap-2 mb-1.5 text-amber-300 font-bold text-sm sm:text-base">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>About</span>
            </div>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              <strong className="text-white">Chitrakari</strong> is a free online multiplayer drawing and guessing pictionary game. Every round a player sketches their chosen word while others race to guess it in chat to score points!
            </p>
          </div>

          {/* 2. News Card */}
          <div className="bg-transparent border-transparent rounded-2xl p-3.5 sm:p-4 shadow-none flex flex-col">
            <div className="flex items-center gap-2 mb-1.5 text-emerald-300 font-bold text-sm sm:text-base">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>News & Updates</span>
            </div>
            <ul className="text-xs text-blue-100/80 space-y-1 list-disc list-inside">
              <li>Smart dictionary with word definitions</li>
              <li>New Indian doodle avatars & expressions</li>
              <li>Revamped mobile touch drawing & guessing</li>
              <li>Instant 1-click room invite codes</li>
            </ul>
          </div>

          {/* 3. How to Play Card */}
          <div className="bg-transparent border-transparent rounded-2xl p-3.5 sm:p-4 shadow-none flex flex-col">
            <div className="flex items-center gap-2 mb-1.5 text-cyan-300 font-bold text-sm sm:text-base">
              <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>How to play</span>
            </div>
            <ol className="text-xs text-blue-100/80 space-y-1 list-decimal list-inside">
              <li>When it is your turn, pick a word and draw it!</li>
              <li>When others draw, type your guesses in the chat.</li>
              <li>Guess faster to score highest points and win!</li>
            </ol>
          </div>

        </div>

      </div>

      {/* Footer copyright */}
      <footer className="text-[11px] sm:text-xs text-blue-200/50 text-center py-2 z-10">
        Chitrakari Multiplayer &copy; {new Date().getFullYear()} — Made with ❤️ by Raren and team
      </footer>
    </div>
  );
}
