document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById('reel-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 15);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  scene.add(hemiLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  const tiltGroup = new THREE.Group();
  const stripGroup = new THREE.Group();
  
  // Frame settings
  const numFrames = 20; // Cover infinite loop
  const frameHeight = 2.0;
  const frameWidth = 3.4;
  const frameSpacing = 0.5;
  const helixSpacing = 2.2;
  const helixRadius = 3.5;
  const helixTwist = Math.PI / 4; // 45 degrees per frame
  const totalSpacing = helixSpacing;
  
  const projectNames = [
    "VIHAAN ASHARA", "I CUT WEBSITES", "LIKE FILM.", 
    "SELECTED WORK I", "EIGENCUTS", 
    "SELECTED WORK II", "PARUL AUTO SPLIT", 
    "SELECTED WORK III", "STUDY OS", 
    "THE TIMELINE", "IS THE SCROLL", 
    "INTERLUDE", "PURE ATMOSPHERE", 
    "EVERY CUT", "LANDS ON BEAT", 
    "HUMAN", "NOT TEMPLATE", 
    "LET'S BUILD", "CONTACT", "END OF TRACK"
  ];
  
  const createFrameTexture = (text) => {
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 512;
    texCanvas.height = 300;
    const ctx = texCanvas.getContext('2d');
    
    ctx.fillStyle = '#0A0A0B';
    ctx.fillRect(0, 0, 512, 300);
    
    ctx.fillStyle = '#222';
    for(let i=0; i<8; i++) {
      ctx.fillRect(10 + i*63, 10, 30, 20);
      ctx.fillRect(10 + i*63, 270, 30, 20);
    }
    
    ctx.fillStyle = '#1C1B1C';
    ctx.fillRect(20, 40, 472, 220);
    
    ctx.fillStyle = '#F5F2EA';
    ctx.font = 'bold 50px Anton';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Word wrap roughly
    const words = text.split(' ');
    if (words.length > 1) {
      ctx.fillText(words[0], 256, 120);
      ctx.fillText(words.slice(1).join(' '), 256, 180);
    } else {
      ctx.fillText(text, 256, 150);
    }
    
    return new THREE.CanvasTexture(texCanvas);
  };

  const frames = [];
  for (let i = 0; i < numFrames; i++) {
    const text = projectNames[i % projectNames.length];
    const tex = createFrameTexture(text);
    
    const group = new THREE.Group();
    
    // Red accent border
    const borderGeo = new THREE.PlaneGeometry(frameWidth + 0.15, frameHeight + 0.15);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xFF2E2E, transparent: true, opacity: 0 });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.z = -0.05;
    group.add(borderMesh);
    
    // Frame
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(frameWidth, frameHeight);
    const frameMesh = new THREE.Mesh(geo, mat);
    group.add(frameMesh);
    // Helix positioning
    const angle = i * helixTwist;
    group.position.x = Math.sin(angle) * helixRadius;
    group.position.y = - (i * helixSpacing); 
    group.position.z = Math.cos(angle) * helixRadius;
    group.rotation.y = angle;
    
    stripGroup.add(group);
    frames.push({ group, borderMesh, frameMesh, baseZ: group.position.z });
  }

  // Slight perspective tilt
  const baseRotY = -Math.PI / 12; // -15 deg
  const baseRotX = Math.PI / 24;  // +7.5 deg
  stripGroup.rotation.y = baseRotY;
  stripGroup.rotation.x = baseRotX;
  
  // Grounding Radial Glow
  const canvasGlow = document.createElement('canvas');
  canvasGlow.width = 256;
  canvasGlow.height = 512;
  const ctxGlow = canvasGlow.getContext('2d');
  const gradient = ctxGlow.createRadialGradient(128, 256, 0, 128, 256, 256);
  gradient.addColorStop(0, 'rgba(0,0,0, 0.9)');
  gradient.addColorStop(1, 'rgba(0,0,0, 0)');
  ctxGlow.fillStyle = gradient;
  ctxGlow.fillRect(0,0,256,512);
  const glowTex = new THREE.CanvasTexture(canvasGlow);
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0.7 });
  const glowMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 32), glowMat);
  glowMesh.position.set(0, 0, -2);
  
  tiltGroup.add(glowMesh);
  tiltGroup.add(stripGroup);
  scene.add(tiltGroup);

  let xPos = 0;
  const updateStripPosition = () => {
    const isMobile = window.innerWidth < 768;
    const aspect = window.innerWidth / window.innerHeight;
    const frustumWidth = 2 * 15 * Math.tan((45/2) * Math.PI / 180) * aspect;
    xPos = isMobile ? 0 : (frustumWidth / 2) * 0.65; 
    tiltGroup.position.x = xPos;
  };
  updateStripPosition();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateStripPosition();
  });

  let currentStripY = 0;
  let targetStripY = 0;
  let lastScrollY = window.scrollY;

  // PHASE 0: 360 Twist on boundary crossing (REMOVED per user request to only spin when scrolled)
  window.triggerStripTwist = () => {};



  // Phase 5: Beat Engine Pulse
  window.triggerStripBeatPulse = () => {
    gsap.fromTo(stripGroup.scale,
      { x: 1.05, y: 1.05, z: 1.05 },
      { x: 1, y: 1, z: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" }
    );
  };

  const animate = () => {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    
    // Handle seamless loop jumps
    let scrollDelta = window.scrollY - lastScrollY;
    if (scrollDelta < -window.innerHeight * 2) {
      // Jumped back up (loop reset)
      const sectionsJumped = Math.round(Math.abs(scrollDelta) / window.innerHeight);
      currentStripY -= sectionsJumped * helixSpacing;
    } else if (scrollDelta > window.innerHeight * 2) {
      // Jumped forward
      const sectionsJumped = Math.round(Math.abs(scrollDelta) / window.innerHeight);
      currentStripY += sectionsJumped * helixSpacing;
    }
    lastScrollY = window.scrollY;
    
    // Map scroll progress to vertical strip offset
    const scrollSections = window.scrollY / window.innerHeight;
    targetStripY = scrollSections * helixSpacing; // Use helixSpacing, not totalSpacing
    
    currentStripY += (targetStripY - currentStripY) * 0.08;
    stripGroup.position.y = currentStripY; 
    
    // Helix Unscrew + base rotation
    const baseUnscrew = - (currentStripY / helixSpacing) * helixTwist;
    stripGroup.rotation.y = baseRotY + baseUnscrew;
    
    // Slight parallax on glow
    glowMesh.position.y = currentStripY * 0.05; 

    // Interlude Choreography (s06): Strip close-up drift (Viewport 11.5 to 13.5)
    const modScroll = scrollSections % 20;
    const isInterlude = modScroll >= 11.5 && modScroll <= 13.5;
    const targetX = isInterlude ? 0 : xPos;
    const targetZ = isInterlude ? 6 : 0; // Zoom in
    
    tiltGroup.position.x += (targetX - tiltGroup.position.x) * 0.03;
    tiltGroup.position.z += (targetZ - tiltGroup.position.z) * 0.03;

    // Active frame highlight
    const activeIndex = Math.floor(scrollSections + 0.5); 
    
    frames.forEach((f, i) => {
      // Loop wrapping for visuals: 20 viewports per track
      const normalizedI = i % 20;
      const normalizedActive = activeIndex % 20;
      
      if (normalizedI === normalizedActive) {
        // Highlight active frame
        f.group.scale.lerp(new THREE.Vector3(1.05, 1.05, 1.05), 0.1);
        f.borderMesh.material.opacity += (1 - f.borderMesh.material.opacity) * 0.1;
        f.frameMesh.material.color.lerp(new THREE.Color(0xffffff), 0.1); // Bright
        f.group.position.z = THREE.MathUtils.lerp(f.group.position.z, f.baseZ + 0.6, 0.1);
      } else {
        // Dim and recede non-active frames
        f.group.scale.lerp(new THREE.Vector3(0.95, 0.95, 0.95), 0.1);
        f.borderMesh.material.opacity += (0 - f.borderMesh.material.opacity) * 0.1;
        f.frameMesh.material.color.lerp(new THREE.Color(0x555555), 0.1); // Dim non-active
        f.group.position.z = THREE.MathUtils.lerp(f.group.position.z, f.baseZ - 0.2, 0.1);
      }
    });

    renderer.render(scene, camera);
  };
  animate();
});
