export interface Point {
  x: number;
  y: number;
}

export type GamePhase = 'lobby' | 'choosing_word' | 'drawing' | 'turn_end' | 'game_end';
export type WordDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';
export type ToolType = 'pencil' | 'eraser' | 'fill' | 'rect' | 'circle' | 'line';
export type ChatMessageType = 'normal' | 'correct_guess' | 'close_guess' | 'system' | 'system_meaning' | 'leak_blocked' | 'guessed_chat';

export interface StrokeAction {
  id: string;
  tool: ToolType;
  color: string;
  size: number;
  points: Point[];
  timestamp: number;
}

export interface RoomSettings {
  rounds: number;
  drawTime: number;
  maxPlayers: number;
  wordDifficulty: WordDifficulty;
  wordSelectTime: number;
  customWords: string[];
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatarSeed: string;
  score: number;
  hasGuessedCorrectly: boolean;
  isHost: boolean;
  hintTokens: number;
  connected?: boolean;
}

export interface RoomState {
  id: string;
  hostId: string;
  phase: GamePhase;
  players: Player[];
  settings: RoomSettings;
  currentDrawerId?: string;
  currentPlayerIndex: number;
  currentWord?: string;
  currentWordMeaning?: string;
  hiddenWord?: string;
  roundNumber: number;
  strokeHistory: StrokeAction[];
  historyIndex: number;
  timeRemaining: number;
  wordChoices?: string[];
  turnSummary?: TurnSummary;
  kickVotes?: Record<string, string[]>;
  playAgainVotes?: string[];
  usedWords: string[];
  bannedIds: string[];
}

export interface TurnSummary {
  word: string;
  drawerId: string;
  drawerPoints: number;
  guesserPoints: Record<string, number>;
  likes?: string[];
  dislikes?: string[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  text: string;
  type: ChatMessageType;
  timestamp: number;
}

export interface ReactionPayload {
  roomId: string;
  playerId: string;
  emoji: string;
}

// Drawing Network Payloads
export interface DrawProgressPayload {
  roomId: string;
  strokeId: string;
  tool: ToolType;
  color: string;
  size: number;
  newPoints: Point[];
}

export interface StrokeCompletePayload {
  roomId: string;
  stroke: StrokeAction;
}

export interface CanvasUndoPayload {
  roomId: string;
  historyIndex: number;
}
