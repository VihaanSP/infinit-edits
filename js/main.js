window.startTime = null;
window.audioEnabled = false;

document.addEventListener("DOMContentLoaded", () => {
  // Overlay Dismissal
  const introOverlay = document.getElementById("intro-overlay");
  
  const dismissIntro = (e) => {
    window.startTime = performance.now();
    gsap.to(introOverlay, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        introOverlay.style.display = "none";
        document.body.style.overflow = "auto";
      }
    });
  };

  const enterBtn = document.getElementById("enter-btn");
  if(enterBtn) {
    enterBtn.addEventListener("click", dismissIntro);
  }

  const showIntro = () => {
    introOverlay.style.display = "flex";
    document.body.style.overflow = "hidden";
    if (window.startEpicycles) {
       window.startEpicycles();
    } else {
       gsap.to(introOverlay, {
         opacity: 1,
         duration: 0.4,
         ease: "power2.out"
       });
    }
  };
  
  const introBtn = document.getElementById("intro-btn");
  if(introBtn) {
    introBtn.addEventListener("click", showIntro);
  }

  // Lock scroll initially
  document.body.style.overflow = "hidden";

  // Audio Mute Toggle Placeholder
  const muteBtn = document.getElementById("mute-btn");
  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent triggering overlay dismiss if clicked during intro
    window.audioEnabled = !window.audioEnabled;
    muteBtn.textContent = window.audioEnabled ? "[ SOUND ON ]" : "[ SOUND OFF ]";
    muteBtn.style.color = window.audioEnabled ? "var(--paper)" : "var(--dim)";
    muteBtn.style.borderColor = window.audioEnabled ? "var(--paper)" : "var(--dim)";
  });

  // Phase 7: Clickable Chapter Ticks
  const chapterTrack = document.querySelector('.chapter-track');
  const numPanels = 11; // s00 to s10
  if (chapterTrack) {
    for (let i = 0; i < numPanels; i++) {
      const tick = document.createElement('div');
      tick.style.position = 'absolute';
      tick.style.top = '0';
      tick.style.bottom = '0';
      tick.style.width = '1px';
      tick.style.background = 'rgba(255,255,255,0.3)';
      tick.style.left = `${(i / numPanels) * 100}%`;
      tick.style.cursor = 'pointer';
      
      const hit = document.createElement('div');
      hit.style.position = 'absolute';
      hit.style.top = '-10px';
      hit.style.bottom = '-10px';
      hit.style.left = '-4px';
      hit.style.width = '10px';
      hit.style.cursor = 'pointer';
      tick.appendChild(hit);
      
      tick.addEventListener('click', () => {
        if (window.lenis) window.lenis.scrollTo(i * window.innerHeight);
      });
      chapterTrack.appendChild(tick);
    }
  }
});
