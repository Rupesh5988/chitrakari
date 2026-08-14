import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { generateRoomCode } from '@chitrakari/shared';
import { Avatar } from '../components/Avatar';
import { Dice5, ChevronLeft, ChevronRight, HelpCircle, BookOpen, PenTool, Sparkles } from 'lucide-react';

const AVATAR_SEEDS = [
  'star-seed-1', 'pixel-bot-2', 'doodle-cat-3', 'happy-cloud-4',
  'fire-spark-5', 'cool-shades-6', 'cosmic-gem-7', 'ninja-frog-8',
  'sunny-day-9', 'magic-wand-10', 'neon-glow-11', 'space-rocket-12'
];

export function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('chitrakari_name') || '');
  const [language, setLanguage] = useState('English');
  const [seedIndex, setSeedIndex] = useState(0);
  const [avatarSeed, setAvatarSeed] = useState(() => {
    return localStorage.getItem('chitrakari_avatar') || AVATAR_SEEDS[0];
  });

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
    savePlayerInfo();
    const code = generateRoomCode();
    navigate(`/room/${code}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      savePlayerInfo();
      navigate(`/room/${joinCode.toUpperCase()}`);
    }
  };

  const cycleAvatar = (direction: 'prev' | 'next') => {
    let nextIdx = direction === 'next' ? seedIndex + 1 : seedIndex - 1;
    if (nextIdx < 0) nextIdx = AVATAR_SEEDS.length - 1;
    if (nextIdx >= AVATAR_SEEDS.length) nextIdx = 0;
    setSeedIndex(nextIdx);
    const newSeed = AVATAR_SEEDS[nextIdx];
    setAvatarSeed(newSeed);
    localStorage.setItem('chitrakari_avatar', newSeed);
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
    <div className="min-h-[100dvh] bg-[#1a3a6b] dark:bg-[#0c1a33] text-white flex flex-col items-center justify-between p-3 sm:p-6 select-none relative overflow-x-hidden">
      
      {/* Background doodles subtle overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-4xl w-full flex flex-col items-center z-10 flex-1 justify-center py-4">

        {/* Skribbl Style Colorful Logo */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div className="flex items-center text-4xl sm:text-6xl md:text-7xl font-black tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] font-mono">
            {logoTitle.map((letter, i) => (
              <span 
                key={i} 
                style={{ color: logoColors[i % logoColors.length] }}
                className="inline-block hover:scale-125 hover:-rotate-6 transition-transform cursor-pointer drop-shadow-md"
              >
                {letter}
              </span>
            ))}
            <span className="text-3xl sm:text-5xl ml-1 animate-bounce">✏️</span>
          </div>

          {/* Row of cute mini doodle avatars underneath logo */}
          <div className="flex items-center gap-1 sm:gap-2 mt-2">
            {AVATAR_SEEDS.slice(0, 8).map((s, idx) => (
              <div key={idx} className="hover:-translate-y-1 transition-transform cursor-pointer">
                <Avatar seed={s} size={28} />
              </div>
            ))}
          </div>
        </div>

        {/* Center Main Card (Skribbl Play Box) */}
        <div className="w-full max-w-md bg-[#254b85] dark:bg-[#152747] border-4 border-[#142e57] dark:border-[#09152b] rounded-3xl p-4 sm:p-6 shadow-2xl relative mb-8">
          
          {/* Top Row: Name Input & Language Select */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Enter your name"
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-white text-slate-800 placeholder-slate-400 font-bold px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-blue-400 text-base shadow-inner"
              />
            </div>
            <div className="col-span-1">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-white text-slate-800 font-bold px-2 py-2.5 rounded-xl border-2 border-slate-300 focus:outline-none text-sm shadow-inner cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
                <option value="German">German</option>
              </select>
            </div>
          </div>

          {/* Avatar Studio Box */}
          <div className="bg-[#193766] dark:bg-[#0e1d38] border-2 border-[#12284c] rounded-2xl p-4 mb-4 flex items-center justify-between relative shadow-inner">
            <button
              type="button"
              onClick={() => cycleAvatar('prev')}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl flex items-center justify-center font-black transition-all"
              title="Previous Avatar Style"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center">
              <div className="p-2 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
                <Avatar seed={avatarSeed} size={84} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => cycleAvatar('next')}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl flex items-center justify-center font-black transition-all"
              title="Next Avatar Style"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Randomize Dice Button */}
            <button
              type="button"
              onClick={randomizeAvatar}
              className="absolute top-2 right-2 p-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl shadow-md active:scale-90 transition-transform flex items-center gap-1 text-xs font-black"
              title="Randomize Avatar"
            >
              <Dice5 className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* Play Button (Big Green) */}
            <button
              onClick={handlePlayQuick}
              className="w-full bg-[#53b827] hover:bg-[#469e20] active:scale-[0.98] text-white font-black text-2xl py-3.5 rounded-2xl shadow-[0_4px_0_#2e7011] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-6 h-6" />
              Play!
            </button>

            {/* Create Private Room Button (Big Blue) */}
            <button
              onClick={handleCreatePrivateRoom}
              className="w-full bg-[#1e88e5] hover:bg-[#1976d2] active:scale-[0.98] text-white font-bold text-lg py-3 rounded-2xl shadow-[0_4px_0_#1565c0] transition-all"
            >
              Create Private Room
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-3 text-xs font-bold uppercase tracking-widest text-blue-200/60">or join code</span>
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
              className="flex-1 bg-white text-slate-900 text-center font-mono font-black tracking-[0.2em] px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:outline-none uppercase text-lg shadow-inner placeholder:font-normal placeholder:tracking-normal placeholder:text-sm placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={joinCode.length !== 6}
              className="bg-[#fb8c00] hover:bg-[#f57c00] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl shadow-[0_3px_0_#e65100] active:scale-95 transition-all text-sm uppercase tracking-wider"
            >
              Join
            </button>
          </form>

        </div>

        {/* Bottom 3-Card Information Grid (About, News, How to Play) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
          
          {/* 1. About Card */}
          <div className="bg-[#204277] dark:bg-[#122340] border-2 border-[#122c54] rounded-2xl p-4 shadow-lg flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-amber-300 font-bold text-base">
              <HelpCircle className="w-5 h-5" />
              <span>About</span>
            </div>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              <strong className="text-white">Chitrakari</strong> is a free online multiplayer drawing and guessing pictionary game. Every round a player sketches their chosen word while others race to guess it in chat to score points!
            </p>
          </div>

          {/* 2. News Card */}
          <div className="bg-[#204277] dark:bg-[#122340] border-2 border-[#122c54] rounded-2xl p-4 shadow-lg flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-emerald-300 font-bold text-base">
              <BookOpen className="w-5 h-5" />
              <span>News & Updates</span>
            </div>
            <ul className="text-xs text-blue-100/80 space-y-1 list-disc list-inside">
              <li>Smart dictionary with word definitions</li>
              <li>Zero-duplicate word tracking memory</li>
              <li>Revamped mobile touch drawing & canvas</li>
              <li>One-click room invite codes & links</li>
            </ul>
          </div>

          {/* 3. How to Play Card */}
          <div className="bg-[#204277] dark:bg-[#122340] border-2 border-[#122c54] rounded-2xl p-4 shadow-lg flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-cyan-300 font-bold text-base">
              <PenTool className="w-5 h-5" />
              <span>How to play</span>
            </div>
            <ol className="text-xs text-blue-100/80 space-y-1 list-decimal list-inside">
              <li>When it is your turn, pick a word and draw it!</li>
              <li>When others draw, type your guesses in the chat.</li>
              <li>Guess faster to score the highest points and win!</li>
            </ol>
          </div>

        </div>

      </div>

      {/* Footer copyright */}
      <footer className="text-xs text-blue-200/50 text-center py-2 z-10">
        Chitrakari Multiplayer &copy; {new Date().getFullYear()} — Made with ❤️ for drawing lovers
      </footer>
    </div>
  );
}
