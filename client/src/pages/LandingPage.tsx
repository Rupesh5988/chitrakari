import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { generateRoomCode } from '@chitrakari/shared';
import { Avatar } from '../components/Avatar';
import { Dice5, Sparkles, User, Loader2, Palette, Users, Zap, HelpCircle, ChevronRight, BookOpen } from 'lucide-react';
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
  const [avatarSeed, setAvatarSeed] = useState(() => {
    return localStorage.getItem('chitrakari_avatar') || AVATAR_SEEDS[0];
  });
  const [activeTab, setActiveTab] = useState<'how' | 'about' | null>(null);

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
      toast.error('Connecting to server... Please try in a second');
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

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-between p-4 sm:p-8 select-none relative overflow-y-auto">
      
      {/* Top Header / Brand Badge */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 via-cyan-400 to-indigo-500 flex items-center justify-center shadow-md glow-cyan">
            <Palette className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-heading font-extrabold text-xl tracking-tight text-white">
            Chitrakari<span className="text-emerald-400">.io</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-slate-300">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{connected ? 'Live Multiplay' : 'Connecting...'}</span>
          </div>
        </div>
      </header>

      {/* Center Main Stage */}
      <main className="w-full max-w-md my-auto py-6 z-10 flex flex-col items-center">
        
        {/* Title Tagline */}
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-heading font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Draw. Guess. Win.
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1.5">
            The lightweight real-time multiplayer sketching game
          </p>
        </div>

        {/* Minimalist Glass Card */}
        <div className="w-full glass-card rounded-3xl p-6 sm:p-7 backdrop-blur-2xl">
          
          {/* Player Identity Input */}
          <div className="space-y-4 mb-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Enter your artist name"
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full glass-input text-white placeholder-slate-400 font-semibold pl-10 pr-4 py-3 rounded-2xl text-sm sm:text-base outline-none"
              />
            </div>

            {/* Avatar Selector Dock */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              {/* Active Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-400/80 p-0.5 glow-emerald flex items-center justify-center">
                  <Avatar seed={avatarSeed} size={50} />
                </div>
                <button
                  type="button"
                  onClick={randomizeAvatar}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center shadow-md transition-transform active:scale-90"
                  title="Randomize avatar"
                >
                  <Dice5 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Pick Palette */}
              <div className="flex-1 overflow-x-auto scrollbar-none flex items-center gap-1.5 py-1">
                {AVATAR_SEEDS.slice(0, 10).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setAvatarSeed(s);
                      localStorage.setItem('chitrakari_avatar', s);
                    }}
                    className={`w-9 h-9 flex-shrink-0 rounded-xl overflow-hidden p-0.5 transition-all ${
                      avatarSeed === s
                        ? 'ring-2 ring-emerald-400 scale-105 bg-white/10'
                        : 'opacity-60 hover:opacity-100 hover:scale-105 bg-white/[0.03]'
                    }`}
                  >
                    <Avatar seed={s} size={32} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          {isInvited ? (
            <button
              onClick={handleJoinRoom}
              disabled={joinCode.length !== 6}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.98] text-slate-950 font-heading font-extrabold text-base sm:text-lg py-3.5 rounded-2xl shadow-lg glow-emerald transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
              <span>Join Room & Play!</span>
            </button>
          ) : (
            <div className="space-y-3">
              {joinCode.length !== 6 && (
                <>
                  {/* Primary Play Button */}
                  <button
                    onClick={handlePlayQuick}
                    disabled={isFindingMatch}
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-heading font-extrabold text-base sm:text-lg py-3.5 rounded-2xl shadow-lg glow-emerald transition-all flex items-center justify-center gap-2"
                  >
                    {isFindingMatch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 stroke-[2.5]" />}
                    <span>{isFindingMatch ? 'Finding Match...' : 'Random Matchplay'}</span>
                  </button>

                  {/* Secondary Create Room Button */}
                  <button
                    onClick={handleCreatePrivateRoom}
                    className="w-full bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] text-slate-200 border border-white/[0.08] font-semibold text-sm sm:text-base py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Create Private Room</span>
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center my-2">
                    <div className="flex-grow border-t border-white/[0.06]"></div>
                    <span className="flex-shrink-0 mx-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">or room code</span>
                    <div className="flex-grow border-t border-white/[0.06]"></div>
                  </div>
                </>
              )}

              {/* Join Code Form */}
              <form onSubmit={handleJoinRoom} className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER 6-CHAR CODE"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 glass-input text-white text-center font-mono font-bold tracking-[0.25em] px-4 py-2.5 rounded-xl uppercase text-sm placeholder:font-sans placeholder:tracking-normal placeholder:text-xs placeholder:text-slate-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={joinCode.length !== 6}
                  className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center gap-1 glow-indigo"
                >
                  <span>Join</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Minimalist Info Chips */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setActiveTab(activeTab === 'how' ? null : 'how')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
              activeTab === 'how'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>How to play</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'about' ? null : 'about')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>About Chitrakari</span>
          </button>
        </div>

        {/* Expandable Info Cards */}
        {activeTab === 'how' && (
          <div className="w-full mt-3 p-4 rounded-2xl glass-card text-xs text-slate-300 space-y-2 animate-float-slow">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Quick Rules
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
              <li>When it is your turn to draw, pick 1 of 3 words and sketch it on the canvas.</li>
              <li>When other players are drawing, guess the word in the chat box.</li>
              <li>The faster you guess correctly, the more points you score!</li>
            </ol>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="w-full mt-3 p-4 rounded-2xl glass-card text-xs text-slate-300 space-y-2 animate-float-slow">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> About the Studio
            </div>
            <p className="text-slate-400 leading-relaxed">
              Chitrakari is an artistic multiplayer pictionary studio with smart dictionary meanings, Indian doodle expressions, and high-precision brush tools.
            </p>
          </div>
        )}

      </main>

      {/* Sleek Minimalist Footer */}
      <footer className="w-full max-w-5xl py-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-white/[0.04] z-10 gap-1">
        <span>Chitrakari &copy; {new Date().getFullYear()}</span>
        <span className="text-slate-400">Crafted with ❤️ by Raren and team</span>
      </footer>

    </div>
  );
}

