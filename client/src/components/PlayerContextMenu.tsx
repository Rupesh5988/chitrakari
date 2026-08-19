import React from 'react';
import { Shield, UserX, Ban, VolumeX, AlertTriangle, ShieldOff } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { Player } from '@chitrakari/shared';
import { toast } from 'sonner';

interface PlayerContextMenuProps {
   target: Player;
   onClose: () => void;
}

export function PlayerContextMenu({ target, onClose }: PlayerContextMenuProps) {
   const { me, roomState, socket } = useSocket();

   if (!me || !roomState) return null;

   const isHost = me.isHost;
   const isSelf = me.id === target.id;

   const handleKick = () => {
      if (socket && isHost && !isSelf) {
         socket.emit('kick_player', { roomId: roomState.id, playerId: target.id });
         toast.success(`Kicked ${target.name}`);
      }
      onClose();
   };

   const handleBan = () => {
      if (socket && isHost && !isSelf) {
         socket.emit('ban_player', { roomId: roomState.id, playerId: target.id });
         toast.success(`Banned ${target.name}`);
      }
      onClose();
   };

   const handleVoteKick = () => {
      if (socket && !target.isHost && !isSelf) {
         socket.emit('vote_kick', { roomId: roomState.id, targetId: target.id });
         toast.success(`Voted to kick ${target.name}`);
      }
      onClose();
   };

   const handleMute = () => {
      const mutedSt = localStorage.getItem('chitrakari_muted_players') || '[]';
      const muted: string[] = JSON.parse(mutedSt);
      if (!muted.includes(target.id)) {
         muted.push(target.id);
         localStorage.setItem('chitrakari_muted_players', JSON.stringify(muted));
         toast.success(`Muted ${target.name} locally`);
         window.dispatchEvent(new Event('muted_players_changed'));
      }
      onClose();
   };

   if (isSelf) return null;

   return (
      <div className="absolute z-50 mt-1 w-44 rounded-2xl glass-card border border-white/15 shadow-2xl p-1.5 right-0 origin-top-right select-none">
         {/* Host actions */}
         {isHost && (
            <>
               <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/[0.06] mb-1">
                  <Shield className="w-3 h-3 text-emerald-400" /> Host Actions
               </div>
               <button
                  onClick={handleKick}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors flex items-center gap-2 font-medium"
               >
                  <UserX className="w-3.5 h-3.5" /> Kick Player
               </button>
               <button
                  onClick={handleBan}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20 rounded-xl transition-colors flex items-center gap-2 font-medium"
               >
                  <Ban className="w-3.5 h-3.5" /> Ban Player
               </button>
            </>
         )}

         {/* General actions */}
         <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/[0.06] mb-1 mt-1">
            Player Actions
         </div>
         
         {!target.isHost ? (
            <button
               onClick={handleVoteKick}
               className="w-full text-left px-2.5 py-1.5 text-xs text-amber-400 hover:bg-amber-500/15 rounded-xl transition-colors flex items-center gap-2 font-medium"
            >
               <AlertTriangle className="w-3.5 h-3.5" /> Vote Kick
            </button>
         ) : (
            <div className="px-2.5 py-1.5 text-xs text-slate-500 flex items-center gap-2 font-medium opacity-50 cursor-not-allowed" title="Host cannot be vote-kicked">
               <ShieldOff className="w-3.5 h-3.5" /> Vote Kick
            </div>
         )}
         
         <button
            onClick={handleMute}
            className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.08] rounded-xl transition-colors flex items-center gap-2 font-medium"
         >
            <VolumeX className="w-3.5 h-3.5" /> Mute Locally
         </button>
      </div>
   );
}
