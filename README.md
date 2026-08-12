# Chitrakari

A polished, real-time multiplayer drawing and guessing game (Skribbl.io style).

**[Live Demo: Play Chitrakari Here!](https://insert-your-netlify-url-here.netlify.app)**

## Tech Stack
- **Frontend**: React, Vite, TypeScript, TailwindCSS, Socket.io-client
- **Backend**: Node.js, Express, Socket.io, TypeScript
- **State Management**: React Context API, custom hooks

## Project Structure

This project is set up as a monorepo using npm workspaces:

- `/shared` - Shared TypeScript types used by both client and server (e.g. `RoomState`, `Player`, `DrawEvent`, `GamePhase`)
- `/server` - Node.js + Express + Socket.IO backend
- `/client` - React + Vite + TypeScript + TailwindCSS frontend

## Prerequisites

- Node.js (v18+)
- npm (v9+)

## Setup Instructions

1. Install dependencies from the root directory:
   ```bash
   cd chitrakari
   npm install
   ```

2. (Optional) Make sure the shared package is built initially so types are available:
   ```bash
   npm run build -w @chitrakari/shared
   ```

## Running the Application

You can run both the server and client concurrently from the root directory:

```bash
# Start all workspaces in dev mode
npm run dev
```

Alternatively, you can run them individually:

**Terminal 1 (Server):**
```bash
npm run dev -w @chitrakari/server
```
The server will run on `http://localhost:3001` (and `http://localhost:3001/health` for health check).

**Terminal 2 (Client):**
```bash
npm run dev -w @chitrakari/client
```
The client will run on `http://localhost:5173`.

## Verify Connection

When the client loads, you should see the connection status turn green ("Connected to Server").
Check the browser console and server terminal logs to verify the "ping" / "pong" messages are successfully exchanged.

## Architecture

Chitrakari relies on a strict Client/Server architecture using WebSockets for real-time state synchronization.

### 1. The Client/Server Split
- **The Source of Truth**: The Node.js server holds the authoritative `RoomState` in memory. The client is essentially a dumb terminal that renders whatever `RoomState` it receives and forwards user inputs to the server.
- **Shared Contracts**: Both ends rely on the `@chitrakari/shared` package for identical TypeScript interfaces, ensuring compile-time safety across the network boundary.

### 2. State Machine
Each room progresses through a rigid state machine managed by `GameManager.ts`:
```text
[Lobby] -> [Choosing Word] -> [Drawing] -> [Turn End] --(Next Player)--> [Choosing Word]
                                                        \--(End of Rounds)--> [Game End]
```
- **Lobby**: Players join, Host updates settings (`update_settings`), Host starts game (`start_game`).
- **Choosing Word**: The current drawer is sent 3 words (`word_choices_received`). Timer ticks. Drawer selects word (`word_chosen`).
- **Drawing**: The drawer emits `draw_progress` and `stroke_completed`. Guessers emit `chat_message`. The server runs the Levenshtein algorithm to check guesses.
- **Turn End / Game End**: Scores are calculated and broadcast.

### 3. Socket Event Lifecycle & Race Conditions
- **Chat/Guessing**: When a player submits a guess, it emits `chat_message`. The server's `processChatMessage` processes these incoming messages sequentially. 
- **Simultaneous Guesses**: Because Node.js is single-threaded, if two players guess the word in the exact same millisecond, the event loop still processes them one after another. The first processed event receives the highest speed bonus and adds their ID to `correctGuessers`. The second processed event checks `correctGuessers` and (if they haven't guessed yet) receives a slightly lower time-based score, ensuring mathematically fair processing without race condition deadlocks.
- **Rate Limiting**: Socket connections and rate-limited events (like chat or room creation) are guarded by in-memory Maps that track timestamps per-IP or per-PlayerId, silently dropping excess packets to prevent abuse.
