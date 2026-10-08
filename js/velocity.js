window.reelSpin = 0.002;
window.scrollVelocity = 0;

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);
  
  const velocityReadout = document.getElementById("velocity-readout");
  const progressRingValue = document.querySelector('.progress-ring__value');
  const circumference = 2 * Math.PI * 6;
  
  progressRingValue.style.strokeDasharray = circumference;
  progressRingValue.style.strokeDashoffset = circumference;

  let currentSectionIndex = Math.floor(window.scrollY / window.innerHeight);
  const contentWrappers = document.querySelectorAll(".content-wrapper");

  ScrollTrigger.create({
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      let rawVel = self.getVelocity();
      
      // Teleport Guard for ScrollTrigger: if velocity is impossibly high (> 50,000 px/s),
      // it means lenis.scrollTo just teleported us for the seamless loop. Ignore it.
      if (Math.abs(rawVel) > 50000) {
        rawVel = 0;
      }
      
      const vel = Math.abs(rawVel);
      window.scrollVelocity = rawVel;
      
      velocityReadout.textContent = Math.round(vel);
      
      if (vel > 1200) {
        velocityReadout.style.color = "var(--red)";
      } else {
        velocityReadout.style.color = "var(--yellow)";
      }
      
      // Drive 3D Reel Spin momentum
      window.reelSpin = Math.max(vel * 0.0001, 0.002);
      
      if (window.trackHeight > 0) {
        const loopProgress = (window.scrollY % window.trackHeight) / window.trackHeight;
        const offset = circumference - loopProgress * circumference;
        progressRingValue.style.strokeDashoffset = offset;
        const chapterDot = document.querySelector('.chapter-dot');
        if (chapterDot) chapterDot.style.left = `${loopProgress * 100}%`;
      }

      // Stage 3 Velocity System: Scale & Blur
      const targetScale = 1 + Math.min(vel * 0.0004, 0.18);
      const blurAmount = Math.min(vel * 0.005, 10);
      
      contentWrappers.forEach((wrapper) => {
        const rect = wrapper.getBoundingClientRect();
        // Check if wrapper is currently crossing the viewport
        const isActive = (rect.bottom > 0 && rect.top < window.innerHeight);
        
        if (isActive) {
          gsap.to(wrapper, {
            scale: targetScale,
            filter: `blur(${blurAmount}px)`,
            duration: 0.5,
            ease: "power3.out",
            overwrite: "auto"
          });
          const heading = wrapper.querySelector(".slam-heading");
          if (heading) {
            const clipAmt = Math.min(vel * 0.015, 60); // max 60% clip when scrolling fast
            gsap.to(heading, { clipPath: `inset(0 0 ${clipAmt}% 0)`, duration: 0.5, ease: "power3.out" });
          }
        } else {
          gsap.to(wrapper, {
            scale: 1,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "power3.out",
            overwrite: "auto"
          });
          const heading = wrapper.querySelector(".slam-heading");
          if (heading) {
            gsap.to(heading, { clipPath: `inset(0 0 0% 0)`, duration: 0.5, ease: "power3.out" });
          }
        }
      });

      // Whip-pan streak & Strip Twist on boundary cross
      const newSectionIndex = Math.floor(window.scrollY / window.innerHeight);
      if (newSectionIndex !== currentSectionIndex) {
        if (vel > 1200) {
          const direction = self.direction || 1; 
          gsap.fromTo("#whip-pan-streak", 
            { opacity: 0.8, x: direction > 0 ? "-50vw" : "50vw" },
            { opacity: 0, x: 0, duration: 0.18, ease: "power2.out" }
          );
        }
        
        if (window.triggerStripTwist) {
           window.triggerStripTwist();
        }
        
        currentSectionIndex = newSectionIndex;
      }
      
      // Parallax via data-speed
      document.querySelectorAll("[data-speed]").forEach(el => {
        const speed = parseFloat(el.getAttribute("data-speed")) || 0;
        // Map to scroll progress within the track to avoid jumps on teleport
        if (window.trackHeight > 0) {
          const loopProgress = (window.scrollY % window.trackHeight) / window.trackHeight;
          const offset = -(loopProgress * window.trackHeight * speed);
          gsap.set(el, { y: offset });
        }
      });
    }
  });

  // PHASE 2: Curved Scroll (haoqi.design technique)
  let prevScrollY = window.scrollY;
  let activity = 0;
  let lastTime = performance.now();

  const updateCurl = (time) => {
    requestAnimationFrame(updateCurl);
    
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
       window.uCurlStrength = 0;
       return;
    }

    let dt = (time - lastTime) / 1000.0;
    lastTime = time;
    if (dt < 1/240) dt = 1/240;
    if (dt > 0.1) dt = 0.1;

    const currentScrollY = window.scrollY;
    let delta = currentScrollY - prevScrollY;
    
    // Teleport guard (Phase 2 Addendum): ignore > 2 viewports
    if (Math.abs(delta) > window.innerHeight * 2) {
      delta = 0;
    }

    const velocity = Math.abs(delta) / dt;
    const direction = Math.sign(delta) || 1;
    prevScrollY = currentScrollY;

    const target = Math.min(Math.max(velocity / 800, 0), 1);
    const tau = target > activity ? 0.025 : 0.175;
    const alpha = 1 - Math.exp(-dt / tau);

    activity = activity + (target - activity) * alpha;
    
    window.uCurlStrength = 0.06 * activity * direction;

    // DOM Skew (subtle max 2deg)
    const skewDeg = activity * direction * 2.0;
    contentWrappers.forEach(wrapper => {
      gsap.set(wrapper, { skewY: skewDeg });
    });
  };
  requestAnimationFrame(updateCurl);
});
