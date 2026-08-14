# Chitrakari - Project Context & Architecture

This document provides a comprehensive overview of the **Chitrakari** multiplayer drawing and guessing game. It is designed to get any AI assistant (or developer) fully up to speed with the project's current state, architecture, and recent updates.

## Tech Stack
*   **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide React (icons), React Router v6.
*   **Backend**: Node.js, Express, Socket.IO.
*   **Monorepo Structure**:
    *   `client/`: Frontend React application.
    *   `server/`: Backend Socket.IO server.
    *   `shared/`: Shared TypeScript types and constants.

## Application Architecture

The game relies heavily on real-time bidirectional communication via **Socket.IO**. The server acts as the single source of truth for the game state (`RoomState`).

### Core Shared Types (`shared/src/types.ts`)
*   **`RoomSettings`**: `rounds`, `drawTime`, `maxPlayers` (2-16), `wordDifficulty`, `customWords`.
*   **`RoomState`**: `id`, `status` (`waiting`, `choosing`, `drawing`, `finished`), `players` (array of `Player`), `settings`, `currentRound`, `currentDrawerId`, `currentWord`, `wordHints`, `endTime`, `drawingData`.
*   **`Player`**: `id`, `name`, `avatar`, `score`, `isHost`, `hasGuessedCorrectly`, `isDrawing`.
*   **`ToolType`**: `pen`, `eraser`, `fill`.

### Socket Events
*   **Client -> Server**: `join_room`, `leave_room`, `update_settings`, `start_game`, `word_chosen`, `draw_stroke`, `clear_canvas`, `undo_stroke`, `fill_canvas`, `guess`.
*   **Server -> Client**: `room_state_update`, `error`, `chat_message`, `draw_stroke`, `clear_canvas`, `undo_stroke`, `fill_canvas`, `play_audio` (e.g., `tick`, `correct`, `turn`).

## User Interface & Features (Skribbl.io Inspired)

The UI has been meticulously designed to resemble the classic Skribbl.io layout, with modern touches, mobile responsiveness, and Indian-themed cultural elements.

### 1. Landing Page (`client/src/pages/LandingPage.tsx`)
*   **Visuals**: Colorful bouncing "Chitrakari.io!" logo.
*   **Interactions**:
    *   Full-width input for Nickname (`localStorage` persistent).
    *   **Avatar Studio**: Users can cycle (`<` `>`) or randomize (🎲) their avatar seed.
*   **Actions**: "Play!" (Quick Join/Create) and "Create Private Room".
*   **Join via Code**: A specific input field to enter a 6-letter room code.
*   **Footer**: 3-card layout (About, News & Updates, How to Play).
*   *Note*: The language dropdown was recently removed by user request. Mobile layout is fully responsive without needing "Desktop Mode".

### 2. The Avatar System (`client/src/components/Avatar.tsx`)
*   **Dynamic SVG Generation**: Avatars are generated deterministically based on a `seed` string.
*   **Indian Doodle Theme**: Recently updated with highly expressive, hand-drawn doodle assets.
    *   Features include: Raja handlebar mustaches (mooch), standard Indian mustaches, red tilaks/bindis, cool sunglasses (chashma), toothy grins, tongue-out smiles, star eyes, winking faces, artist berets.
    *   Vibrant, festive color palettes (Saffron, Rani Pink, Teal, Sky Blue, Amber).

### 3. Lobby / Waiting Room (`client/src/pages/RoomManager.tsx`)
*   **Layout**: Classic 3-Column Split (fills `100dvh`).
    *   **Left Column (Players)**: Vertical list showing Player Avatar, Name, Score (starts at 0), and a "Host" badge.
    *   **Center Column (Controls)**:
        *   Prominent "WAITING" header.
        *   Copyable Room Code card.
        *   Settings block (Host only): Rounds, Draw Time, Max Players (2-16 dropdown), Word Difficulty, Custom Words text area.
        *   "Start Game" button (Host only).
    *   **Right Column (Chat)**: Standard Chat Sidebar component.

### 4. Game View (`client/src/pages/GameView.tsx` & `DrawingCanvas.tsx`)
*   **Top Bar**: Shows the Room Code (clickable to copy), Round timer, and the Current Word (or underscores/hints for guessers).
*   **Drawing Phase Modal**: When it's a player's turn, a full-screen (mobile-optimized) overlay appears allowing them to select 1 of 3 words.
*   **The Canvas (`DrawingCanvas.tsx`)**:
    *   **Toolbar**: 16 direct color swatches in a neat 2-row grid.
    *   **Brushes**: Preset sizes (S, M, L, XL).
    *   **Tools**: Pen, Eraser, Fill (Bucket), Undo, Clear.
    *   *Mobile Fix*: Implemented `touch-action: none` and specific touch event handlers so drawing on mobile doesn't scroll the page.
*   **The Chat / Guessing Engine (`ChatSidebar.tsx`)**:
    *   On mobile, it docks directly below the canvas so guessers can watch and type simultaneously.
    *   System handles guessing logic on the backend:
        *   Exact match -> Awards points, marks player green, hides word from others.
        *   Close match (Levenshtein distance) -> Shows "X is close!" in yellow to the guesser only.
        *   Regular chat -> Visible to all unless it contains the word.

### 5. Audio Engine (`client/src/utils/AudioEngine.ts`)
*   Provides Web Audio API based synthesized sound effects.
*   Sounds include: Timer ticking (`tick`), correct guess (`correct`), and "Your turn to draw" notification (`turn`).

## Recent Refactoring Notes & Guidelines
*   **Mobile Experience**: Heavy emphasis has been placed on making the game playable on standard mobile phone browsers. Avoid introducing modals or overlays that obscure the canvas during active gameplay. Ensure all inputs and buttons are touch-friendly.
*   **Layout Consistency**: Stick to the `100dvh` full-screen layouts. Use `flex-1` and `min-h-0` carefully to ensure the canvas and chat areas scroll internally rather than expanding the whole page body.
*   **Aesthetics**: The design language is playful, colorful, slightly rounded (`rounded-xl`, `rounded-2xl`), with solid distinct borders (to mimic Skribbl.io's boxy but cute style) and heavy drop shadows on interactive elements.

## What to do next?
When asked to implement a new feature, review the components above. Most state flows through the `SocketManager` to the server, updates the `RoomState`, and broadcasts back to all clients. Ensure backend logic syncs securely rather than trusting client-side computations for scoring or game phase changes.
