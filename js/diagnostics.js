document.addEventListener("DOMContentLoaded", () => {
  const timecodeEl = document.getElementById("timecode");
  const fpsReadout = document.getElementById("fps-readout");
  
  let frames = [];
  let lastTime = performance.now();
  
  const updateDiagnostics = (now) => {
    // FPS calculation (smoothed over 30 frames)
    const delta = now - lastTime;
    lastTime = now;
    
    if (delta > 0) {
      const fps = 1000 / delta;
      frames.push(fps);
      if (frames.length > 30) frames.shift();
      
      const avgFps = frames.reduce((a, b) => a + b, 0) / frames.length;
      fpsReadout.textContent = Math.round(avgFps);
    }
    
    // Running Timecode
    if (window.startTime !== null && window.startTime !== undefined) {
      const elapsed = now - window.startTime;
      const totalSeconds = Math.max(0, elapsed / 1000);
      
      const tcFrames = Math.floor((totalSeconds % 1) * 24);
      const tcSeconds = Math.floor(totalSeconds) % 60;
      const tcMinutes = Math.floor(totalSeconds / 60) % 60;
      const tcHours = Math.floor(totalSeconds / 3600);
      
      const pad = (num) => num.toString().padStart(2, '0');
      timecodeEl.textContent = `[REC] ${pad(tcHours)}:${pad(tcMinutes)}:${pad(tcSeconds)}:${pad(tcFrames)}`;
    }
    
    requestAnimationFrame(updateDiagnostics);
  };
  requestAnimationFrame(updateDiagnostics);
});
