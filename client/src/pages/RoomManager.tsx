import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { GameView } from './GameView';
import { Trophy, Users, Settings, Play, Link as LinkIcon, Edit2, Copy, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { PlayerContextMenu } from '../components/PlayerContextMenu';
import { TopBar } from '../components/TopBar';
import { ChatSidebar } from '../components/ChatSidebar';
import { Avatar } from '../components/Avatar';
import { Player, ReactionPayload } from '@chitrakari/shared';
import { toast } from 'sonner';

export function RoomManager() {
   const { code } = useParams();
   const navigate = useNavigate();
   const { socket, connected, roomState, setRoomState, me, setMe, error } = useSocket();
   const [copied, setCopied] = useState(false);
   const [hasJoined, setHasJoined] = useState(false);

   // Settings State
   const [isEditingSettings, setIsEditingSettings] = useState(false);
   const [customWordsStr, setCustomWordsStr] = useState('');
   const [editRounds, setEditRounds] = useState(3);
   const [editDrawTime, setEditDrawTime] = useState(80);
   const [editWordDifficulty, setEditWordDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
   const [editWordSelectTime, setEditWordSelectTime] = useState(15);
   const [editMaxPlayers, setEditMaxPlayers] = useState(8);
   const [menuTarget, setMenuTarget] = useState<Player | null>(null);
   const [activeReactions, setActiveReactions] = useState<(ReactionPayload & { id: string })[]>([]);

   useEffect(() => {
      if (!socket) return;
      const handleReaction = (payload: ReactionPayload) => {
         const reactionObj = { ...payload, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() };
         setActiveReactions(prev => [...prev, reactionObj]);
         setTimeout(() => {
            setActiveReactions(prev => prev.filter(r => r.id !== reactionObj.id));
         }, 2000);
      };

      socket.on('reaction_received', handleReaction);
      return () => {
         socket.off('reaction_received', handleReaction);
      };
   }, [socket]);

   useEffect(() => {
      if (!socket || !code || hasJoined) return;

      // Redirect to Landing Page if no name is set
      const savedName = localStorage.getItem('chitrakari_name');
      if (!savedName || savedName.trim() === '') {
         navigate(`/?room=${code}`);
         return;
      }

      // Auto-join room on mount
      const seed = localStorage.getItem('chitrakari_avatar') || Math.random().toString(36).substring(7);
      localStorage.setItem('chitrakari_avatar', seed);

      socket.emit('join_room', {
         roomId: code,
         name: savedName,
         avatarSeed: seed,
         playerId: localStorage.getItem('chitrakari_playerId') || undefined
      }, (response: any) => {
         if (response.success) {
            setRoomState(response.room);
            setMe(response.player);
            localStorage.setItem('chitrakari_playerId', response.player.id);
         } else {
            toast.error(response.message || "Failed to join room");
            navigate('/');
         }
      });
      setHasJoined(true);
   }, [socket, code, hasJoined]);

   useEffect(() => {
      if (error) {
         toast.error(error);
         navigate('/');
      }
   }, [error, navigate]);

   useEffect(() => {
      if (!connected && hasJoined) {
         toast.error("Connection lost. Reconnecting...");
      } else if (connected && hasJoined && roomState) {
         toast.success("Connected to room!");
      }
   }, [connected, hasJoined]);

   if (!connected || !roomState) {
      return (
         <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-500 animate-pulse">Connecting to room...</h2>
         </div>
      );
   }

   // If game has started (or ended with podium), render GameView
   if (roomState.phase !== 'lobby') {
      return <GameView />;
   }

   const handleStart = () => {
      if (socket) {
         socket.emit('start_game', { roomId: roomState.id });
      }
   };

   const handleSaveSettings = () => {
      if (!socket || !roomState || !me?.isHost) return;
      const words = customWordsStr.split(',').map(w => w.trim()).filter(w => w.length > 0);
      const updatedSettings = {
         ...roomState.settings,
         customWords: words,
         rounds: editRounds,
         drawTime: editDrawTime,
         maxPlayers: editMaxPlayers,
         wordDifficulty: editWordDifficulty,
         wordSelectTime: editWordSelectTime
      };
      socket.emit('update_settings', { roomId: roomState.id, settings: updatedSettings });
      setIsEditingSettings(false);
      toast.success("Settings saved!");
   };

   const copyRoomCode = () => {
      navigator.clipboard.writeText(roomState.id);
      setCopied(true);
      toast.success("Room code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
   };

   return (
      <div className="h-[100dvh] overflow-hidden p-2.5 sm:p-4 pb-[max(env(safe-area-inset-bottom),0.5rem)] lg:pb-[max(env(safe-area-inset-bottom),1rem)] flex flex-col gap-2.5 sm:gap-4 relative select-none">
         
         <div className="z-10 w-full max-w-[1600px] mx-auto"><TopBar /></div>

         <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-4 flex-1 h-0 min-h-0 relative max-w-[1600px] mx-auto w-full z-10">

            {/* Left Column: Players */}
            <div className="w-full md:w-64 glass-card rounded-2xl p-3.5 flex flex-col h-full overflow-hidden">
               <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3 px-1">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Artists ({roomState.players.length}/{roomState.settings.maxPlayers})</span>
               </h2>
               <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1.5 pr-0.5">
                  {roomState.players.map((p, index) => (
                     <div 
                        key={p.id} 
                        onClick={() => p.id !== me?.id && setMenuTarget(menuTarget?.id === p.id ? null : p)}
                        className={`relative cursor-pointer flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                           menuTarget?.id === p.id 
                              ? 'bg-white/10 border-white/20' 
                              : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.05]'
                        } ${p.connected === false ? 'opacity-40 grayscale' : ''}`}
                     >
                        <div className="text-[10px] font-mono font-bold text-slate-500 w-3.5 text-center">#{index + 1}</div>
                        <div className="relative flex-shrink-0">
                           <Avatar seed={p.avatarSeed} size={36} />
                           <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${p.connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0 px-2.5">
                           <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                              {p.name}
                           </div>
                           <div className="text-[10px] text-slate-400 font-mono">{p.score} pts</div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                           {p.isHost && <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-md leading-none">Host</span>}
                           {p.id === me?.id && <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-md leading-none">You</span>}
                        </div>
                        {menuTarget?.id === p.id && (
                           <PlayerContextMenu target={p} onClose={() => setMenuTarget(null)} />
                        )}
                     </div>
                  ))}

                  {/* Empty slots */}
                  {Array.from({ length: Math.max(0, roomState.settings.maxPlayers - roomState.players.length) }).map((_, i) => (
                     <div key={`empty-${i}`} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-white/[0.05] bg-white/[0.01] opacity-40">
                        <div className="w-8 h-8 rounded-full bg-white/[0.05]" />
                        <div className="flex-1">
                           <div className="h-2.5 w-16 bg-white/[0.05] rounded-full mb-1" />
                           <div className="h-2 w-10 bg-white/[0.03] rounded-full" />
                        </div>
                     </div>
                  ))}
               </div>

            </div>

            {/* Center Column: Settings & Actions */}
            <div className="flex-1 glass-card rounded-2xl p-4 sm:p-5 flex flex-col overflow-y-auto scrollbar-thin">
               
               {/* Minimalist Room Invite Card */}
               <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent border border-emerald-500/20 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-center sm:text-left">
                     <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest block">Room Invite Code</span>
                     <div className="text-2xl sm:text-3xl font-mono font-black tracking-[0.2em] text-white mt-0.5">
                        {roomState.id}
                     </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                     <button
                        onClick={copyRoomCode}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95"
                     >
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                     </button>
                     <button
                        onClick={() => {
                           const link = `${window.location.origin}/room/${roomState.id}`;
                           navigator.clipboard.writeText(link);
                           toast.success("Invite link copied to clipboard!");
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs glow-emerald transition-all active:scale-95"
                     >
                        <span>Share Link</span>
                     </button>
                  </div>
               </div>

               <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Settings className="w-3.5 h-3.5 text-cyan-400" /> 
                     <span>Match Settings</span>
                  </h2>
                  {me?.isHost && (
                     <button
                        onClick={() => {
                           if (isEditingSettings) handleSaveSettings();
                           else {
                              setCustomWordsStr(roomState.settings.customWords?.join(', ') || '');
                              setEditRounds(roomState.settings.rounds);
                              setEditDrawTime(roomState.settings.drawTime);
                              setEditMaxPlayers(roomState.settings.maxPlayers || 8);
                              setEditWordDifficulty(roomState.settings.wordDifficulty);
                              setEditWordSelectTime(roomState.settings.wordSelectTime || 15);
                              setIsEditingSettings(true);
                           }
                        }}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded-lg transition-colors"
                     >
                        {isEditingSettings ? 'Save Settings' : 'Edit'}
                     </button>
                  )}
               </div>

               <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2.5 mb-4 text-xs">
                  
                  {/* Players / Max Players Setting */}
                  <div className="flex items-center justify-between py-1">
                     <span className="font-semibold text-slate-300">Max Players</span>
                     {isEditingSettings ? (
                        <select 
                           value={editMaxPlayers} 
                           onChange={e => setEditMaxPlayers(parseInt(e.target.value))} 
                           className="glass-input rounded-lg px-3 py-1 text-xs font-bold text-white outline-none w-36"
                        >
                           <option value="2">2 Players</option>
                           <option value="4">4 Players</option>
                           <option value="6">6 Players</option>
                           <option value="8">8 Players</option>
                           <option value="10">10 Players</option>
                           <option value="12">12 Players</option>
                           <option value="16">16 Players</option>
                        </select>
                     ) : (
                        <span className="font-mono font-bold text-emerald-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.05]">{roomState.settings.maxPlayers || 8}</span>
                     )}
                  </div>

                  <div className="flex items-center justify-between py-1">
                     <span className="font-semibold text-slate-300">Draw Time</span>
                     {isEditingSettings ? (
                        <select value={editDrawTime} onChange={e => setEditDrawTime(parseInt(e.target.value))} className="glass-input rounded-lg px-3 py-1 text-xs font-bold text-white outline-none w-36">
                           <option value="40">40 seconds</option>
                           <option value="60">60 seconds</option>
                           <option value="80">80 seconds</option>
                           <option value="120">120 seconds</option>
                        </select>
                     ) : (
                        <span className="font-mono font-bold text-cyan-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.05]">{roomState.settings.drawTime}s</span>
                     )}
                  </div>

                  <div className="flex items-center justify-between py-1">
                     <span className="font-semibold text-slate-300">Word Select Time</span>
                     {isEditingSettings ? (
                        <select value={editWordSelectTime} onChange={e => setEditWordSelectTime(parseInt(e.target.value))} className="glass-input rounded-lg px-3 py-1 text-xs font-bold text-white outline-none w-36">
                           <option value="5">5 seconds</option>
                           <option value="10">10 seconds</option>
                           <option value="15">15 seconds</option>
                           <option value="20">20 seconds</option>
                        </select>
                     ) : (
                        <span className="font-mono font-bold text-indigo-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.05]">{roomState.settings.wordSelectTime || 15}s</span>
                     )}
                  </div>

                  <div className="flex items-center justify-between py-1">
                     <span className="font-semibold text-slate-300">Total Rounds</span>
                     {isEditingSettings ? (
                        <input type="number" min="1" max="10" value={editRounds} onChange={e => setEditRounds(parseInt(e.target.value) || 3)} className="glass-input rounded-lg px-3 py-1 text-xs font-bold text-white outline-none w-36" />
                     ) : (
                        <span className="font-mono font-bold text-amber-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.05]">{roomState.settings.rounds}</span>
                     )}
                  </div>

                  <div className="flex items-center justify-between py-1">
                     <span className="font-semibold text-slate-300">Difficulty</span>
                     {isEditingSettings ? (
                        <select value={editWordDifficulty} onChange={e => setEditWordDifficulty(e.target.value as any)} className="glass-input rounded-lg px-3 py-1 text-xs font-bold text-white outline-none w-36 capitalize">
                           <option value="easy">Easy</option>
                           <option value="medium">Medium</option>
                           <option value="hard">Hard</option>
                           <option value="mixed">Mixed</option>
                        </select>
                     ) : (
                        <span className="font-bold text-white capitalize bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.05]">{roomState.settings.wordDifficulty}</span>
                     )}
                  </div>
               </div>

               <div className="flex-1 flex flex-col p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-semibold text-slate-300">Custom Word Packs</span>
                     <span className="text-[10px] text-slate-400">Click a pack to quick-load</span>
                  </div>

                  {/* 1-Click Theme Pack Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                     {[
                        { name: '🍕 Food & Snacks', words: 'Pizza, Burger, Biryani, Chai, Dosa, Sushi, Taco, Ice Cream, Pasta, Coffee, Pancakes, Chocolate' },
                        { name: '🐾 Animals', words: 'Tiger, Elephant, Dolphin, Kangaroo, Penguin, Chameleon, Octopus, Peacock, Lion, Panda, Giraffe, Koala' },
                        { name: '🎬 Movies & Heroes', words: 'Batman, Harry Potter, Spider-Man, Star Wars, Iron Man, Titanic, Matrix, Shrek, Avatar, Jurassic Park, Joker, Thor' },
                        { name: '💻 Tech & Gaming', words: 'Laptop, Robot, Keyboard, Smartphone, VR Headset, Bitcoin, Minecraft, Rocket, Satellite, Controller, Mario, Pokemon' },
                        { name: '🇮🇳 Desi Culture', words: 'Rickshaw, Gulab Jamun, Cricket, Taj Mahal, Samosa, Bollywood, Diya, Auto, Lassi, Garba, Dholak, Kurta' }
                     ].map(pack => (
                        <button
                           key={pack.name}
                           type="button"
                           disabled={!me?.isHost}
                           onClick={() => {
                              setIsEditingSettings(true);
                              setCustomWordsStr(pack.words);
                              toast.success(`Loaded "${pack.name}" pack!`);
                           }}
                           className="text-[11px] font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-white/[0.08] px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                           {pack.name}
                        </button>
                     ))}
                  </div>

                  <textarea
                     readOnly={!isEditingSettings}
                     value={isEditingSettings ? customWordsStr : (roomState.settings.customWords?.join(', ') || '')}
                     onChange={(e) => setCustomWordsStr(e.target.value)}
                     placeholder="Minimum of 10 custom words, comma-separated (e.g. Samosa, Taj Mahal, Cricket)"
                     className="flex-1 glass-input rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 resize-none min-h-[85px]"
                  />
               </div>

               {/* Start Button */}
               <div className="mt-4 flex flex-col items-center">
                  <button
                     onClick={handleStart}
                     disabled={!me?.isHost || roomState.players.length < 2}
                     className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 disabled:hover:from-emerald-500 disabled:hover:to-cyan-500 text-slate-950 font-heading font-extrabold text-lg py-3 rounded-xl shadow-lg glow-emerald transition-all active:scale-[0.98]"
                  >
                     {me?.isHost ? 'Start Match!' : 'Waiting for Host to start...'}
                  </button>

                  {me?.isHost && roomState.players.length < 2 && (
                     <p className="text-amber-400/90 text-xs font-medium text-center mt-2 flex items-center gap-1">
                        <span>⏳</span> Need at least 2 players in the room to begin.
                     </p>
                  )}
               </div>
            </div>

            {/* Right Column: Chat */}
            <div className="w-full md:w-80 glass-card rounded-2xl flex flex-col overflow-hidden">
               <ChatSidebar />
            </div>

         </div>
         
         {/* Floating Reactions Layer */}
         <div className="absolute bottom-0 right-4 md:right-80 lg:right-96 pointer-events-none z-40 w-16 h-full overflow-visible">
            {activeReactions.map((r) => (
               <div
                  key={r.id}
                  className="absolute bottom-0 animate-float z-50 pointer-events-none"
                  style={{
                     left: `${Math.random() * 40 - 20}px`,
                     animationDelay: `${Math.random() * 0.2}s`
                  }}
               >
                  <div className="animate-squiggly text-4xl sm:text-5xl drop-shadow-lg">
                     {r.emoji}
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
