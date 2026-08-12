import { Point } from '@chitrakari/shared';

// Draw a smooth line using quadratic curves
export function drawSmoothLine(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  size: number,
  isEraser: boolean = false
) {
  if (points.length === 0) return;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  
  if (isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.beginPath();

  if (points.length === 1) {
    // Draw a single dot
    ctx.fillStyle = color;
    ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (points.length === 2) {
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    return;
  }

  // Use quadratic curves for points > 2
  ctx.moveTo(points[0].x, points[0].y);
  let i;
  for (i = 1; i < points.length - 2; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  // For the last two points
  ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  ctx.stroke();
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  type: 'rect' | 'circle' | 'line',
  start: Point,
  end: Point,
  color: string,
  size: number,
  isConstrained: boolean
) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.globalCompositeOperation = 'source-over';

  let dx = end.x - start.x;
  let dy = end.y - start.y;

  ctx.beginPath();

  if (type === 'line') {
    ctx.moveTo(start.x, start.y);
    if (isConstrained) {
      // Snap to 45 degree increments
      const angle = Math.atan2(dy, dx);
      const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const length = Math.sqrt(dx * dx + dy * dy);
      ctx.lineTo(start.x + Math.cos(snappedAngle) * length, start.y + Math.sin(snappedAngle) * length);
    } else {
      ctx.lineTo(end.x, end.y);
    }
  } else if (type === 'rect') {
    if (isConstrained) {
      const side = Math.max(Math.abs(dx), Math.abs(dy));
      dx = dx > 0 ? side : -side;
      dy = dy > 0 ? side : -side;
    }
    ctx.rect(start.x, start.y, dx, dy);
  } else if (type === 'circle') {
    if (isConstrained) {
      const radius = Math.max(Math.abs(dx), Math.abs(dy));
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
    } else {
      // Ellipse
      ctx.ellipse(
        start.x + dx / 2,
        start.y + dy / 2,
        Math.abs(dx / 2),
        Math.abs(dy / 2),
        0,
        0,
        Math.PI * 2
      );
    }
  }
  
  ctx.stroke();
}
