import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { RoomManager } from './pages/RoomManager';
import { SpaceBackground } from './components/SpaceBackground';
import { Toaster } from 'sonner';

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <SpaceBackground />
        <BrowserRouter>
          <Toaster theme="system" richColors position="top-right" />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/room/:code" element={<RoomManager />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
