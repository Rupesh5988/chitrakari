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
      <div className="absolute z-50 mt-2 w-48 rounded-2xl bg-white/90 dark:bg-paper-800/90 backdrop-blur-md shadow-xl border border-slate-200 dark:border-slate-700/50 py-2 overflow-hidden right-0 origin-top-right">
         {/* Host actions */}
         {isHost && (
            <>
               <div className="px-3 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 mb-1">
                  <Shield className="w-3 h-3 text-emerald-500" /> Host Actions
               </div>
               <button
                  onClick={handleKick}
                  className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-colors flex items-center gap-2 font-medium"
               >
                  <UserX className="w-4 h-4" /> Kick Player
               </button>
               <button
                  onClick={handleBan}
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 transition-colors flex items-center gap-2 font-medium"
               >
                  <Ban className="w-4 h-4" /> Ban Player
               </button>
            </>
         )}

         {/* General actions */}
         <div className="px-3 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 mb-1 mt-1">
            Player Actions
         </div>
         
         {!target.isHost ? (
            <button
               onClick={handleVoteKick}
               className="w-full text-left px-4 py-2 text-sm text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 transition-colors flex items-center gap-2 font-medium"
            >
               <AlertTriangle className="w-4 h-4" /> Vote Kick
            </button>
         ) : (
            <div className="px-4 py-2 text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2 font-medium opacity-50 cursor-not-allowed" title="Host cannot be vote-kicked">
               <ShieldOff className="w-4 h-4" /> Vote Kick
            </div>
         )}
         
         <button
            onClick={handleMute}
            className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-paper-700 transition-colors flex items-center gap-2 font-medium"
         >
            <VolumeX className="w-4 h-4" /> Mute Locally
         </button>
      </div>
   );
}
