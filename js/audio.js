window.audioEnabled = false;
window.audioCtx = null;

const BPM = 128;
const beatInterval = 60 / BPM; 
let nextBeatTime = 0;
let beatCount = 0;

function initAudio() {
  if (window.audioCtx) return;
  window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function getScrollProgress() {
  if (!window.trackHeight) return 0;
  return Math.min(1, Math.max(0, window.scrollY / window.trackHeight));
}

// Rubik's Cube SFX
window.playRubiksRotate = (timeDelay = 0) => {
  if (!window.audioCtx || window.audioCtx.state === 'suspended') return;
  const time = window.audioCtx.currentTime + timeDelay;
  
  // Mechanical plastic clack (filtered noise)
  const bufferSize = window.audioCtx.sampleRate * 0.05;
  const buffer = window.audioCtx.createBuffer(1, bufferSize, window.audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = window.audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = window.audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200 + Math.random() * 400; // slightly randomized per clack
  filter.Q.value = 1.5;
  
  const gain = window.audioCtx.createGain();
  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.03); // crisp 30ms transient
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(window.audioCtx.destination);
  noise.start(time);
};

window.playRubiksDrop = () => {
  if (!window.audioCtx || window.audioCtx.state === 'suspended') return;
  const time = window.audioCtx.currentTime;
  const osc = window.audioCtx.createOscillator();
  const gain = window.audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100, time);
  osc.frequency.exponentialRampToValueAtTime(30, time + 0.3);
  gain.gain.setValueAtTime(0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
  osc.connect(gain);
  gain.connect(window.audioCtx.destination);
  osc.start(time);
  osc.stop(time + 0.3);
};

window.playRubiksShatter = () => {
  if (!window.audioCtx || window.audioCtx.state === 'suspended') return;
  const time = window.audioCtx.currentTime;
  
  // White noise blast
  const bufferSize = window.audioCtx.sampleRate * 0.5;
  const buffer = window.audioCtx.createBuffer(1, bufferSize, window.audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = window.audioCtx.createBufferSource();
  noise.buffer = buffer;
  const gain = window.audioCtx.createGain();
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
  noise.connect(gain);
  gain.connect(window.audioCtx.destination);
  noise.start(time);
}

function playKick(time) {
  const osc = window.audioCtx.createOscillator();
  const gain = window.audioCtx.createGain();
  osc.connect(gain);
  gain.connect(window.audioCtx.destination);

  // Premium punchy kick
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
  
  gain.gain.setValueAtTime(1.2, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
  
  osc.start(time);
  osc.stop(time + 0.4);
  
  // High-frequency click transient for attack
  const clickOsc = window.audioCtx.createOscillator();
  const clickGain = window.audioCtx.createGain();
  clickOsc.type = "square";
  clickOsc.frequency.setValueAtTime(1200, time);
  clickOsc.frequency.exponentialRampToValueAtTime(100, time + 0.02);
  clickGain.gain.setValueAtTime(0.3, time);
  clickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.02);
  clickOsc.connect(clickGain);
  clickGain.connect(window.audioCtx.destination);
  clickOsc.start(time);
  clickOsc.stop(time + 0.02);
}

function playHat(time) {
  const bufferSize = window.audioCtx.sampleRate * 0.05;
  const buffer = window.audioCtx.createBuffer(1, bufferSize, window.audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  
  const noise = window.audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = window.audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 8000;
  
  const gain = window.audioCtx.createGain();
  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(window.audioCtx.destination);
  noise.start(time);
}

function playBass(time) {
  const osc = window.audioCtx.createOscillator();
  const gain = window.audioCtx.createGain();
  const filter = window.audioCtx.createBiquadFilter();
  
  // Premium sub-bass
  osc.type = "sawtooth";
  osc.frequency.value = 55; // Deep A
  
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(400, time);
  filter.frequency.exponentialRampToValueAtTime(60, time + 0.2);
  
  gain.gain.setValueAtTime(0.8, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(window.audioCtx.destination);
  
  osc.start(time);
  osc.stop(time + 0.3);
}

// Pop Chords (Am, F, C, G)
const popChords = [
  [220.00, 261.63, 329.63], // Am
  [174.61, 220.00, 261.63], // F
  [261.63, 329.63, 392.00], // C
  [196.00, 246.94, 293.66]  // G
];

const popMelody = [
  329.63, 392.00, 440.00, 392.00, // E, G, A, G
  261.63, 329.63, 261.63, 293.66, // C, E, C, D
];

function playChord(time, index) {
  const chord = popChords[index % popChords.length];
  chord.forEach(freq => {
    const osc = window.audioCtx.createOscillator();
    const gain = window.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0, time);
    gain.gain.linearRampToValueAtTime(0.1, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, time + beatInterval * 3.9);
    osc.connect(gain);
    gain.connect(window.audioCtx.destination);
    osc.start(time);
    osc.stop(time + beatInterval * 4);
  });
}

function playLead(time, noteIndex) {
  const freq = popMelody[noteIndex % popMelody.length];
  const osc = window.audioCtx.createOscillator();
  const gain = window.audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq * 2;
  const filter = window.audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3000, time);
  filter.frequency.exponentialRampToValueAtTime(400, time + 0.2);
  gain.gain.setValueAtTime(0.1, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + beatInterval * 0.5);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(window.audioCtx.destination);
  osc.start(time);
  osc.stop(time + beatInterval);
}

function scheduleAudio() {
  if (!window.audioEnabled || !window.audioCtx) return;
  
  const p = getScrollProgress();
  
  while (nextBeatTime < window.audioCtx.currentTime + 0.1) {
    // Stage 1: Basic Kick (Always)
    playKick(nextBeatTime);
    
    // Stage 2: Hats (Progress > 0.15)
    if (p > 0.15) {
      playHat(nextBeatTime + beatInterval * 0.25);
      playHat(nextBeatTime + beatInterval * 0.75);
    }
    
    // Stage 3: Bass (Progress > 0.35)
    if (p > 0.35) {
      if (beatCount % 4 === 0) playBass(nextBeatTime);
      else if (beatCount % 4 === 2) playBass(nextBeatTime + beatInterval * 0.25);
    }
    
    // Stage 4: Chords (Progress > 0.55)
    if (p > 0.55) {
      if (beatCount % 4 === 0) playChord(nextBeatTime, Math.floor(beatCount / 4));
    }
    
    // Stage 5: Melody (Progress > 0.75)
    if (p > 0.75) {
      if (beatCount % 4 !== 3) {
        playLead(nextBeatTime, beatCount);
      }
    }
    
    const timeToBeat = nextBeatTime - window.audioCtx.currentTime;
    setTimeout(() => { triggerVisualBeat(beatCount); }, timeToBeat * 1000);
    
    nextBeatTime += beatInterval;
    beatCount++;
  }
}

function triggerVisualBeat(bc) {
  if (window.triggerStripBeatPulse) {
    window.triggerStripBeatPulse();
  }
}

setInterval(scheduleAudio, 50);

document.addEventListener("DOMContentLoaded", () => {
  const muteBtn = document.getElementById("mute-btn");
  const enterBtn = document.getElementById("enter-btn");
  
  const toggleAudio = (e) => {
    if (e) e.stopPropagation();
    initAudio();
    if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
    
    // We already have a window.audioEnabled check in main.js, let's just override here
    window.audioEnabled = !window.audioEnabled;
    if (window.audioEnabled) {
      nextBeatTime = window.audioCtx.currentTime + 0.1;
      muteBtn.textContent = "[ SOUND ON ]";
      muteBtn.style.color = "var(--paper)";
    } else {
      muteBtn.textContent = "[ SOUND OFF ]";
      muteBtn.style.color = "var(--dim)";
    }
  };

  if (muteBtn) {
    // Replace old event listener from main.js by cloning node
    const newMute = muteBtn.cloneNode(true);
    muteBtn.parentNode.replaceChild(newMute, muteBtn);
    newMute.addEventListener("click", toggleAudio);
  }
  
  if (enterBtn) {
    enterBtn.addEventListener("click", () => {
       initAudio();
       if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
       if (!window.audioEnabled) toggleAudio();
    });
  }
  
  const startIntroBtn = document.getElementById("start-intro-btn");
  if (startIntroBtn) {
    startIntroBtn.addEventListener("click", () => {
       initAudio();
       if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
       if (!window.audioEnabled) toggleAudio();
    });
  }
});
