import Konva from 'konva';
import type { NarrationEvent } from '../models';

interface FrameRequestableMediaStreamTrack extends MediaStreamTrack {
  requestFrame: () => void;
}

export interface VideoExportOptions {
  stage: Konva.Stage;
  duration: number; // ms
  fps?: number;
  mimeType?: string;
  videoBitsPerSecond?: number;
  scale?: number;
  onProgress?: (percent: number) => void;
  computeFrame: (time: number) => void;
  getNarrations?: (time: number) => NarrationEvent[];
}

/**
 * Export the Konva stage animation as a WebM video.
 * Renders frame-by-frame by stepping through the timeline.
 * Now waits for React re-renders and draws narration text on canvas.
 */
export async function exportVideo(opts: VideoExportOptions): Promise<Blob> {
  const {
    stage,
    duration,
    fps = 30,
    mimeType = 'video/webm;codecs=vp9',
    videoBitsPerSecond = 12_000_000,
    scale = 1,
    onProgress,
    computeFrame,
    getNarrations,
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(stage.width() * scale));
  canvas.height = Math.max(1, Math.round(stage.height() * scale));

  const stream = canvas.captureStream(0); // 0 = manual frame capture
  const recorderOptions: MediaRecorderOptions = {
    videoBitsPerSecond,
  };
  if (MediaRecorder.isTypeSupported(mimeType)) {
    recorderOptions.mimeType = mimeType;
  }
  const mediaRecorder = new MediaRecorder(stream, recorderOptions);

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    mediaRecorder.onerror = (e) => reject(e);
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: mediaRecorder.mimeType || mimeType }));
    };

    mediaRecorder.start();

    const totalFrames = Math.ceil((duration / 1000) * fps);
    const frameDuration = 1000 / fps;
    let frame = 0;

    const renderNextFrame = () => {
      if (frame > totalFrames) {
        mediaRecorder.stop();
        return;
      }

      const time = frame * frameDuration;
      computeFrame(Math.min(time, duration));

      // Wait for React to process state changes and Konva to redraw
      requestAnimationFrame(() => {
        stage.batchDraw();

        // Capture the stage to our canvas
        const stageCanvas = stage.toCanvas({ pixelRatio: scale });
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = stageCanvas.width;
          canvas.height = stageCanvas.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(stageCanvas, 0, 0);

          // Draw narration text onto the canvas (since HTML overlays aren't captured by toCanvas)
          if (getNarrations) {
            const narrations = getNarrations(Math.min(time, duration));
            for (const n of narrations) {
              if (!n.text) continue;
              const progress = Math.min(1, (time - n.startTime) / Math.max(n.duration, 1));

              // Calculate opacity based on animation
              let opacity = 1;
              if (n.textAnimation === 'fade') {
                const fadeIn = Math.min(1, (time - n.startTime) / 300);
                const fadeEnd = Math.max(0, 1 - (time - n.startTime - n.duration + 500) / 500);
                opacity = Math.min(fadeIn, fadeEnd);
              }

              // Get display text
              const displayText = n.textAnimation === 'typewriter'
                ? n.text.slice(0, Math.floor(n.text.length * progress))
                : n.text;

              // Calculate position
              let textX = canvas.width / 2;
              let textY = canvas.height - 60;
              if (n.position === 'top') textY = 40 + n.fontSize;
              else if (n.position === 'center') textY = canvas.height / 2;
              else if (n.position === 'custom') {
                textX = n.customX || 100;
                textY = n.customY || 100;
              }

              // Build font string once
              const fontWeight = n.fontStyle === 'bold' ? 'bold ' : '';
              const fontItalic = n.fontStyle === 'italic' ? 'italic ' : '';
              const font = `${fontWeight}${fontItalic}${n.fontSize}px monospace`;

              ctx.save();
              ctx.globalAlpha = opacity;
              ctx.font = font;

              // Draw background
              if (n.bgOpacity > 0) {
                const metrics = ctx.measureText(displayText);
                const textWidth = metrics.width;
                const padding = 12;
                ctx.fillStyle = `rgba(0,0,0,${n.bgOpacity})`;
                ctx.fillRect(textX - textWidth / 2 - padding, textY - n.fontSize - padding / 2, textWidth + padding * 2, n.fontSize + padding);
              }

              // Draw text
              ctx.fillStyle = n.textColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(displayText, textX, textY - n.fontSize / 2 + 2);
              ctx.restore();
            }
          }
        }

        // Request frame capture on the stream
        const track = stream.getVideoTracks()[0];
        if (track && 'requestFrame' in track) {
          (track as FrameRequestableMediaStreamTrack).requestFrame();
        }

        frame++;
        onProgress?.(Math.min(100, Math.round((frame / totalFrames) * 100)));

        // Use setTimeout to allow the recorder to process
        setTimeout(renderNextFrame, 16);
      });
    };

    renderNextFrame();
  });
}
