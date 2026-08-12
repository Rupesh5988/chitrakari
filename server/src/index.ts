import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Player, RoomState, GamePhase, RoomSettings, DrawProgressPayload, StrokeCompletePayload, CanvasUndoPayload } from '@chitrakari/shared';
import { generateRoomCode } from './utils';
import { GameManager } from './GameManager';
import { logger } from './logger';

dotenv.config();

const app = express();
const server = http.createServer(app);

const CLIENT_URLS = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(u => u.trim()) : ['http://localhost:5173'];
const PORT = process.env.PORT || 3001;

const io = new Server(server, {
  cors: {
    origin: CLIENT_URLS,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: CLIENT_URLS }));
app.use(express.json());

const rooms = new Map<string, RoomState>();
const socketRoomMap = new Map<string, string>();
const roomTimeouts = new Map<string, NodeJS.Timeout>();
const playerTimeouts = new Map<string, NodeJS.Timeout>();
const connectionRates = new Map<string, number[]>();

const gameManager = new GameManager(io, rooms);

const CLEANUP_DELAY = 2 * 60 * 1000;
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 15;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', roomsCount: rooms.size });
});

io.on('connection', (socket) => {
  const ip = socket.handshake.address;
  const now = Date.now();
  let timestamps = connectionRates.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (timestamps.length >= RATE_LIMIT_MAX) {
     logger.warn(`Rate limit exceeded for IP: ${ip}`);
     socket.disconnect();
     return;
  }
  timestamps.push(now);
  connectionRates.set(ip, timestamps);

  logger.info(`Client connected`, { socketId: socket.id, ip });

  socket.on('create_room', (data: { name: string; avatarSeed: string; settings: RoomSettings }, callback) => {
    const roomId = generateRoomCode();
    const safeName = data.name ? data.name.substring(0, 15) : 'Player';
    
    const hostPlayer: Player = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      socketId: socket.id,
      name: safeName,
      avatarSeed: data.avatarSeed,
      score: 0,
      hasGuessedCorrectly: false,
      isHost: true,
      hintTokens: 2
    };

    const newRoom: RoomState = {
      id: roomId,
      hostId: hostPlayer.id,
      phase: 'lobby',
      players: [hostPlayer],
      settings: data.settings,
      roundNumber: 0,
      currentPlayerIndex: 0,
      strokeHistory: [],
      historyIndex: -1,
      timeRemaining: 0
    };

    rooms.set(roomId, newRoom);
    socket.join(roomId);
    socketRoomMap.set(socket.id, roomId);

    logger.info(`Room created`, { roomId, hostName: hostPlayer.name });
    if (callback) callback({ success: true, room: newRoom });
  });

  socket.on('join_room', (data: { roomId: string; name: string; avatarSeed: string; playerId?: string }, callback) => {
    if (!data || !data.roomId) {
      if (callback) callback({ success: false, message: 'Invalid room ID' });
      return;
    }
    const roomId = data.roomId.toUpperCase();
    const room = rooms.get(roomId);
    
    if (!room) {
      // Implicitly create room if it doesn't exist
      const safeName = data.name ? data.name.substring(0, 15) : 'Player';
      const hostPlayer: Player = {
        id: data.playerId || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
        socketId: socket.id,
        name: safeName,
        avatarSeed: data.avatarSeed,
        score: 0,
        hasGuessedCorrectly: false,
        isHost: true,
        hintTokens: 2
      };

      const newRoom: RoomState = {
        id: roomId,
        hostId: hostPlayer.id,
        phase: 'lobby',
        players: [hostPlayer],
        settings: {
          rounds: 3,
          drawTime: 80,
          maxPlayers: 8,
          wordDifficulty: 'medium',
          customWords: []
        },
        roundNumber: 0,
        currentPlayerIndex: 0,
        strokeHistory: [],
        historyIndex: -1,
        timeRemaining: 0
      };

      rooms.set(roomId, newRoom);
      socket.join(roomId);
      socketRoomMap.set(socket.id, roomId);
      console.log(`Room implicitly created: ${roomId} by ${hostPlayer.name}`);
      
      io.to(roomId).emit('room_updated', newRoom);
      if (callback) callback({ success: true, room: newRoom, player: hostPlayer });
      return;
    }

    const activePlayersCount = room.players.filter(p => !p.isSpectator).length;
    const isFull = activePlayersCount >= room.settings.maxPlayers;
    const isReturningPlayer = room.players.find(p => p.id === data.playerId);
    let forceSpectator = false;
    
    if (isFull && !isReturningPlayer) {
      // Room is full, let them join as a spectator instead of rejecting
      forceSpectator = true;
    }

    if (roomTimeouts.has(roomId)) {
      clearTimeout(roomTimeouts.get(roomId)!);
      roomTimeouts.delete(roomId);
    }

    const existingPlayerIndex = room.players.findIndex(p => p.id === data.playerId);
    
    let player: Player;
    if (existingPlayerIndex !== -1) {
      player = room.players[existingPlayerIndex];
      player.socketId = socket.id;
      player.connected = true;
      
      if (playerTimeouts.has(player.id)) {
        clearTimeout(playerTimeouts.get(player.id)!);
        playerTimeouts.delete(player.id);
      }
    } else {
      const safeName = data.name ? data.name.substring(0, 15) : 'Player';
      player = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        socketId: socket.id,
        name: safeName,
        avatarSeed: data.avatarSeed,
        score: 0,
        hasGuessedCorrectly: false,
        isHost: room.players.length === 0,
        connected: true,
        isSpectator: forceSpectator,
        hintTokens: 2
      };
      room.players.push(player);
    }

    if (player.isHost) {
      room.hostId = player.id;
    }

    socket.join(roomId);
    socketRoomMap.set(socket.id, roomId);

    socket.to(roomId).emit('room_updated', room);
    logger.info(`Player joined room`, { playerName: player.name, roomId });
    
    if (callback) callback({ success: true, room, player });
  });

  socket.on('leave_room', () => {
    handleLeave(socket);
  });

  socket.on('update_settings', (data: { roomId: string; settings: RoomSettings }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || !player.isHost) return;

    room.settings = data.settings;
    io.to(data.roomId).emit('room_updated', room);
  });

  socket.on('kick_player', (data: { roomId: string; playerId: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;

    const caller = room.players.find(p => p.socketId === socket.id);
    if (!caller || !caller.isHost) return;

    const targetIndex = room.players.findIndex(p => p.id === data.playerId);
    if (targetIndex === -1) return;
    
    const target = room.players[targetIndex];
    if (target.isHost) return;

    room.players.splice(targetIndex, 1);
    io.to(target.socketId).emit('kicked');
    const targetSocket = io.sockets.sockets.get(target.socketId);
    if (targetSocket) {
       targetSocket.leave(data.roomId);
       socketRoomMap.delete(target.socketId);
    }
    
    io.to(data.roomId).emit('room_updated', room);
  });

  socket.on('start_game', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;

    const caller = room.players.find(p => p.socketId === socket.id);
    if (!caller || !caller.isHost || room.players.length < 2) return;

    gameManager.startGame(data.roomId);
  });

  // GAME LOOP EVENTS
  socket.on('choose_word', (data: { roomId: string; word: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    gameManager.wordChosen(data.roomId, player.id, data.word);
  });

  socket.on('chat_message', (data: { roomId: string; text: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    const msg = gameManager.processChatMessage(data.roomId, player.id, data.text, socket.id);
    if (msg) {
      io.to(data.roomId).emit('chat_message_received', msg);
    }
  });

  socket.on('send_reaction', (data: { roomId: string; emoji: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    // Broadcast reaction to room
    io.to(data.roomId).emit('reaction_received', { roomId: data.roomId, playerId: player.id, emoji: data.emoji });
  });

  socket.on('spend_hint', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    gameManager.spendHint(data.roomId, player.id);
  });


  // --- DRAWING SYNC EVENTS ---
  socket.on('draw_progress', (data: DrawProgressPayload) => {
    const room = rooms.get(data.roomId);
    if (!room || room.phase !== 'drawing') return;
    socket.to(data.roomId).emit('draw_progress_received', data);
  });

  socket.on('stroke_complete', (data: StrokeCompletePayload) => {
    const room = rooms.get(data.roomId);
    if (!room || room.phase !== 'drawing') return;

    if (room.historyIndex < room.strokeHistory.length - 1) {
      room.strokeHistory = room.strokeHistory.slice(0, room.historyIndex + 1);
    }

    room.strokeHistory.push(data.stroke);
    room.historyIndex = room.strokeHistory.length - 1;

    socket.to(data.roomId).emit('stroke_completed', { 
      stroke: data.stroke, 
      serverStrokeCount: room.strokeHistory.length 
    });
  });

  socket.on('canvas_undo', (data: CanvasUndoPayload) => {
    const room = rooms.get(data.roomId);
    if (!room || room.phase !== 'drawing') return;

    room.historyIndex = data.historyIndex;
    if (room.historyIndex < room.strokeHistory.length - 1) {
      room.strokeHistory = room.strokeHistory.slice(0, room.historyIndex + 1);
    }

    socket.to(data.roomId).emit('undo_received', { historyIndex: room.historyIndex });
  });

  socket.on('canvas_clear', (data: { roomId: string; bgColor: string }) => {
    const room = rooms.get(data.roomId);
    if (!room || room.phase !== 'drawing') return;

    const fillStroke = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      tool: 'fill' as any,
      color: data.bgColor,
      size: 1,
      points: [{x: 0, y: 0}],
      timestamp: Date.now()
    };

    if (room.historyIndex < room.strokeHistory.length - 1) {
      room.strokeHistory = room.strokeHistory.slice(0, room.historyIndex + 1);
    }

    room.strokeHistory.push(fillStroke);
    room.historyIndex = room.strokeHistory.length - 1;

    socket.to(data.roomId).emit('stroke_completed', { 
      stroke: fillStroke, 
      serverStrokeCount: room.strokeHistory.length 
    });
  });

  socket.on('request_sync', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;
    
    socket.emit('canvas_state_sync', {
      strokeHistory: room.strokeHistory,
      historyIndex: room.historyIndex
    });
  });

  socket.on('disconnect', () => {
    handleLeave(socket);
    logger.info(`Client disconnected`, { socketId: socket.id });
  });
});

function handleLeave(socket: any) {
  const roomId = socketRoomMap.get(socket.id);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
  if (playerIndex !== -1) {
    const player = room.players[playerIndex];
    player.connected = false;
    
    // Check if we have enough active players left
    const activeConnectedPlayers = room.players.filter(p => !p.isSpectator && p.connected);
    if (activeConnectedPlayers.length <= 1 && room.phase !== 'lobby' && room.phase !== 'game_end') {
       room.phase = 'game_end';
    } else if (room.currentDrawerId === player.id && (room.phase === 'drawing' || room.phase === 'choosing_word')) {
       // Drawer abandoned turn, end turn immediately!
       gameManager.startTurn(roomId);
    }
    
    // Broadcast disconnect immediately
    io.to(roomId).emit('room_updated', room);
    
    const timeout = setTimeout(() => {
      // Clean up player after 60 seconds
      const pIdx = room.players.findIndex(p => p.id === player.id);
      if (pIdx !== -1) {
        room.players.splice(pIdx, 1);
        
        if (room.players.length === 0) {
          const roomTimeout = setTimeout(() => {
            rooms.delete(roomId);
            roomTimeouts.delete(roomId);
            logger.info(`Cleaned up empty room`, { roomId });
          }, CLEANUP_DELAY);
          roomTimeouts.set(roomId, roomTimeout);
        } else {
          if (player.isHost) {
            room.players[0].isHost = true;
            room.hostId = room.players[0].id;
          }
          io.to(roomId).emit('room_updated', room);
        }
      }
      playerTimeouts.delete(player.id);
    }, 60000); // 60s reconnect window
    
    playerTimeouts.set(player.id, timeout);
  }

  socket.leave(roomId);
  socketRoomMap.delete(socket.id);
}

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
