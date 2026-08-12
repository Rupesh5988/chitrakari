import { Server } from 'socket.io';
import { RoomState, Player, ChatMessage, TurnSummary } from '@chitrakari/shared';
import wordsData from './words.json';
import { logger } from './logger';

const WORDS: Record<string, string[]> = wordsData;

// Helper to calculate Levenshtein distance for typos
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // insertion
        matrix[j - 1][i] + 1, // deletion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

export class GameManager {
  private io: Server;
  private rooms: Map<string, RoomState>;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  // Keep track of who has guessed correctly this turn
  private correctGuessers: Map<string, Set<string>> = new Map();
  // Keep track of points earned in the current turn
  private turnPoints: Map<string, Record<string, number>> = new Map();
  // Rate limiting map: playerId -> lastMessageTimestamp
  private rateLimits: Map<string, number> = new Map();

  constructor(io: Server, rooms: Map<string, RoomState>) {
    this.io = io;
    this.rooms = rooms;
  }

  private emitRoomUpdate(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      this.io.to(roomId).emit('room_updated', room);
    }
  }

  public getActiveConnectedPlayers(room: RoomState): Player[] {
    return room.players.filter(p => !p.isSpectator && p.connected);
  }

  public startGame(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.roundNumber = 1;
    room.currentPlayerIndex = 0;
    
    // Reset all scores and hint tokens
    room.players.forEach(p => {
      p.score = 0;
      p.hintTokens = 0;
    });
    
    this.startTurn(roomId);
  }

  public startTurn(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length === 0) return;

    // Skip spectators
    let attempts = 0;
    while (room.players[room.currentPlayerIndex]?.isSpectator && attempts < room.players.length) {
       room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
       attempts++;
    }
    
    const activeConnected = this.getActiveConnectedPlayers(room);
    
    if (attempts >= room.players.length || activeConnected.length <= 1) {
       // Everyone is a spectator or only 1 player left, end game
       room.phase = 'game_end';
       this.emitRoomUpdate(roomId);
       return;
    }

    room.phase = 'choosing_word';
    room.currentDrawerId = room.players[room.currentPlayerIndex].id;
    room.strokeHistory = [];
    room.historyIndex = -1;
    room.timeRemaining = 15; // 15 seconds to choose
    room.currentWord = undefined;
    room.hiddenWord = undefined;
    
    this.correctGuessers.set(roomId, new Set());
    this.turnPoints.set(roomId, {});
    
    room.players.forEach(p => {
       p.hasGuessedCorrectly = false;
       if (p.id === room.currentDrawerId) {
          // Give Drawer a free hint token at start of turn
          p.hintTokens = 1;
       }
    });

    let wordPool = [...WORDS.medium];
    if (room.settings.wordDifficulty === 'easy') wordPool = [...WORDS.easy];
    if (room.settings.wordDifficulty === 'hard') wordPool = [...WORDS.hard];
    if (room.settings.wordDifficulty === 'mixed') {
       wordPool = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard];
    }
    
    const choices: string[] = [];
    
    // Pick from custom words first if available
    let customPool = [...(room.settings.customWords || [])];
    if (customPool.length > 0) {
      // Pick 1 or 2 custom words
      const numCustom = Math.min(Math.floor(Math.random() * 2) + 1, customPool.length);
      for (let i = 0; i < numCustom; i++) {
        const idx = Math.floor(Math.random() * customPool.length);
        choices.push(customPool[idx]);
        customPool.splice(idx, 1);
      }
    }
    
    // Fill the rest with dictionary words
    while (choices.length < 3 && wordPool.length > 0) {
      const idx = Math.floor(Math.random() * wordPool.length);
      choices.push(wordPool[idx]);
      wordPool.splice(idx, 1);
    }
    
    room.wordChoices = choices;
    this.emitRoomUpdate(roomId);
    
    this.startTimer(roomId, () => {
      if (room.phase === 'choosing_word' && room.wordChoices) {
         this.wordChosen(roomId, room.currentDrawerId!, room.wordChoices[Math.floor(Math.random() * 3)]);
      }
    });
  }

  public wordChosen(roomId: string, playerId: string, word: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'choosing_word' || room.currentDrawerId !== playerId) return;

    this.clearTimer(roomId);

    room.phase = 'drawing';
    room.currentWord = word;
    room.hiddenWord = word.replace(/[a-zA-Z]/g, '_');
    room.wordChoices = undefined;
    room.timeRemaining = room.settings.drawTime;

    this.emitRoomUpdate(roomId);
    this.startTimer(roomId, () => {
       this.endTurn(roomId);
    });
  }

  public processChatMessage(roomId: string, playerId: string, text: string, socketId: string): ChatMessage | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    // Rate Limiting (500ms)
    const now = Date.now();
    const lastMsgTime = this.rateLimits.get(playerId) || 0;
    if (now - lastMsgTime < 500) {
       return null; // Silently drop
    }
    this.rateLimits.set(playerId, now);

    const safeText = text.substring(0, 200);
    const isDrawer = room.currentDrawerId === playerId;
    
    let outMsg: ChatMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      playerId,
      text: safeText,
      type: 'normal',
      timestamp: now
    };

    if (room.phase === 'drawing' && !isDrawer && !player.isSpectator && room.currentWord) {
      const guess = safeText.trim().toLowerCase();
      const target = room.currentWord.toLowerCase();
      
      const correctSet = this.correctGuessers.get(roomId) || new Set();

      if (!correctSet.has(playerId)) {
        if (guess === target) {
          // Exact Match
          correctSet.add(playerId);
          player.hasGuessedCorrectly = true;
          
          const timeRatio = room.timeRemaining / room.settings.drawTime;
          const points = Math.floor(timeRatio * 400) + 100;
          player.score += points;

          if (!this.turnPoints.has(roomId)) this.turnPoints.set(roomId, {});
          this.turnPoints.get(roomId)![playerId] = points;

          outMsg.type = 'correct_guess';
          outMsg.text = 'guessed the word!';

          // Check if all non-drawers have guessed correctly
          if (correctSet.size >= room.players.length - 1) {
             this.clearTimer(roomId);
             setTimeout(() => this.endTurn(roomId), 1000);
          }
          
          return outMsg; // Broadcast publicly
          
        } else {
          // Check Levenshtein typo distance
          if (target.length > 3) {
            const dist = levenshtein(guess, target);
            if (dist <= 2) {
              this.io.to(socketId).emit('guess_proximity_update', { status: 'hot' });
              
              const closeMsg: ChatMessage = {
                 id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                 playerId,
                 text: `'${safeText}' is very close!`,
                 type: 'close_guess',
                 timestamp: now
              };
              this.io.to(socketId).emit('chat_message_received', closeMsg);
              return null;
            } else if (dist <= 4) {
              this.io.to(socketId).emit('guess_proximity_update', { status: 'warm' });
            } else {
              this.io.to(socketId).emit('guess_proximity_update', { status: 'cold' });
            }
          }
          
          // Check for leak censoring
          if (guess.includes(target)) {
             // Sender hasn't guessed it, but included the word in their text. Censor it.
             const leakMsg: ChatMessage = {
                 id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                 playerId,
                 text: 'Your message was blocked for containing the word.',
                 type: 'leak_blocked',
                 timestamp: now
             };
             this.io.to(socketId).emit('chat_message_received', leakMsg);
             return null;
          }
        }
      } else {
         // Player already guessed correctly. Block them from leaking it in future messages just in case
         if (guess.includes(target)) {
            const leakMsg: ChatMessage = {
                 id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                 playerId,
                 text: 'Don\'t spoil the word for others!',
                 type: 'leak_blocked',
                 timestamp: now
             };
             this.io.to(socketId).emit('chat_message_received', leakMsg);
             return null;
         }
      }
    }

    return outMsg;
  }

  public spendHint(roomId: string, playerId: string) {
     const room = this.rooms.get(roomId);
     if (!room || room.phase !== 'drawing' || room.currentDrawerId !== playerId) return;
     
     const player = room.players.find(p => p.id === playerId);
     if (player && player.hintTokens > 0) {
        player.hintTokens--;
        this.revealHint(room);
        this.emitRoomUpdate(roomId);
     }
  }

  private endTurn(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    this.clearTimer(roomId);

    room.phase = 'turn_end';
    room.timeRemaining = 5;

    const correctSet = this.correctGuessers.get(roomId) || new Set();
    const drawer = room.players.find(p => p.id === room.currentDrawerId);
    let drawerPts = 0;
    if (drawer && correctSet.size > 0) {
      const maxPossibleGuessers = Math.max(1, room.players.length - 1);
      drawerPts = Math.floor((correctSet.size / maxPossibleGuessers) * 250);
      drawer.score += drawerPts;
      // Bonus hint token if a lot of people guessed
      if (correctSet.size >= maxPossibleGuessers) {
         drawer.hintTokens++;
      }
    }

    const guesserPoints: Record<string, number> = this.turnPoints.get(roomId) || {}; 

    room.turnSummary = {
      word: room.currentWord || '',
      drawerId: room.currentDrawerId || '',
      drawerPoints: drawerPts,
      guesserPoints
    };

    this.emitRoomUpdate(roomId);

    this.startTimer(roomId, () => {
      room.turnSummary = undefined;
      room.currentPlayerIndex++;

      if (room.currentPlayerIndex >= room.players.length) {
        room.currentPlayerIndex = 0;
        room.roundNumber++;
      }

      if (room.roundNumber > room.settings.rounds) {
        room.phase = 'game_end';
        this.emitRoomUpdate(roomId);
      } else {
        this.startTurn(roomId);
      }
    });
  }

  private startTimer(roomId: string, onExpire: () => void) {
    this.clearTimer(roomId);
    const room = this.rooms.get(roomId);
    if (!room) return;

    const timerId = setInterval(() => {
      const r = this.rooms.get(roomId);
      if (!r) {
        this.clearTimer(roomId);
        return;
      }
      
      r.timeRemaining--;
      this.io.to(roomId).emit('timer_tick', r.timeRemaining);

      if (r.phase === 'drawing' && r.currentWord && r.hiddenWord) {
         const halfTime = Math.floor(r.settings.drawTime / 2);
         const quarterTime = Math.floor(r.settings.drawTime / 4);
         
         if (r.timeRemaining === halfTime || r.timeRemaining === quarterTime) {
           this.revealHint(r);
         }
      }

      if (r.timeRemaining <= 0) {
        this.clearTimer(roomId);
        onExpire();
      }
    }, 1000);

    this.timers.set(roomId, timerId);
  }

  private clearTimer(roomId: string) {
    const timerId = this.timers.get(roomId);
    if (timerId) {
      clearInterval(timerId);
      this.timers.delete(roomId);
    }
  }

  private revealHint(room: RoomState) {
     if (!room.currentWord || !room.hiddenWord) return;
     const word = room.currentWord;
     const hidden = room.hiddenWord.split('');
     
     const unrevealed: number[] = [];
     for(let i=0; i<word.length; i++) {
        if (hidden[i] === '_') unrevealed.push(i);
     }
     
     if (unrevealed.length > 1) { 
        const idx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        hidden[idx] = word[idx];
        room.hiddenWord = hidden.join('');
        this.io.to(room.id).emit('hint_update', room.hiddenWord);
     }
  }
}
