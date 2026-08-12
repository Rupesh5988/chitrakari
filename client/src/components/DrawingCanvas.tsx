import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Point, ToolType, StrokeAction, DrawProgressPayload, StrokeCompletePayload, CanvasUndoPayload } from '@chitrakari/shared';
import { drawSmoothLine, drawShape } from '../utils/canvasDrawing';
import { floodFill } from '../utils/floodFill';
import { ColorPalette } from './ColorPalette';
import { useSocket } from '../context/SocketContext';

interface DrawingCanvasProps {
  isDrawer?: boolean;
  drawerName?: string;
  roomId?: string;
}

const INTERNAL_WIDTH = 1600;
const INTERNAL_HEIGHT = 1000;
const THROTTLE_MS = 40;

const IconPencil = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const IconEraser = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path><path d="M22 21H7"></path><path d="m5 11 9 9"></path></svg>;
const IconFill = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"></path><path d="m5 2 5 5"></path><path d="M2 13h15"></path><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"></path></svg>;
const IconRect = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>;
const IconCircle = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>;
const IconLine = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"></line></svg>;
const IconUndo = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>;
const IconRedo = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path></svg>;
const IconTrash = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>;

export function DrawingCanvas({ isDrawer = true, drawerName = 'Someone', roomId }: DrawingCanvasProps) {
  const { socket, roomState } = useSocket();
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const draftCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<StrokeAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tool, setTool] = useState<ToolType>('pencil');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(10);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<StrokeAction | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  const pointsQueue = useRef<Point[]>([]);
  const throttleTimer = useRef<NodeJS.Timeout | null>(null);
  
  const [guesserDraftStroke, setGuesserDraftStroke] = useState<StrokeAction | null>(null);

  useEffect(() => {
    if (roomState && roomState.strokeHistory) {
      setHistory(roomState.strokeHistory);
      setHistoryIndex(roomState.historyIndex);
    } else if (roomId && socket) {
      socket.emit('request_sync', { roomId });
    }
  }, [roomId, socket, roomState?.strokeHistory?.length]);

  const getRelativeCoords = (e: React.PointerEvent): Point => {
    const canvas = draftCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = INTERNAL_WIDTH / rect.width;
    const scaleY = INTERNAL_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const drawAction = useCallback((ctx: CanvasRenderingContext2D, action: StrokeAction, isMainCanvas: boolean) => {
    if (action.points.length === 0) return;

    if (action.tool === 'pencil' || action.tool === 'eraser') {
      drawSmoothLine(ctx, action.points, action.color, action.size, action.tool === 'eraser');
    } else if (action.tool === 'fill' && isMainCanvas) {
      floodFill(ctx, action.points[0], action.color);
    } else if (['rect', 'circle', 'line'].includes(action.tool)) {
      if (action.points.length >= 2) {
        drawShape(ctx, action.tool as any, action.points[0], action.points[action.points.length - 1], action.color, action.size, false);
      }
    }
  }, []);

  const redrawHistory = useCallback((upToIndex: number, specificHistory = history) => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;
    const ctx = mainCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    for (let i = 0; i <= upToIndex; i++) {
      if (specificHistory[i]) {
        drawAction(ctx, specificHistory[i], true);
      }
    }
  }, [history, drawAction]);

  useEffect(() => {
    redrawHistory(historyIndex);
  }, [historyIndex, redrawHistory]);

  // SOCKET LISTENERS
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleDrawProgress = (data: DrawProgressPayload) => {
      setGuesserDraftStroke(prev => {
        const stroke = prev?.id === data.strokeId ? { ...prev } : {
          id: data.strokeId,
          tool: data.tool,
          color: data.color,
          size: data.size,
          points: [],
          timestamp: Date.now()
        };
        stroke.points = [...stroke.points, ...data.newPoints];
        
        const ctx = draftCanvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
          drawAction(ctx, stroke, false);
        }
        return stroke;
      });
    };

    const handleStrokeCompleted = (data: { stroke: StrokeAction, serverStrokeCount: number }) => {
      setHistory(prev => {
        const newHistory = [...prev, data.stroke];
        if (newHistory.length !== data.serverStrokeCount) {
           socket.emit('request_sync', { roomId });
        }
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
      
      setGuesserDraftStroke(null);
      const ctx = draftCanvasRef.current?.getContext('2d');
      ctx?.clearRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    };

    const handleUndo = (data: CanvasUndoPayload) => {
      setHistoryIndex(data.historyIndex);
    };

    const handleSync = (data: { strokeHistory: StrokeAction[], historyIndex: number }) => {
      setHistory(data.strokeHistory);
      setHistoryIndex(data.historyIndex);
      redrawHistory(data.historyIndex, data.strokeHistory);
    };

    socket.on('draw_progress_received', handleDrawProgress);
    socket.on('stroke_completed', handleStrokeCompleted);
    socket.on('undo_received', handleUndo);
    socket.on('canvas_state_sync', handleSync);

    return () => {
      socket.off('draw_progress_received', handleDrawProgress);
      socket.off('stroke_completed', handleStrokeCompleted);
      socket.off('undo_received', handleUndo);
      socket.off('canvas_state_sync', handleSync);
    };
  }, [socket, roomId, drawAction, redrawHistory]);


  const startThrottler = (strokeId: string) => {
    if (throttleTimer.current) clearInterval(throttleTimer.current);
    pointsQueue.current = [];
    
    throttleTimer.current = setInterval(() => {
      if (pointsQueue.current.length > 0 && socket && roomId) {
        socket.emit('draw_progress', {
          roomId,
          strokeId,
          tool,
          color,
          size,
          newPoints: [...pointsQueue.current]
        });
        pointsQueue.current = [];
      }
    }, THROTTLE_MS);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawer) return;
    // Don't prevent default on mobile if touching tools, but here we are on the canvas
    e.preventDefault();
    const coords = getRelativeCoords(e);
    const strokeId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    
    const newStroke: StrokeAction = {
      id: strokeId,
      tool,
      color,
      size,
      points: [coords],
      timestamp: Date.now()
    };
    
    setCurrentStroke(newStroke);
    setIsDrawing(true);
    
    if (tool === 'fill') {
      commitStroke(newStroke);
      setIsDrawing(false);
      setCurrentStroke(null);
    } else {
      pointsQueue.current = [coords];
      startThrottler(strokeId);
      
      const ctx = draftCanvasRef.current?.getContext('2d');
      if (ctx) drawAction(ctx, newStroke, false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDrawer && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (!isDrawer || !isDrawing || !currentStroke || tool === 'fill') return;
    
    const coords = getRelativeCoords(e);
    const updatedPoints = [...currentStroke.points];

    if (tool === 'pencil' || tool === 'eraser') {
      updatedPoints.push(coords);
      pointsQueue.current.push(coords);
    } else {
      if (updatedPoints.length > 1) {
        updatedPoints.pop();
      }
      
      let endPoint = coords;
      if (e.shiftKey) {
         const start = updatedPoints[0];
         const dx = endPoint.x - start.x;
         const dy = endPoint.y - start.y;
         
         if (tool === 'line') {
           const angle = Math.atan2(dy, dx);
           const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
           const length = Math.sqrt(dx * dx + dy * dy);
           endPoint = {
             x: start.x + Math.cos(snappedAngle) * length,
             y: start.y + Math.sin(snappedAngle) * length
           };
         } else if (tool === 'rect') {
           const side = Math.max(Math.abs(dx), Math.abs(dy));
           endPoint = {
             x: start.x + (dx > 0 ? side : -side),
             y: start.y + (dy > 0 ? side : -side)
           };
         } else if (tool === 'circle') {
           const radius = Math.max(Math.abs(dx), Math.abs(dy));
           endPoint = {
             x: start.x + (dx > 0 ? radius : -radius),
             y: start.y + (dy > 0 ? radius : -radius)
           };
         }
      }
      updatedPoints.push(endPoint);
      pointsQueue.current = [updatedPoints[0], endPoint];
    }

    const updatedStroke = { ...currentStroke, points: updatedPoints };
    setCurrentStroke(updatedStroke);

    const ctx = draftCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
      drawAction(ctx, updatedStroke, false);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawer || !isDrawing || !currentStroke) return;
    setIsDrawing(false);
    
    if (throttleTimer.current) clearInterval(throttleTimer.current);
    
    if (pointsQueue.current.length > 0 && socket && roomId) {
       socket.emit('draw_progress', {
         roomId,
         strokeId: currentStroke.id,
         tool, color, size,
         newPoints: [...pointsQueue.current]
       });
    }

    commitStroke(currentStroke);
    setCurrentStroke(null);
    
    const ctx = draftCanvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
  };

  const commitStroke = (stroke: StrokeAction) => {
    const newHistoryIndex = historyIndex + 1;
    const newHistory = history.slice(0, newHistoryIndex);
    newHistory.push(stroke);
    
    setHistory(newHistory);
    setHistoryIndex(newHistoryIndex);

    if (socket && roomId) {
      socket.emit('stroke_complete', { roomId, stroke });
    }
  };

  const handleUndo = () => {
    if (historyIndex >= 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (socket && roomId) {
         socket.emit('canvas_undo', { roomId, historyIndex: newIndex });
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (socket && roomId) {
         socket.emit('canvas_undo', { roomId, historyIndex: newIndex });
      }
    }
  };

  const handleClear = () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      return;
    }
    
    if (socket && roomId) {
       socket.emit('canvas_clear', { roomId, bgColor });
    } else {
       const fillStroke: StrokeAction = {
         id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
         tool: 'fill',
         color: bgColor,
         size: 1,
         points: [{x: 0, y: 0}],
         timestamp: Date.now()
       };
       commitStroke(fillStroke);
    }
    setShowClearConfirm(false);
  };

  const scaleRatio = containerRef.current ? containerRef.current.getBoundingClientRect().width / INTERNAL_WIDTH : 1;
  const cursorSize = size * scaleRatio;

  return (
    <div className="flex flex-col md:flex-row w-full h-full p-2 gap-4">
      
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col items-center justify-center order-1 md:order-2 h-full min-h-[400px]">
        {!isDrawer && (
           <div className="w-full bg-primary-50 dark:bg-primary-500/10 border-b border-primary-200 dark:border-primary-500/30 text-primary-600 dark:text-primary-400 py-3 px-6 rounded-t-3xl font-medium animate-pulse text-center shadow-sm">
             {drawerName} is drawing...
           </div>
        )}
        <div 
          ref={containerRef}
          className={`w-full h-full relative overflow-hidden shadow-inner touch-none select-none border-2 border-slate-200 dark:border-slate-700 ${!isDrawer ? 'rounded-b-3xl pointer-events-none' : 'rounded-3xl cursor-none'}`}
          style={{ backgroundColor: bgColor, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            handlePointerUp();
            setCursorPos(null);
          }}
        >
          {/* Main Canvas scales using CSS object-fit equivalent logic to fill space, but we preserve aspect internally by translating coords. 
              Actually, drawing canvas needs to scale to fit. Since internal is 1600x1000, we should ensure the canvas element stretches. */}
          <canvas
            ref={mainCanvasRef}
            width={INTERNAL_WIDTH}
            height={INTERNAL_HEIGHT}
            className="absolute inset-0 w-full h-full block"
          />
          <canvas
            ref={draftCanvasRef}
            width={INTERNAL_WIDTH}
            height={INTERNAL_HEIGHT}
            className="absolute inset-0 w-full h-full block"
          />

          {isDrawer && cursorPos && (
            <div 
              className="absolute pointer-events-none rounded-full z-50 transition-transform duration-75 shadow-[0_0_8px_rgba(0,0,0,0.6)]"
              style={{
                width: Math.max(12, cursorSize),
                height: Math.max(12, cursorSize),
                left: cursorPos.x - Math.max(12, cursorSize) / 2,
                top: cursorPos.y - Math.max(12, cursorSize) / 2,
                backgroundColor: tool === 'eraser' ? 'rgba(255,255,255,0.8)' : color,
                border: '2px solid white',
                opacity: 0.9
              }}
            />
          )}
        </div>
      </div>

      {/* Sidebar Toolbar (Only visible to Drawer) */}
      {isDrawer ? (
        <div className="flex flex-row md:flex-col gap-4 w-full md:w-20 lg:w-24 shrink-0 order-2 md:order-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          <div className="bg-white dark:bg-paper-800 p-3 lg:p-4 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-soft dark:shadow-soft-dark flex md:flex-col gap-6 md:h-full items-center">
            
            {/* Tools */}
            <div className="flex md:flex-col gap-2">
              {[
                { id: 'pencil', icon: <IconPencil />, label: 'Pencil' },
                { id: 'eraser', icon: <IconEraser />, label: 'Eraser' },
                { id: 'fill', icon: <IconFill />, label: 'Fill' },
                { id: 'rect', icon: <IconRect />, label: 'Rect' },
                { id: 'circle', icon: <IconCircle />, label: 'Circle' },
                { id: 'line', icon: <IconLine />, label: 'Line' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id as ToolType)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                    tool === t.id 
                      ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-500 shadow-sm border border-primary-200 dark:border-primary-500/50 scale-110' 
                      : 'bg-slate-50 dark:bg-paper-900/50 text-slate-400 border border-transparent hover:bg-slate-100 dark:hover:bg-paper-700 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title={t.label}
                >
                  {t.icon}
                </button>
              ))}
            </div>

            <div className="w-px h-12 md:w-12 md:h-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

            {/* Size & Color */}
            <div className="flex md:flex-col items-center gap-4">
              <input 
                type="range" 
                min="2" max="100" 
                value={size} 
                onChange={e => setSize(parseInt(e.target.value))}
                className="w-24 md:w-32 md:-rotate-90 accent-primary-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer my-0 md:my-16"
              />
              <ColorPalette selectedColor={color} onColorSelect={setColor} />
            </div>

            <div className="w-px h-12 md:w-12 md:h-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

            {/* Actions */}
            <div className="flex md:flex-col gap-2 pb-2">
               <button 
                  onClick={handleUndo} 
                  disabled={historyIndex < 0}
                  className="flex items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-paper-900/50 text-slate-400 hover:bg-slate-100 dark:hover:bg-paper-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
               >
                  <IconUndo />
               </button>
               <button 
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="flex items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-paper-900/50 text-slate-400 hover:bg-slate-100 dark:hover:bg-paper-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
               >
                  <IconRedo />
               </button>
               <button 
                  onClick={handleClear}
                  onMouseLeave={() => setShowClearConfirm(false)}
                  className={`flex items-center justify-center p-3 rounded-2xl transition-all ${showClearConfirm ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-500 border border-rose-200 dark:border-rose-500/50' : 'bg-slate-50 dark:bg-paper-900/50 text-slate-400 hover:bg-slate-100 dark:hover:bg-paper-700'}`}
               >
                  {showClearConfirm ? <span className="text-xs font-bold">SURE?</span> : <IconTrash />}
               </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
