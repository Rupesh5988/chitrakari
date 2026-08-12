import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { GameView } from './GameView';
import { Users, Settings, Play, Copy, CheckCircle2 } from 'lucide-react';
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

  // If game has started, render GameView
  if (roomState.phase !== 'lobby' && roomState.phase !== 'game_end') {
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
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[10%] left-[10%] w-[40rem] h-[40rem] bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[40rem] h-[40rem] bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 z-10 relative">
        
        {/* Left Column: Room Info & Settings */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-paper-800 rounded-3xl p-6 shadow-soft dark:shadow-soft-dark border border-slate-200 dark:border-slate-700/50">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Settings className="w-4 h-4" />
               Room Details
            </h2>
            
            <div className="mb-6">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Room Code</label>
               <button 
                 onClick={copyRoomCode}
                 className="w-full flex items-center justify-between bg-slate-50 dark:bg-paper-900 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-paper-700 transition-colors group"
               >
                 <span className="text-2xl font-mono font-bold tracking-widest text-slate-800 dark:text-white">{roomState.id}</span>
                 {copied ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Copy className="w-6 h-6 text-slate-400 group-hover:text-primary-500 transition-colors" />}
               </button>
            </div>

            <div className="space-y-4">
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Rounds</label>
                 {isEditingSettings ? (
                    <input 
                      type="number" 
                      min="1" max="10"
                      value={editRounds}
                      onChange={e => setEditRounds(parseInt(e.target.value) || 3)}
                      className="w-full bg-slate-50 dark:bg-paper-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                    />
                 ) : (
                    <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{roomState.settings.rounds}</div>
                 )}
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Draw Time</label>
                 {isEditingSettings ? (
                    <select
                      value={editDrawTime}
                      onChange={e => setEditDrawTime(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-paper-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                    >
                      <option value="40">40 seconds</option>
                      <option value="60">60 seconds</option>
                      <option value="80">80 seconds</option>
                      <option value="120">120 seconds</option>
                    </select>
                 ) : (
                    <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{roomState.settings.drawTime} seconds</div>
                 )}
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Word Difficulty</label>
                 {isEditingSettings ? (
                    <select
                      value={editWordDifficulty}
                      onChange={e => setEditWordDifficulty(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-paper-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="mixed">Mixed</option>
                    </select>
                 ) : (
                    <div className="text-lg font-bold text-slate-700 dark:text-slate-200 capitalize">{roomState.settings.wordDifficulty}</div>
                 )}
              </div>
            </div>
            
            {me?.isHost && (
               <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                  {!isEditingSettings ? (
                    <button 
                      onClick={() => {
                        setCustomWordsStr(roomState.settings.customWords?.join(', ') || '');
                        setEditRounds(roomState.settings.rounds);
                        setEditDrawTime(roomState.settings.drawTime);
                        setEditWordDifficulty(roomState.settings.wordDifficulty);
                        setIsEditingSettings(true);
                      }}
                      className="text-sm font-bold text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-2"
                    >
                       <Settings className="w-4 h-4" /> Edit Settings
                    </button>
                  ) : (
                    <div className="space-y-4">
                       <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Custom Words (comma-separated)</label>
                         <textarea
                            value={customWordsStr}
                            onChange={(e) => setCustomWordsStr(e.target.value)}
                            placeholder="e.g. inside joke, my dog, local cafe"
                            className="w-full bg-slate-50 dark:bg-paper-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500 min-h-[80px]"
                         />
                       </div>
                       <div className="flex gap-2">
                         <button 
                           onClick={handleSaveSettings}
                           className="flex-1 bg-primary-500 text-white font-bold py-2 rounded-xl text-sm hover:bg-primary-600 transition-colors"
                         >
                           Save
                         </button>
                         <button 
                           onClick={() => setIsEditingSettings(false)}
                           className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2 rounded-xl text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                         >
                           Cancel
                         </button>
                       </div>
                    </div>
                  )}
               </div>
            )}
          </div>
        </div>

        {/* Right Column: Players & Actions */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-paper-800 rounded-3xl p-6 shadow-soft dark:shadow-soft-dark border border-slate-200 dark:border-slate-700/50 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Users className="w-4 h-4" />
                 Players ({roomState.players.filter(p => !p.isSpectator).length}/{roomState.settings.maxPlayers})
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {roomState.players.filter(p => !p.isSpectator).map(p => (
                <div key={p.id} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${p.connected === false ? 'opacity-50 grayscale' : ''} ${p.id === me?.id ? 'bg-primary-50/50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/30' : 'bg-slate-50 dark:bg-paper-900 border-slate-200 dark:border-slate-700/50'}`}>
                  <Avatar seed={p.avatarSeed} size={64} />
                  <div className="mt-3 font-bold text-slate-700 dark:text-slate-200 text-center w-full truncate px-2">{p.name}</div>
                  {p.isHost && (
                     <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Host</div>
                  )}
                  {p.connected === false && (
                     <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">Offline</div>
                  )}
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, roomState.settings.maxPlayers - roomState.players.filter(p => !p.isSpectator).length) }).map((_, i) => (
                 <div key={`empty-${i}`} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-paper-900/50 opacity-50">
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-paper-800 mb-3" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-paper-800 rounded-full" />
                 </div>
              ))}
            </div>

            {roomState.players.some(p => p.isSpectator) && (
               <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                 <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                    Spectators
                 </h2>
                 <div className="flex flex-wrap gap-3">
                   {roomState.players.filter(p => p.isSpectator).map(p => (
                      <div key={p.id} className={`flex items-center gap-2 bg-slate-50 dark:bg-paper-900 border border-slate-200 dark:border-slate-700/50 px-3 py-2 rounded-xl ${p.connected === false ? 'opacity-50 grayscale' : ''}`}>
                        <Avatar seed={p.avatarSeed} size={24} />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.name}</span>
                      </div>
                   ))}
                 </div>
               </div>
            )}
          </div>
          
          {/* Host Action Bar */}
          {me?.isHost ? (
             <div className="bg-white dark:bg-paper-800 rounded-3xl p-6 shadow-soft dark:shadow-soft-dark border border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
                   Waiting for everyone to join?
                   {roomState.players.length < 2 && <span className="block text-rose-500 text-sm mt-1">Need at least 2 players to start.</span>}
                </p>
                <button
                  onClick={handleStart}
                  disabled={roomState.players.length < 2}
                  className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold py-4 px-10 rounded-2xl shadow-md hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 text-xl disabled:transform-none disabled:shadow-none"
                >
                  <Play className="w-6 h-6 fill-current" />
                  Start Game
                </button>
             </div>
          ) : (
             <div className="bg-white dark:bg-paper-800 rounded-3xl p-6 shadow-soft dark:shadow-soft-dark border border-slate-200 dark:border-slate-700/50 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
                   <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                   Waiting for host to start...
                </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
