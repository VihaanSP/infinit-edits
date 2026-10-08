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

function playKick(time) {
  const osc = window.audioCtx.createOscillator();
  const gain = window.audioCtx.createGain();
  osc.connect(gain);
  gain.connect(window.audioCtx.destination);

  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);
  
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
  
  osc.start(time);
  osc.stop(time + 0.5);
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
  filter.frequency.value = 7000;
  
  const gain = window.audioCtx.createGain();
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(window.audioCtx.destination);
  noise.start(time);
}

function playBass(time) {
  const osc = window.audioCtx.createOscillator();
  const gain = window.audioCtx.createGain();
  const filter = window.audioCtx.createBiquadFilter();
  
  osc.type = "sawtooth";
  osc.frequency.value = 40;
  
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(200, time);
  filter.frequency.linearRampToValueAtTime(800, time + 0.1);
  filter.frequency.exponentialRampToValueAtTime(100, time + 0.4);
  
  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(window.audioCtx.destination);
  
  osc.start(time);
  osc.stop(time + 0.4);
}

function scheduleAudio() {
  if (!window.audioEnabled || !window.audioCtx) return;
  
  while (nextBeatTime < window.audioCtx.currentTime + 0.1) {
    playKick(nextBeatTime);
    playHat(nextBeatTime + beatInterval * 0.5);
    
    if (beatCount % 4 === 0) playBass(nextBeatTime);
    else if (beatCount % 4 === 2) playBass(nextBeatTime + beatInterval * 0.25);
    
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
});
