import { Point } from '@chitrakari/shared';

// Hex to RGBA array
export function hexToRgba(hex: string): [number, number, number, number] {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return [(c as any >> 16) & 255, (c as any >> 8) & 255, (c as any) & 255, 255];
  }
  return [0, 0, 0, 255]; // fallback
}

export function floodFill(
  ctx: CanvasRenderingContext2D,
  startPoint: Point,
  fillColorHex: string
) {
  const canvasWidth = ctx.canvas.width;
  const height = ctx.canvas.height;

  const startX = Math.floor(startPoint.x);
  const startY = Math.floor(startPoint.y);

  if (startX < 0 || startX >= canvasWidth || startY < 0 || startY >= height) return;

  const imageData = ctx.getImageData(0, 0, canvasWidth, height);
  const data = imageData.data;

  const targetColor = getPixel(data, startX, startY, canvasWidth);
  const fillColor = hexToRgba(fillColorHex);

  if (colorsMatch(targetColor, fillColor)) return;

  const pixelsToCheck = [startX, startY];

  while (pixelsToCheck.length > 0) {
    const y = pixelsToCheck.pop()!;
    const x = pixelsToCheck.pop()!;

    let currentY = y;
    while (currentY >= 0 && matchStartColor(data, x, currentY, canvasWidth, targetColor)) {
      currentY--;
    }
    currentY++;

    let reachLeft = false;
    let reachRight = false;

    while (currentY < height && matchStartColor(data, x, currentY, canvasWidth, targetColor)) {
      setPixel(data, x, currentY, canvasWidth, fillColor);

      if (x > 0) {
        if (matchStartColor(data, x - 1, currentY, canvasWidth, targetColor)) {
          if (!reachLeft) {
            pixelsToCheck.push(x - 1, currentY);
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }

      if (x < canvasWidth - 1) {
        if (matchStartColor(data, x + 1, currentY, canvasWidth, targetColor)) {
          if (!reachRight) {
            pixelsToCheck.push(x + 1, currentY);
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }

      currentY++;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function getPixel(data: Uint8ClampedArray, x: number, y: number, width: number): [number, number, number, number] {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function setPixel(data: Uint8ClampedArray, x: number, y: number, width: number, color: [number, number, number, number]) {
  const i = (y * width + x) * 4;
  data[i] = color[0];
  data[i + 1] = color[1];
  data[i + 2] = color[2];
  data[i + 3] = color[3]; // Keep alpha at 255 unless we want transparency fill
}

function matchStartColor(data: Uint8ClampedArray, x: number, y: number, width: number, startColor: [number, number, number, number]) {
  const p = getPixel(data, x, y, width);
  return colorsMatch(p, startColor);
}

function colorsMatch(c1: [number, number, number, number], c2: [number, number, number, number]) {
  return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3];
}
