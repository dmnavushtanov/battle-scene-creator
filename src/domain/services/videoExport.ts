import Konva from 'konva';

export interface VideoExportOptions {
  stage: Konva.Stage;
  duration: number; // ms
  fps?: number;
  onProgress?: (percent: number) => void;
  computeFrame: (time: number) => void;
}

/**
 * Export the Konva stage animation as a WebM video.
 * Renders frame-by-frame by stepping through the timeline.
 */
export async function exportVideo(opts: VideoExportOptions): Promise<Blob> {
  const { stage, duration, fps = 30, onProgress, computeFrame } = opts;

  const canvas = stage.toCanvas({
    pixelRatio: 1,
  });

  const stream = canvas.captureStream(0); // 0 = manual frame capture
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    mediaRecorder.onerror = (e) => reject(e);
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
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

      // Force Konva to redraw
      stage.batchDraw();

      // Capture frame - get the actual canvas from the stage container
      const stageCanvas = stage.toCanvas({ pixelRatio: 1 });
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = stageCanvas.width;
        canvas.height = stageCanvas.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(stageCanvas, 0, 0);
      }

      // Request frame capture on the stream
      const track = stream.getVideoTracks()[0];
      if (track && 'requestFrame' in track) {
        (track as any).requestFrame();
      }

      frame++;
      onProgress?.(Math.min(100, Math.round((frame / totalFrames) * 100)));

      // Use setTimeout to allow the recorder to process
      setTimeout(renderNextFrame, 10);
    };

    renderNextFrame();
  });
}
