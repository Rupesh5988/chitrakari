import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { GameView } from './GameView';
import { Users, Settings, Play, Copy, CheckCircle2 } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { ChatSidebar } from '../components/ChatSidebar';
import { Avatar } from '../components/Avatar';
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
   const [editMaxPlayers, setEditMaxPlayers] = useState(8);

   useEffect(() => {
      if (!socket || !code || hasJoined) return;

      // Auto-join room on mount
      const seed = localStorage.getItem('chitrakari_avatar') || Math.random().toString(36).substring(7);
      localStorage.setItem('chitrakari_avatar', seed);

      socket.emit('join_room', {
         roomId: code,
         name: localStorage.getItem('chitrakari_name') || `Player_${Math.floor(Math.random() * 1000)}`,
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
         wordDifficulty: editWordDifficulty
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
      <div className="h-[100dvh] overflow-hidden bg-paper-100 dark:bg-paper-950 p-2 lg:p-4 pb-[max(env(safe-area-inset-bottom),0.5rem)] lg:pb-[max(env(safe-area-inset-bottom),1rem)] flex flex-col gap-3 lg:gap-4 relative">
         {/* Rangoli / Block print subtle background */}
         <div 
           className="absolute inset-0 opacity-[0.04] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0C40 22.0914 22.0914 40 0 40C22.0914 40 40 57.9086 40 80C40 57.9086 57.9086 40 80 40C57.9086 40 40 22.0914 40 0Z' fill='%231e293b' fill-rule='evenodd'/%3E%3Cpath d='M40 20C40 31.0457 31.0457 40 20 40C31.0457 40 40 48.9543 40 60C40 48.9543 48.9543 40 60 40C48.9543 40 40 31.0457 40 20Z' fill='%231e293b' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")` }} 
         />

         <div className="z-10 w-full"><TopBar /></div>

         <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 flex-1 h-0 min-h-0 relative max-w-[1600px] mx-auto w-full z-10">

            {/* Left Column: Players List */}
            <div className="w-full lg:w-72 bg-white dark:bg-paper-800 rounded-3xl p-4 shadow-soft dark:shadow-soft-dark border border-slate-200 dark:border-slate-700/50 flex flex-col overflow-y-auto overflow-x-hidden">
               <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4 px-2">
                  <Users className="w-4 h-4" />
                  Players ({roomState.players.filter(p => !p.isSpectator).length}/{roomState.settings.maxPlayers})
               </h2>
               <div className="flex flex-col gap-2">
                  {roomState.players.filter(p => !p.isSpectator).map((p, index) => (
                     <div key={p.id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${p.id === me?.id ? 'bg-primary-50 dark:bg-primary-500/10' : 'bg-slate-50 dark:bg-paper-900'} ${p.connected === false ? 'opacity-50 grayscale' : ''}`}>
                        <div className="text-xs font-bold text-slate-400 w-4 text-center">#{index + 1}</div>
                        <Avatar seed={p.avatarSeed} size={40} />
                        <div className="flex-1 min-w-0">
                           <div className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate flex items-center gap-1">
                              {p.name}
                           </div>
                           <div className="text-xs text-slate-500">{p.score} points</div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                           {p.isHost && <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md leading-none">Host</div>}
                           {p.id === me?.id && <div className="text-[10px] font-bold uppercase tracking-widest text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-1.5 py-0.5 rounded-md leading-none">You</div>}
                           {p.connected === false && <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md leading-none">Offline</div>}
                        </div>
                     </div>
                  ))}

                  {/* Empty slots */}
                  {Array.from({ length: Math.max(0, roomState.settings.maxPlayers - roomState.players.filter(p => !p.isSpectator).length) }).map((_, i) => (
                     <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-paper-900/50 opacity-50">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-paper-800" />
                        <div className="flex-1">
                           <div className="h-3 w-16 bg-slate-200 dark:bg-paper-800 rounded-full mb-1.5" />
                           <div className="h-2 w-10 bg-slate-200 dark:bg-paper-800 rounded-full" />
                        </div>
                     </div>
                  ))}
               </div>

               {roomState.players.some(p => p.isSpectator) && (
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                     <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2">Spectators</h2>
                     <div className="flex flex-wrap gap-2 px-2">
                        {roomState.players.filter(p => p.isSpectator).map(p => (
                           <div key={p.id} className={`flex items-center gap-2 bg-slate-50 dark:bg-paper-900 px-2 py-1.5 rounded-lg ${p.connected === false ? 'opacity-50 grayscale' : ''}`}>
                              <Avatar seed={p.avatarSeed} size={20} />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.name}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            {/* Center Column: Settings & Actions */}
            <div className="flex-1 bg-white dark:bg-paper-800 rounded-3xl p-4 sm:p-6 shadow-soft dark:shadow-soft-dark border border-slate-200 dark:border-slate-700/50 flex flex-col overflow-y-auto">
               
               {/* Prominent Room Code Card */}
               <div className="bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent border-2 border-primary-500/20 dark:border-primary-500/30 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                  <div className="text-center sm:text-left">
                     <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Room Invite Code</span>
                     <div className="text-3xl font-mono font-black tracking-[0.2em] text-primary-600 dark:text-primary-400 mt-0.5">
                        {roomState.id}
                     </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                     <button
                        onClick={copyRoomCode}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-paper-800 hover:bg-slate-50 dark:hover:bg-paper-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95"
                     >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                     </button>
                     <button
                        onClick={() => {
                           const link = `${window.location.origin}/room/${roomState.id}`;
                           navigator.clipboard.writeText(link);
                           toast.success("Invite link copied to clipboard!");
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95"
                     >
                        <span>Copy Link</span>
                     </button>
                  </div>
               </div>

               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Settings className="w-4 h-4" /> Settings
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
                              setIsEditingSettings(true);
                           }
                        }}
                        className="text-sm font-bold text-primary-500 hover:text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 px-4 py-2 rounded-xl transition-colors"
                     >
                        {isEditingSettings ? 'Save Settings' : 'Edit'}
                     </button>
                  )}
               </div>

               <div className="bg-slate-50 dark:bg-paper-900 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-700/50 space-y-3">
                  
                  {/* Players / Max Players Setting */}
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-paper-800 flex items-center justify-center text-slate-500 dark:text-slate-400">👥</div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Players</span>
                     </div>
                     {isEditingSettings ? (
                        <select 
                           value={editMaxPlayers} 
                           onChange={e => setEditMaxPlayers(parseInt(e.target.value))} 
                           className="bg-white dark:bg-paper-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold w-40"
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
                        <span className="text-sm font-bold bg-white dark:bg-paper-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[100px] text-center">{roomState.settings.maxPlayers || 8}</span>
                     )}
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-paper-800 flex items-center justify-center text-slate-500 dark:text-slate-400">⏱️</div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Draw Time</span>
                     </div>
                     {isEditingSettings ? (
                        <select value={editDrawTime} onChange={e => setEditDrawTime(parseInt(e.target.value))} className="bg-white dark:bg-paper-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold w-40">
                           <option value="40">40 seconds</option>
                           <option value="60">60 seconds</option>
                           <option value="80">80 seconds</option>
                           <option value="120">120 seconds</option>
                        </select>
                     ) : (
                        <span className="text-sm font-bold bg-white dark:bg-paper-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[100px] text-center">{roomState.settings.drawTime}</span>
                     )}
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-paper-800 flex items-center justify-center text-slate-500 dark:text-slate-400">🔄</div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Rounds</span>
                     </div>
                     {isEditingSettings ? (
                        <input type="number" min="1" max="10" value={editRounds} onChange={e => setEditRounds(parseInt(e.target.value) || 3)} className="bg-white dark:bg-paper-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold w-40" />
                     ) : (
                        <span className="text-sm font-bold bg-white dark:bg-paper-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[100px] text-center">{roomState.settings.rounds}</span>
                     )}
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-paper-800 flex items-center justify-center text-slate-500 dark:text-slate-400">📝</div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Difficulty</span>
                     </div>
                     {isEditingSettings ? (
                        <select value={editWordDifficulty} onChange={e => setEditWordDifficulty(e.target.value as any)} className="bg-white dark:bg-paper-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold w-40 capitalize">
                           <option value="easy">Easy</option>
                           <option value="medium">Medium</option>
                           <option value="hard">Hard</option>
                           <option value="mixed">Mixed</option>
                        </select>
                     ) : (
                        <span className="text-sm font-bold bg-white dark:bg-paper-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[100px] text-center capitalize">{roomState.settings.wordDifficulty}</span>
                     )}
                  </div>
               </div>

               <div className="flex-1 flex flex-col bg-slate-50 dark:bg-paper-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-paper-800 flex items-center justify-center text-slate-500 dark:text-slate-400">✏️</div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Custom words</span>
                     </div>
                  </div>
                  <textarea
                     readOnly={!isEditingSettings}
                     value={isEditingSettings ? customWordsStr : (roomState.settings.customWords?.join(', ') || '')}
                     onChange={(e) => setCustomWordsStr(e.target.value)}
                     placeholder="Minimum of 10 words. Separated by a , (comma)"
                     className="flex-1 bg-white dark:bg-paper-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500 resize-none min-h-[120px]"
                  />
               </div>

               <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                     onClick={handleStart}
                     disabled={!me?.isHost || roomState.players.length < 2}
                     className="flex-[2] bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-black text-xl py-4 rounded-2xl shadow-sm transition-all disabled:transform-none disabled:shadow-none"
                  >
                     {me?.isHost ? 'Start!' : 'Waiting for Host...'}
                  </button>
                  <button
                     onClick={copyRoomCode}
                     className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                     <Copy className="w-5 h-5" />
                     {copied ? 'Copied!' : 'Invite'}
                  </button>
               </div>

               {me?.isHost && roomState.players.length < 2 && (
                  <p className="text-rose-500 text-xs font-bold text-center mt-3">Need at least 2 players to start.</p>
               )}
            </div>

            {/* Right Column: Chat */}
            <div className="w-full md:w-80 bg-paper-100/95 dark:bg-paper-950/95 rounded-3xl flex flex-col overflow-hidden">
               <ChatSidebar />
            </div>

         </div>
      </div>
   );
}
