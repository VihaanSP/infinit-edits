// Fix 3: 3D Rubik's Cube Intro
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("intro-overlay");
  if (!overlay) return;

  const overlayContent = document.querySelector(".overlay-content");
  const slamText = overlay.querySelector(".slam-text");
  const subText = overlay.querySelector(".sub-text");
  const enterBtn = document.getElementById("enter-btn");
  const credit = overlay.querySelector(".credit");

  let canvas, renderer, scene, camera;
  let cubeGroup, cubies = [];
  let isAnimating = false;

  const CUBE_SIZE = 1;
  const GAP = 0.05;
  const OFFSET = CUBE_SIZE + GAP;

  // Colors: U (White), D (Yellow), F (Green), B (Blue), L (Orange), R (Red)
  const colors = [
    0xffffff, // White
    0xffd500, // Yellow
    0x009e60, // Green
    0x0051ba, // Blue
    0xff5800, // Orange
    0xc41e3a  // Red
  ];

  function initThree() {
    canvas = document.createElement("canvas");
    canvas.id = "cube-canvas";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "10";
    overlay.insertBefore(canvas, overlayContent);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(6, 5, 8);
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    createCube();

    window.addEventListener("resize", onResize);
    gsap.ticker.add(render);
  }

  function createCube() {
    cubeGroup = new THREE.Group();
    scene.add(cubeGroup);

    const geo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    // 6 materials for 6 faces
    const mats = colors.map(c => new THREE.MeshStandardMaterial({ 
      color: c, roughness: 0.2, metalness: 0.1 
    }));

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const mesh = new THREE.Mesh(geo, mats);
          
          // Outer black border (plastic look)
          const edges = new THREE.EdgesGeometry(geo);
          const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
          mesh.add(line);

          mesh.position.set(x * OFFSET, y * OFFSET, z * OFFSET);
          mesh.userData = { x, y, z, originalPos: mesh.position.clone(), originalRot: mesh.rotation.clone() };
          cubies.push(mesh);
          cubeGroup.add(mesh);
        }
      }
    }
  }

  function onResize() {
    if(!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function render() {
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // Face rotation logic
  function rotateFace(axis, layer, angle, duration) {
    return new Promise(resolve => {
      const activeCubies = cubies.filter(c => Math.round(c.position[axis] / OFFSET) === layer);
      const pivot = new THREE.Group();
      scene.add(pivot);
      
      activeCubies.forEach(c => {
        cubeGroup.remove(c);
        pivot.add(c);
      });

      if (window.playRubiksRotate) window.playRubiksRotate();
      gsap.to(pivot.rotation, {
        [axis]: angle,
        duration: duration,
        ease: "power2.inOut",
        onComplete: () => {
          pivot.updateMatrixWorld(true);
          activeCubies.forEach(c => {
            const worldPos = new THREE.Vector3();
            const worldQuat = new THREE.Quaternion();
            c.getWorldPosition(worldPos);
            c.getWorldQuaternion(worldQuat);
            
            c.position.copy(worldPos);
            c.quaternion.copy(worldQuat);
            
            pivot.remove(c);
            cubeGroup.add(c);
            
            // Snap to grid to prevent drift
            c.position.x = Math.round(c.position.x / OFFSET) * OFFSET;
            c.position.y = Math.round(c.position.y / OFFSET) * OFFSET;
            c.position.z = Math.round(c.position.z / OFFSET) * OFFSET;
          });
          scene.remove(pivot);
          resolve();
        }
      });
    });
  }

  function instantRotateFace(axis, layer, angle) {
    const activeCubies = cubies.filter(c => Math.round(c.position[axis] / OFFSET) === layer);
    const pivot = new THREE.Group();
    scene.add(pivot);
    
    activeCubies.forEach(c => {
      cubeGroup.remove(c);
      pivot.add(c);
    });

    pivot.rotation[axis] = angle;
    pivot.updateMatrixWorld(true);
    
    activeCubies.forEach(c => {
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      c.getWorldPosition(worldPos);
      c.getWorldQuaternion(worldQuat);
      
      c.position.copy(worldPos);
      c.quaternion.copy(worldQuat);
      
      pivot.remove(c);
      cubeGroup.add(c);
      
      c.position.x = Math.round(c.position.x / OFFSET) * OFFSET;
      c.position.y = Math.round(c.position.y / OFFSET) * OFFSET;
      c.position.z = Math.round(c.position.z / OFFSET) * OFFSET;
    });
    scene.remove(pivot);
  }

  async function playSequence() {
    if (isAnimating) return;
    isAnimating = true;

    // Reset UI
    gsap.set([slamText, subText, enterBtn, credit], { opacity: 0 });
    if(enterBtn) enterBtn.style.pointerEvents = "none";
    if(overlayContent) overlayContent.style.pointerEvents = "none";

    // Setup initial state: solve it first to reset, then scramble instantly
    cubies.forEach(c => {
      c.position.copy(c.userData.originalPos);
      c.rotation.copy(c.userData.originalRot);
    });
    
    const scrambleMoves = [];
    const axes = ['x', 'y', 'z'];
    const layers = [-1, 0, 1];
    const angles = [Math.PI / 2, -Math.PI / 2];

    for (let i = 0; i < 15; i++) {
      const m = {
         axis: axes[Math.floor(Math.random()*axes.length)],
         layer: layers[Math.floor(Math.random()*layers.length)],
         angle: angles[Math.floor(Math.random()*angles.length)]
      };
      scrambleMoves.push(m);
      instantRotateFace(m.axis, m.layer, m.angle);
    }
    
    cubeGroup.position.set(0, 15, 0);
    cubeGroup.rotation.set(Math.PI, Math.PI / 4, 0);

    if (window.playRubiksDrop) window.playRubiksDrop();
    await gsap.to(cubeGroup.position, { y: 0, duration: 1.4, ease: "bounce.out" });
    await gsap.to(cubeGroup.rotation, { x: 0, y: Math.PI / 6, z: 0, duration: 1.2, ease: "power2.out" }, "<");
    
    // Pause briefly after landing
    await new Promise(r => setTimeout(r, 200));

    // Solve it back by reversing the scramble moves
    for (let i = scrambleMoves.length - 1; i >= 0; i--) {
      const m = scrambleMoves[i];
      await rotateFace(m.axis, m.layer, -m.angle, 0.12);
    }

    // Final alignment flourish
    await gsap.to(cubeGroup.rotation, { x: 0, y: -Math.PI / 6, z: 0, duration: 0.6, ease: "power2.inOut" });

    // Hold for one beat (~0.5s at 128BPM)
    await new Promise(r => setTimeout(r, 500));

    // Disassemble (fly apart)
    if (window.playRubiksShatter) window.playRubiksShatter();
    const tl = gsap.timeline();
    cubies.forEach(c => {
      const dir = c.position.clone().normalize();
      if(dir.lengthSq() === 0) dir.set(0, 1, 0);
      tl.to(c.position, {
        x: dir.x * 10,
        y: dir.y * 10,
        z: dir.z * 10,
        duration: 1.0,
        ease: "power3.in"
      }, 0);
      tl.to(c.rotation, {
        x: Math.random() * Math.PI * 4,
        y: Math.random() * Math.PI * 4,
        z: Math.random() * Math.PI * 4,
        duration: 1.0,
        ease: "power3.in"
      }, 0);
    });

    await tl;

    // Destroy Canvas to save GPU
    canvas.style.display = "none";
    gsap.ticker.remove(render);

    // Text Slam In
    gsap.fromTo(slamText, 
      { opacity: 0, scale: 0.9, y: 20 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(1.5)" }
    );
    gsap.to([subText, enterBtn, credit], { opacity: 1, duration: 0.8, delay: 0.3 });
    
    if(enterBtn) enterBtn.style.pointerEvents = "auto";
    if(overlayContent) overlayContent.style.pointerEvents = "auto";
    
    isAnimating = false;
  }

  window.startEpicycles = () => {
    // Re-purposed startEpicycles for the new Intro
    if(!canvas) initThree();
    canvas.style.display = "block";
    gsap.ticker.add(render);
    playSequence();
  };

});
