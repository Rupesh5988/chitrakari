import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomState, Player } from '@chitrakari/shared';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  roomState: RoomState | null;
  setRoomState: React.Dispatch<React.SetStateAction<RoomState | null>>;
  me: Player | null;
  setMe: React.Dispatch<React.SetStateAction<Player | null>>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  roomState: null,
  setRoomState: () => {},
  me: null,
  setMe: () => {}
});

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [me, setMe] = useState<Player | null>(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('room_updated', (newRoomState: RoomState) => {
      setRoomState(newRoomState);
      // Update 'me' if needed (e.g. host migration)
      setMe(prev => {
        if (!prev) return null;
        const updatedMe = newRoomState.players.find(p => p.id === prev.id);
        return updatedMe || prev;
      });
    });

    newSocket.on('kicked', () => {
      setRoomState(null);
      setMe(null);
      window.location.href = '/';
      alert('You have been kicked from the room.');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, roomState, setRoomState, me, setMe }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
