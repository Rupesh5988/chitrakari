import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Avatar } from '../components/Avatar';
import { Crown, Copy, Check, UserMinus, Play, Link } from 'lucide-react';

export function Lobby() {
  const { socket, roomState, me } = useSocket();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!roomState || !me) return null;

  const isHost = me.isHost;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?room=${roomState.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleKick = (playerId: string) => {
    if (socket) {
      if (isHost) {
        socket.emit('kick_player', { roomId: roomState.id, playerId });
      } else {
        socket.emit('vote_kick', { roomId: roomState.id, targetId: playerId });
      }
    }
  };

  const handleStartGame = () => {
    if (socket && isHost && roomState.players.length >= 2) {
      socket.emit('start_game', { roomId: roomState.id });
    }
  };

  const updateSetting = (key: string, value: any) => {
    if (socket && isHost) {
      socket.emit('update_settings', {
        roomId: roomState.id,
        settings: { ...roomState.settings, [key]: value }
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 font-sans text-slate-200 flex justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Room Info & Settings */}
        <div className="space-y-6">
          
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700/50 shadow-xl text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none"></div>
             
             <h2 className="text-slate-400 font-semibold uppercase tracking-widest text-sm mb-2">Room Code</h2>
             <div className="flex items-center justify-center gap-3 mb-4">
               <span className="text-5xl font-black text-white tracking-widest font-mono">
                 {roomState.id}
               </span>
             </div>
             
             <div className="flex gap-2">
               <button 
                 onClick={handleCopyCode}
                 className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-600/50 text-sm font-medium"
               >
                 {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                 {copied ? 'Copied!' : 'Copy Code'}
               </button>
               <button 
                 onClick={handleCopyLink}
                 className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors border border-primary-500/30 text-sm font-medium"
               >
                 {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link className="w-4 h-4" />}
                 {copiedLink ? 'Copied!' : 'Share Link'}
               </button>
             </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700/50 shadow-xl">
             <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <SettingsIcon /> Game Settings
             </h2>
             
             <div className="space-y-5">
               <div>
                 <div className="flex justify-between text-sm text-slate-400 mb-1">
                   <span>Rounds</span>
                   <span className="font-medium text-slate-200">{roomState.settings.rounds}</span>
                 </div>
                 <input 
                   type="range" min="1" max="10" 
                   value={roomState.settings.rounds} 
                   onChange={e => updateSetting('rounds', parseInt(e.target.value))}
                   disabled={!isHost}
                   className="w-full accent-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 />
               </div>
               
               <div>
                 <div className="flex justify-between text-sm text-slate-400 mb-1">
                   <span>Draw Time</span>
                   <span className="font-medium text-slate-200">{roomState.settings.drawTime}s</span>
                 </div>
                 <input 
                   type="range" min="30" max="180" step="10" 
                   value={roomState.settings.drawTime} 
                   onChange={e => updateSetting('drawTime', parseInt(e.target.value))}
                   disabled={!isHost}
                   className="w-full accent-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 />
               </div>
               
               <div>
                 <div className="flex justify-between text-sm text-slate-400 mb-1">
                   <span>Max Players</span>
                   <span className="font-medium text-slate-200">{roomState.settings.maxPlayers}</span>
                 </div>
                 <input 
                   type="range" min="2" max="12" 
                   value={roomState.settings.maxPlayers} 
                   onChange={e => updateSetting('maxPlayers', parseInt(e.target.value))}
                   disabled={!isHost}
                   className="w-full accent-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 />
               </div>
               
               <div>
                 <div className="flex justify-between text-sm text-slate-400 mb-1">
                   <span>Word Difficulty</span>
                 </div>
                 <select 
                   value={roomState.settings.wordDifficulty} 
                   onChange={e => updateSetting('wordDifficulty', e.target.value)}
                   disabled={!isHost}
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <option value="easy">Easy</option>
                   <option value="medium">Medium</option>
                   <option value="hard">Hard</option>
                   <option value="mixed">Mixed</option>
                 </select>
               </div>
             </div>
          </div>
        </div>

        {/* Right Column: Players & Start Button */}
        <div className="lg:col-span-2 flex flex-col h-full gap-6">
           
           <div className="flex-1 bg-slate-800 p-6 rounded-3xl border border-slate-700/50 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Players <span className="text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full text-sm">{roomState.players.length} / {roomState.settings.maxPlayers}</span>
                </h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-4 flex-1">
                {roomState.players.map(player => (
                  <div key={player.id} className={`bg-slate-900 rounded-2xl p-4 flex flex-col items-center gap-3 border ${player.id === me.id ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-slate-700/50'} relative group`}>
                     
                     <div className="relative">
                       <Avatar seed={player.avatarSeed} size={64} className="border-4 border-slate-800 shadow-md" />
                       {player.isHost && (
                         <div className="absolute -top-2 -right-2 bg-amber-500 p-1.5 rounded-full shadow-lg" title="Host">
                           <Crown className="w-3.5 h-3.5 text-amber-900" />
                         </div>
                       )}
                     </div>
                     
                     <div className="text-center w-full">
                       <p className="font-bold text-slate-200 truncate px-2">{player.name}</p>
                       <p className="text-xs text-slate-500">{player.id === me.id ? '(You)' : ''}</p>
                     </div>

                     {player.id !== me.id && !player.isHost && (
                       <button 
                         onClick={() => handleKick(player.id)}
                         className={`absolute top-2 right-2 flex items-center gap-1 p-1.5 rounded-lg transition-opacity ${roomState.kickVotes?.[player.id]?.includes(me.id) ? 'bg-red-500 text-white opacity-100' : 'bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white'}`}
                         title={isHost ? "Kick Player" : "Vote to Kick"}
                       >
                         {roomState.kickVotes?.[player.id] && roomState.kickVotes[player.id].length > 0 && (
                           <span className="text-xs font-bold pl-1">{roomState.kickVotes[player.id].length}</span>
                         )}
                         <UserMinus className="w-4 h-4" />
                       </button>
                     )}
                  </div>
                ))}
                
                {/* Empty slots placeholders */}
                {Array.from({ length: Math.max(0, roomState.settings.maxPlayers - roomState.players.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-slate-900/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 border border-slate-800 border-dashed opacity-50">
                     <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="text-slate-600 text-2xl font-bold">?</span>
                     </div>
                     <p className="font-medium text-slate-600">Waiting...</p>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700/50 shadow-xl flex items-center justify-between">
              <div>
                {!isHost && <p className="text-slate-400">Waiting for host to start the game...</p>}
                {isHost && roomState.players.length < 2 && <p className="text-amber-400/80 text-sm">Need at least 2 players to start.</p>}
              </div>
              <button
                onClick={handleStartGame}
                disabled={!isHost || roomState.players.length < 2}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Play className="w-5 h-5 fill-current" />
                START GAME
              </button>
           </div>

        </div>

      </div>
    </div>
  );
}

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
