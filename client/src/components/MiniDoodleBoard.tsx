import React, { useRef, useState, useEffect } from 'react';

export function MiniDoodleBoard() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#3b82f6');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);
        
        // Pick a random vibrant color for this doodle session
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
        setColor(colors[Math.floor(Math.random() * colors.length)]);
        
        return () => window.removeEventListener('resize', resize);
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.beginPath(); // Reset path so next click doesn't connect
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get coordinates
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };
    
    const clearCanvas = (e: React.MouseEvent) => {
        e.stopPropagation();
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    return (
        <div className="absolute inset-0 group">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
                onTouchMove={draw}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10"
            />
            <button 
                onClick={clearCanvas}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-[10px] uppercase font-bold text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded shadow-sm"
            >
                Clear
            </button>
        </div>
    );
}
