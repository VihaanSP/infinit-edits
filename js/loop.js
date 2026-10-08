window.trackHeight = 0;
window.lenis = null;

document.addEventListener("DOMContentLoaded", () => {
  window.lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
  });
  window.lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    window.lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const scrollContainer = document.querySelector(".scroll-container");
  const track = document.createElement("div");
  track.className = "track";
  const panels = Array.from(document.querySelectorAll(".panel"));
  panels.forEach(p => track.appendChild(p));
  scrollContainer.appendChild(track);
  
  const clone = track.cloneNode(true);
  clone.className = "track clone";
  scrollContainer.appendChild(clone);

  window.trackHeight = track.offsetHeight;
  window.addEventListener("resize", () => {
    window.trackHeight = track.offsetHeight;
  });

  window.lenis.on('scroll', (e) => {
    // Scroll down wrap
    if (window.scrollY >= window.trackHeight && e.velocity > 0) {
      window.lenis.scrollTo(window.scrollY - window.trackHeight, { immediate: true, force: true });
    }
    // Scroll up wrap (bidirectional)
    else if (window.scrollY <= 0 && window.trackHeight > 0 && e.velocity < 0) {
      // Teleport to the exact identical scroll position in the clone track
      window.lenis.scrollTo(window.trackHeight - 1, { immediate: true, force: true });
    }
  });
});
