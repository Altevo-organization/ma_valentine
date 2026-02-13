// ===== MUSEUM 3D EXPERIENCE =====
let museumRenderer, museumScene, museumCamera;
let museumAnimationId = null;
let museumPaintings = [];
let museumActive = false;
let museumViewingPainting = null;
let museumNearestPainting = null;
let museumPointerLocked = false;
let museumLastTime = 0;
let museumYaw = 0;
let museumPitch = 0;
let museumMoveState = { forward: false, backward: false, left: false, right: false };
let museumStarted = false;
let museumDragging = false;
let museumLastMouseX = 0, museumLastMouseY = 0;

// Pre-allocated reusable objects (avoid GC in render loop)
let _museumInteractEl = null;
let _museumProximityFrame = 0;

// Smoothed velocity for interpolated movement (fixes teleportation/jitter)
let museumVelX = 0, museumVelZ = 0;

const MUSEUM_MOVE_SPEED = 3;
const MUSEUM_MOUSE_SENS = 0.0015;
const MUSEUM_PLAYER_HEIGHT = 1.7;
const MUSEUM_INTERACT_DIST = 2.5;
const MUSEUM_MOVE_LERP = 0.08; // Smooth acceleration/deceleration

// Walkable zones (xMin, xMax, zMin, zMax) with padding for smooth collision
const MUSEUM_ZONES = [
    { xMin: 0.4, xMax: 7.6, zMin: -9.6, zMax: -0.4 },
    { xMin: 8.4, xMax: 19.6, zMin: -9.6, zMax: -0.4 },
    { xMin: 12.4, xMax: 19.6, zMin: 0.4, zMax: 6.6 },
    { xMin: 7.6, xMax: 8.4, zMin: -6.5, zMax: -3.5 },
    { xMin: 15.0, xMax: 18.0, zMin: -0.4, zMax: 0.4 }
];

// Painting data
const PAINTINGS_DATA = [
    { image: 'assets/images/museum/painting1.jpg', pos: [0.06, 1.8, -3.0], size: [1.2, 1.8], rotY: Math.PI / 2, wall: 'west',   title: "YOUR FIRST BOUQUET", message: "le début d'une longue liste qui ne finira jamais" },
    { image: 'assets/images/museum/painting2.jpg', pos: [0.06, 1.8, -7.0], size: [1.2, 1.8], rotY: Math.PI / 2, wall: 'west',   title: "THE BEGINNINGS", message: "on est quand même trop mignon sérieux" },
    { image: 'assets/images/museum/painting3.jpg', pos: [4.0, 1.8, -9.94], size: [1.2, 1.8], rotY: 0, wall: 'north',   title: "The FAMILIA", message: "Bien plus qu'un couple après tout, une vraie famille" },
    { image: 'assets/images/museum/painting4.jpg', pos: [11.0, 1.8, -9.94], size: [1.2, 1.8], rotY: 0, wall: 'north',   title: "OUR FIRST PHOTOS", message: "On a commencé comme ça et on a finit par parler de famille quand même on est trop fort" },
    { image: 'assets/images/museum/painting5.jpg', pos: [17.0, 1.8, -9.94], size: [1.2, 1.8], rotY: 0, wall: 'north',   title: "OUR FIRST STAY", message: "Ce séjour a Paris je suis pas prêt de l'oublier il était parfait" },
    { image: 'assets/images/museum/painting6.jpg', pos: [19.94, 1.8, -5.0], size: [1.2, 1.8], rotY: -Math.PI / 2, wall: 'east',   title: "MY FAVORITE PICTURE", message: "ma photo de toi préférée, juste WOW" },
    { image: 'assets/images/museum/painting7.jpg', pos: [11.0, 1.8, -0.06], size: [1.2, 1.8], rotY: Math.PI, wall: 'south',   title: "SPA ADDICT", message: "Un de nos moments a deux préféré et de loin" },
    { image: 'assets/images/museum/painting8.jpg', pos: [19.94, 1.8, 3.5], size: [1.2, 1.8], rotY: -Math.PI / 2, wall: 'east',   title: "THE MONSTER", message: "Je pensais pas que une boule de poil qui pue soit le centre de mon couple" },
    { image: 'assets/images/museum/painting9.jpg', pos: [16.0, 1.8, 6.94], size: [2.4, 1.6], rotY: Math.PI, wall: 'south',   title: "THE COUPLE", message: "Notre plus belle photo, on est magnifique" },
    { image: 'assets/images/museum/painting10.jpg', pos: [12.06, 1.8, 3.5], size: [1.2, 1.8], rotY: Math.PI / 2, wall: 'west',   title: "THE DINNER", message: "Hate de revivre ce repas en tête a tête pour nos 2 ans ensemble" }
];

const PLACEHOLDER_COLORS = [0xc44569, 0xf78fb3, 0x546de5, 0x574b90, 0xe15f41, 0xf5cd79, 0x786fa6, 0x63cdda, 0xcf6a87, 0x778beb];

// Shared geometry/material caches (created once, reused)
let _sharedGeometries = {};
let _sharedMaterials = {};

// ========== INIT ==========
function initMuseum() {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || ('ontouchstart' in window && window.innerWidth < 1024);

    if (isMobile) {
        initMuseumMobileFallback();
        return;
    }

    museumActive = true;
    stopBackgroundHearts();

    const canvas = document.getElementById('museum-canvas');

    // Optimized renderer settings
    museumRenderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true
    });
    museumRenderer.setSize(window.innerWidth, window.innerHeight);
    museumRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    museumRenderer.toneMapping = THREE.ACESFilmicToneMapping;
museumRenderer.toneMappingExposure = 0.95;
    museumRenderer.shadowMap.enabled = false;
    museumRenderer.sortObjects = false;

    museumScene = new THREE.Scene();
    museumScene.background = new THREE.Color(0x0d0d1a);
museumScene.fog = new THREE.Fog(0x0d0d1a, 12, 28); // plus loin = moins oppressant

    museumCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 50);
    // Start position: in front of south wall of room 1, facing INTO the room (north)
museumCamera.position.set(4, MUSEUM_PLAYER_HEIGHT, -0.6);

    // Face north (into the room, away from the wall behind)
museumYaw = 0;
    museumPitch = 0;
    museumVelX = 0;
    museumVelZ = 0;
    museumMoveState = { forward: false, backward: false, left: false, right: false };
    museumViewingPainting = null;
    museumNearestPainting = null;
    museumPointerLocked = false;
    museumPaintings = [];
    museumLastTime = 0;
    _museumProximityFrame = 0;

    buildMuseumRooms();
    buildMuseumPaintings();
    setupMuseumLighting();
    buildMuseumDecorations();
    initMuseumControls();

    // Cache DOM element
    _museumInteractEl = document.getElementById('museum-interact-prompt');

    // Show click prompt, hide crosshair
    document.getElementById('museum-click-prompt').style.display = 'flex';
    document.getElementById('museum-crosshair').style.display = 'none';
    _museumInteractEl.style.opacity = '0';
    document.getElementById('museum-painting-overlay').classList.remove('active');

    // Apply camera orientation IMMEDIATELY so first frame isn't facing wrong way
    _euler.set(museumPitch, museumYaw, 0);
    museumCamera.quaternion.setFromEuler(_euler);

    museumAnimate(0);
}

// ========== PROCEDURAL TEXTURES (no external files needed) ==========
function createWoodTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base wood color
    ctx.fillStyle = '#3d2b1f';
    ctx.fillRect(0, 0, size, size);

    // Wood grain lines
    for (let i = 0; i < 40; i++) {
        const y = Math.random() * size;
        const alpha = 0.05 + Math.random() * 0.1;
        ctx.strokeStyle = `rgba(60, 40, 20, ${alpha})`;
        ctx.lineWidth = 1 + Math.random() * 3;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < size; x += 10) {
            ctx.lineTo(x, y + Math.sin(x * 0.02) * 4 + (Math.random() - 0.5) * 2);
        }
        ctx.stroke();
    }

    // Subtle variation
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = `rgba(${30 + Math.random() * 40}, ${20 + Math.random() * 20}, ${10 + Math.random() * 15}, 0.15)`;
        ctx.fillRect(x, y, 2 + Math.random() * 4, 1 + Math.random() * 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function createVelvetFloorTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Rouge velours (plus clair -> pas noir en rendu)
    ctx.fillStyle = '#7a0018';
    ctx.fillRect(0, 0, size, size);

    // Fibres / variations
    for (let i = 0; i < 9000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const a = Math.random() * 0.06;
        const r = 180 + Math.random() * 40;
        const g = 0 + Math.random() * 10;
        const b = 20 + Math.random() * 25;
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.fillRect(x, y, 2, 2);
    }

    // “sheen” velours léger
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0.10)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}



function createWallTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Warm off-white / parchment
ctx.fillStyle = '#f5f6f8'; // blanc cassé froid, galerie premium
    ctx.fillRect(0, 0, size, size);

    // Subtle plaster texture
    for (let i = 0; i < 800; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const v = 220 + Math.random() * 30;
        ctx.fillStyle = `rgba(${v}, ${v - 5}, ${v - 15}, 0.06)`;
        ctx.fillRect(x, y, 1 + Math.random() * 4, 1 + Math.random() * 4);
    }

    // Very subtle horizontal brush strokes
    for (let i = 0; i < 20; i++) {
        const y = Math.random() * size;
        ctx.strokeStyle = `rgba(200, 190, 170, 0.04)`;
        ctx.lineWidth = 2 + Math.random() * 6;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y + (Math.random() - 0.5) * 8);
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function createCeilingTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, size, size);

    // Subtle coffered pattern
    const panelSize = size / 2;
    ctx.strokeStyle = 'rgba(200, 190, 170, 0.2)';
    ctx.lineWidth = 3;
    for (let x = 0; x <= size; x += panelSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
    }
    for (let y = 0; y <= size; y += panelSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    }

    // Noise
    for (let i = 0; i < 300; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const v = 230 + Math.random() * 20;
        ctx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.05)`;
        ctx.fillRect(x, y, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

// ========== ROOM CONSTRUCTION ==========
function buildMuseumRooms() {
    // MeshPhongMaterial = much faster than MeshStandardMaterial (no PBR overhead)
    const wallTex = createWallTexture();
    wallTex.repeat.set(2, 1);
    const wallMat = new THREE.MeshPhongMaterial({
        map: wallTex,
color: 0xf7f7fb,
        shininess: 5
    });

const floorTex = createVelvetFloorTexture();
floorTex.repeat.set(2.5, 2.5);

const floorMat = new THREE.MeshPhongMaterial({
    map: floorTex,
    color: 0xffffff,     // IMPORTANT : ne pas assombrir la texture
    shininess: 6,        // velours = peu brillant
    specular: 0x111111
});



    const ceilTex = createCeilingTexture();
    ceilTex.repeat.set(2, 2);
    const ceilMat = new THREE.MeshPhongMaterial({
        map: ceilTex,
        color: 0xf5f0e8,
        shininess: 2
    });

    const trimMat = new THREE.MeshPhongMaterial({
        color: 0xc9a84c,
        shininess: 80,
        specular: 0x665522
    });

    const baseboardMat = new THREE.MeshPhongMaterial({
        color: 0x3d2b1f,
        shininess: 15
    });

    // Store for reuse
    _sharedMaterials = { wallMat, floorMat, ceilMat, trimMat, baseboardMat };

    function addWall(w, h, d, x, y, z) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
        mesh.position.set(x, y, z);
        museumScene.add(mesh);
    }

    function addFloor(w, d, x, z) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0, z);
        museumScene.add(mesh);
    }

    function addCeil(w, d, x, z) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(x, 3.5, z);
        museumScene.add(mesh);
    }

    function addBaseboard(w, d, x, z) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), baseboardMat);
        mesh.position.set(x, 0.06, z);
        museumScene.add(mesh);
    }

    // Crown molding (top trim)
    function addCrown(w, d, x, z) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), trimMat);
        mesh.position.set(x, 3.42, z);
        museumScene.add(mesh);
    }

    // Room 1
    addWall(8, 3.5, 0.1, 4, 1.75, 0);
    addWall(0.1, 3.5, 10, 0, 1.75, -5);
    addWall(8, 3.5, 0.1, 4, 1.75, -10);
    addWall(0.1, 3.5, 3.5, 8, 1.75, -1.75);
    addWall(0.1, 3.5, 3.5, 8, 1.75, -8.25);
    addWall(0.1, 0.7, 3, 8, 3.15, -5);
    addFloor(8, 10, 4, -5);
    addCeil(8, 10, 4, -5);
    addBaseboard(8, 0.05, 4, 0.02);
    addBaseboard(0.05, 10, 0.02, -5);
    addBaseboard(8, 0.05, 4, -9.98);
    addCrown(8, 0.05, 4, 0.02);
    addCrown(0.05, 10, 0.02, -5);
    addCrown(8, 0.05, 4, -9.98);

    // Room 2
    addWall(12, 3.5, 0.1, 14, 1.75, -10);
    addWall(0.1, 3.5, 10, 20, 1.75, -5);
    addWall(7, 3.5, 0.1, 11.5, 1.75, 0);
    addWall(2, 3.5, 0.1, 19, 1.75, 0);
    addWall(3, 0.7, 0.1, 16.5, 3.15, 0);
    addFloor(12, 10, 14, -5);
    addCeil(12, 10, 14, -5);
    addBaseboard(12, 0.05, 14, -9.98);
    addBaseboard(0.05, 10, 19.98, -5);
    addCrown(12, 0.05, 14, -9.98);
    addCrown(0.05, 10, 19.98, -5);

    // Room 3
    addWall(0.1, 3.5, 7, 20, 1.75, 3.5);
    addWall(8, 3.5, 0.1, 16, 1.75, 7);
    addWall(0.1, 3.5, 7, 12, 1.75, 3.5);
    addFloor(8, 7, 16, 3.5);
    addCeil(8, 7, 16, 3.5);
    addBaseboard(0.05, 7, 19.98, 3.5);
    addBaseboard(8, 0.05, 16, 6.98);
    addBaseboard(0.05, 7, 12.02, 3.5);
    addCrown(0.05, 7, 19.98, 3.5);
    addCrown(8, 0.05, 16, 6.98);
    addCrown(0.05, 7, 12.02, 3.5);
}

function makeLabelTexture(text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');

  // fond blanc cassé
  ctx.fillStyle = '#f7f7f9';
  ctx.fillRect(0, 0, c.width, c.height);

  // trait fin
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.strokeRect(10, 10, c.width - 20, c.height - 20);

  ctx.fillStyle = '#111';
  ctx.font = '28px Arial';
  ctx.fillText(text, 24, 56);

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.font = '18px Arial';
ctx.fillText('Collection privée', 24, 94);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ========== DECORATIONS ==========
function buildMuseumDecorations() {
    // Benches in center of rooms
    const benchMat = new THREE.MeshPhongMaterial({
    color: 0x4b2e1f,      // noyer chaud
    shininess: 25,
    specular: 0x22160f
});

const benchLegMat = new THREE.MeshPhongMaterial({
    color: 0xc9a84c,      // laiton / doré
    shininess: 90,
    specular: 0x665522
});


    function addCeilingPanel(x, z, w, d) {
  const panelMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0xfff1dd,         // blanc chaud galerie
emissiveIntensity: 0.28,
    shininess: 0
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, d), panelMat);
  panel.rotation.x = Math.PI / 2;
  panel.position.set(x, 3.45, z);
  museumScene.add(panel);
}

// Room 1 panels
addCeilingPanel(4, -3.5, 2.2, 1.2);
addCeilingPanel(4, -6.5, 2.2, 1.2);

// Room 2 panels
addCeilingPanel(14, -3.5, 2.6, 1.2);
addCeilingPanel(14, -6.5, 2.6, 1.2);

// Room 3 panels
addCeilingPanel(16, 2.3, 2.2, 1.1);
addCeilingPanel(16, 4.6, 2.2, 1.1);

const pedestalMat = new THREE.MeshPhongMaterial({
    color: 0xf7f7fb,
    shininess: 35,
    specular: 0x222222
});
const sculptureMat = new THREE.MeshPhongMaterial({
    color: 0xf2f2f6,
    shininess: 60,
    specular: 0x444444
});

function addPedestal(x, z) {
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.6), pedestalMat);
  pedestal.position.set(x, 0.45, z);
  museumScene.add(pedestal);

  // sculpture simple
  const sculpt = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), sculptureMat);
  sculpt.position.set(x, 1.05, z);
  museumScene.add(sculpt);

  // mini spot sur sculpture
  const spot = new THREE.PointLight(0xffffff, 0.35, 5, 2.0);
  spot.position.set(x, 2.2, z);
  museumScene.add(spot);
}

addPedestal(2.2, -5.0);
addPedestal(14.0, -5.0);
addPedestal(18.0, 3.2);

    function addBench(x, z, rotY) {
        const group = new THREE.Group();
        // Seat
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.5), benchMat);
        seat.position.set(0, 0.45, 0);
        group.add(seat);
        // Legs
        const legGeom = new THREE.BoxGeometry(0.06, 0.45, 0.06);
        const positions = [[-0.8, 0.225, -0.18], [0.8, 0.225, -0.18], [-0.8, 0.225, 0.18], [0.8, 0.225, 0.18]];
        positions.forEach(p => {
            const leg = new THREE.Mesh(legGeom, benchLegMat);
            leg.position.set(p[0], p[1], p[2]);
            group.add(leg);
        });
        group.position.set(x, 0, z);
        group.rotation.y = rotY || 0;
        museumScene.add(group);
    }

    addBench(4, -5, 0);
    addBench(14, -5, 0);
    addBench(16, 3.5, 0);

    // Velvet rope stanchions near some paintings
    const ropeMat = new THREE.MeshPhongMaterial({ color: 0x8b0000, shininess: 15 });
    const poleMat = new THREE.MeshPhongMaterial({ color: 0xc9a84c, shininess: 80, specular: 0x665522 });

    function addStanchion(x, z) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 6), poleMat);
        pole.position.set(x, 0.45, z);
        museumScene.add(pole);
        // Top sphere
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), poleMat);
        top.position.set(x, 0.92, z);
        museumScene.add(top);
        // Base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.05, 6), poleMat);
        base.position.set(x, 0.025, z);
        museumScene.add(base);
    }

    function addRopeSection(x1, z1, x2, z2) {
        addStanchion(x1, z1);
        addStanchion(x2, z2);
        // Rope (catenary approximation with a tube)
        const midX = (x1 + x2) / 2;
        const midZ = (z1 + z2) / 2;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len = Math.sqrt(dx * dx + dz * dz);
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, len, 4), ropeMat);
        rope.position.set(midX, 0.8, midZ);
        rope.rotation.z = Math.PI / 2;
        rope.rotation.y = Math.atan2(dz, dx);
        museumScene.add(rope);
    }

    // Ropes in front of the large final painting
    addRopeSection(14.5, 5.8, 17.5, 5.8);

    // Small decorative plants (simple geometry)
    const potMat = new THREE.MeshPhongMaterial({ color: 0x4a3728, shininess: 5 });
    const plantMat = new THREE.MeshPhongMaterial({ color: 0x2d5016, shininess: 3 });

   function addModernPlant(x, z, scale = 1) {
    const group = new THREE.Group();

    // Pot
    const potMat = new THREE.MeshPhongMaterial({ 
        color: 0x111111,
        shininess: 30 
    });

    const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18 * scale, 0.22 * scale, 0.4 * scale, 16),
        potMat
    );
    pot.position.y = 0.2 * scale;
    group.add(pot);

    // Tiges
    const stemMat = new THREE.MeshPhongMaterial({ color: 0x2f5d2f });

    for (let i = 0; i < 5; i++) {
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.7 * scale, 8),
            stemMat
        );
        stem.position.set(
            (Math.random() - 0.5) * 0.1,
            0.6 * scale,
            (Math.random() - 0.5) * 0.1
        );
        stem.rotation.z = (Math.random() - 0.5) * 0.4;
        group.add(stem);

        const leaf = new THREE.Mesh(
            new THREE.SphereGeometry(0.15 * scale, 8, 8),
            new THREE.MeshPhongMaterial({ color: 0x3c8c3c })
        );
        leaf.position.set(
            stem.position.x,
            1.0 * scale,
            stem.position.z
        );
        group.add(leaf);
    }

    group.position.set(x, 0, z);
    museumScene.add(group);

    // petite lumière douce
    const plantLight = new THREE.PointLight(0xffffff, 0.15, 4);
    plantLight.position.set(x, 1.2 * scale, z);
    museumScene.add(plantLight);
}


addModernPlant(0.8, -0.8, 1.2);
addModernPlant(7.2, -0.8, 1.2);

addModernPlant(12.5, 0.8, 1.3);
addModernPlant(19.2, 0.8, 1.3);

addModernPlant(12.6, 6.2, 1.5);

}

// ========== LIGHTING ==========
function setupMuseumLighting() {
  // Plus de base, sans cramer
  museumScene.add(new THREE.AmbientLight(0xffffff, 0.35));
  museumScene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a22, 0.22));

  // Grands points lumineux plafond (style rails)
  function addCeilingLight(x, z, intensity = 0.75) {
    const p = new THREE.PointLight(0xffffff, intensity, 18, 2.0);
    p.position.set(x, 3.25, z);
    museumScene.add(p);
    return p;
  }

  addCeilingLight(4, -3.5, 0.9);
  addCeilingLight(4, -6.5, 0.85);

  addCeilingLight(14, -3.5, 0.95);
  addCeilingLight(14, -6.5, 0.9);

  addCeilingLight(16, 2.3, 0.85);
  addCeilingLight(16, 4.6, 0.85);

  // Petites “wash lights” sur murs (pour éviter murs noirs)
  function addWallWash(x, y, z, color = 0xffffff, intensity = 0.25) {
    const w = new THREE.PointLight(color, intensity, 8, 2.0);
    w.position.set(x, y, z);
    museumScene.add(w);
  }

  // Room 1
  addWallWash(0.8, 2.2, -3.0);
  addWallWash(0.8, 2.2, -7.0);
  addWallWash(4.0, 2.2, -9.2);

  // Room 2
  addWallWash(11.0, 2.2, -9.2);
  addWallWash(17.0, 2.2, -9.2);
  addWallWash(19.2, 2.2, -5.0);

  // Room 3
  addWallWash(12.8, 2.2, 3.5);
  addWallWash(16.0, 2.2, 6.2);
}


// ========== PAINTINGS ==========
function buildMuseumPaintings() {
    const loader = new THREE.TextureLoader();

    // Ornate frame material (gold, shiny)
    const frameMat = new THREE.MeshPhongMaterial({
        color: 0xc9a84c,
        shininess: 90,
        specular: 0x665522
    });
    // Dark inner mat material
    const matBoardMat = new THREE.MeshPhongMaterial({
        color: 0x2a2a2a,
        shininess: 2
    });

    PAINTINGS_DATA.forEach((data, i) => {
        const group = new THREE.Group();
        const [pw, ph] = data.size;

        // Painting canvas
        const canvasGeom = new THREE.PlaneGeometry(pw, ph);
        const canvasMat = new THREE.MeshBasicMaterial({
    color: 0xffffff
});


        loader.load(data.image, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = false;
            canvasMat.map = tex;
            canvasMat.color.set(0xffffff);
            canvasMat.needsUpdate = true;
        }, undefined, () => { /* keep placeholder */ });

        group.add(new THREE.Mesh(canvasGeom, canvasMat));
        // Label (cartel) sous le tableau
const labelTex = makeLabelTexture(data.title);
const labelMat = new THREE.MeshPhongMaterial({ map: labelTex, shininess: 5 });
const label = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.28), labelMat);
label.position.set(0, -ph / 2 - 0.28, 0.02);
group.add(label);


        // Mat board (dark border inside frame)
        const matPadding = 0.06;
        const matGeom = new THREE.PlaneGeometry(pw + matPadding * 2, ph + matPadding * 2);
        const matMesh = new THREE.Mesh(matGeom, matBoardMat);
        matMesh.position.z = -0.005;
        group.add(matMesh);

        // Ornate frame bars
        const fd = 0.08, fw = 0.1;
        const hBarGeom = new THREE.BoxGeometry(pw + fw * 2 + matPadding * 2, fw, fd);
        const vBarGeom = new THREE.BoxGeometry(fw, ph + fw * 2 + matPadding * 2, fd);

        const topBar = new THREE.Mesh(hBarGeom, frameMat);
        topBar.position.set(0, ph / 2 + matPadding + fw / 2, fd / 2 - 0.015);
        group.add(topBar);

        const botBar = new THREE.Mesh(hBarGeom, frameMat);
        botBar.position.set(0, -ph / 2 - matPadding - fw / 2, fd / 2 - 0.015);
        group.add(botBar);

        const leftBar = new THREE.Mesh(vBarGeom, frameMat);
        leftBar.position.set(-pw / 2 - matPadding - fw / 2, 0, fd / 2 - 0.015);
        group.add(leftBar);

        const rightBar = new THREE.Mesh(vBarGeom, frameMat);
        rightBar.position.set(pw / 2 + matPadding + fw / 2, 0, fd / 2 - 0.015);
        group.add(rightBar);

        // Corner ornaments (small spheres at frame corners)
        const cornerGeom = new THREE.SphereGeometry(0.04, 6, 6);
        const halfW = pw / 2 + matPadding + fw / 2;
        const halfH = ph / 2 + matPadding + fw / 2;
        [[-halfW, halfH], [halfW, halfH], [-halfW, -halfH], [halfW, -halfH]].forEach(([cx, cy]) => {
            const corner = new THREE.Mesh(cornerGeom, frameMat);
            corner.position.set(cx, cy, fd / 2);
            group.add(corner);
        });

        group.position.set(data.pos[0], data.pos[1], data.pos[2]);
        group.rotation.y = data.rotY;

        museumScene.add(group);
        museumPaintings.push({ group, data, canvas: group.children[0] });
    });
}

// ========== CONTROLS ==========
function initMuseumControls() {
    const canvas = document.getElementById('museum-canvas');
    const clickPrompt = document.getElementById('museum-click-prompt');

    museumStarted = false;
    museumDragging = false;
    clickPrompt.addEventListener('click', museumPromptClick);
    canvas.addEventListener('click', museumCanvasClick);
    canvas.addEventListener('mousedown', museumMouseDown);
    document.addEventListener('mousemove', museumMouseHandler);
    document.addEventListener('mouseup', museumMouseUp);
    document.addEventListener('pointerlockchange', museumPointerLockChange);
    document.addEventListener('webkitpointerlockchange', museumPointerLockChange);
    document.addEventListener('keydown', museumKeyDown);
    document.addEventListener('keyup', museumKeyUp);
}

function museumPromptClick() {
    if (!museumActive) return;
    document.getElementById('museum-click-prompt').style.display = 'none';
    museumStarted = true;
    const canvas = document.getElementById('museum-canvas');
    if ('requestPointerLock' in canvas) {
        canvas.requestPointerLock();
    }
}

function museumCanvasClick() {
    if (!museumActive) return;
    if (!museumPointerLocked) {
        const canvas = document.getElementById('museum-canvas');
        if ('requestPointerLock' in canvas) {
            canvas.requestPointerLock();
        }
    }
}

function museumPointerLockChange() {
    const canvas = document.getElementById('museum-canvas');
    museumPointerLocked = (document.pointerLockElement || document.webkitPointerLockElement) === canvas;
    document.getElementById('museum-crosshair').style.display = museumPointerLocked ? 'block' : 'none';
    if (!museumPointerLocked) {
        document.getElementById('museum-click-prompt').style.display = museumStarted ? 'none' : 'flex';
    } else {
        document.getElementById('museum-click-prompt').style.display = 'none';
    }
}

// Single handler for both pointer-lock mouse and drag
function museumMouseHandler(e) {
    if (!museumActive || !museumStarted) return;

    if (museumPointerLocked) {
        museumYaw -= e.movementX * MUSEUM_MOUSE_SENS;
        museumPitch -= e.movementY * MUSEUM_MOUSE_SENS;
        if (museumPitch > 1.04) museumPitch = 1.04;
        else if (museumPitch < -1.04) museumPitch = -1.04;
    } else if (museumDragging) {
        const dx = e.clientX - museumLastMouseX;
        const dy = e.clientY - museumLastMouseY;
        museumYaw -= dx * MUSEUM_MOUSE_SENS * 2;
        museumPitch -= dy * MUSEUM_MOUSE_SENS * 2;
        if (museumPitch > 1.04) museumPitch = 1.04;
        else if (museumPitch < -1.04) museumPitch = -1.04;
        museumLastMouseX = e.clientX;
        museumLastMouseY = e.clientY;
    }
}

function museumMouseDown(e) {
    if (!museumActive || !museumStarted || museumPointerLocked) return;
    museumDragging = true;
    museumLastMouseX = e.clientX;
    museumLastMouseY = e.clientY;
}

function museumMouseUp() {
    museumDragging = false;
}

function museumKeyDown(e) {
    if (!museumActive || !museumStarted) return;
    switch (e.code) {
        case 'KeyW': case 'KeyZ': case 'ArrowUp':
            e.preventDefault(); museumMoveState.forward = true; break;
        case 'KeyS': case 'ArrowDown':
            e.preventDefault(); museumMoveState.backward = true; break;
        case 'KeyA': case 'KeyQ': case 'ArrowLeft':
            e.preventDefault(); museumMoveState.left = true; break;
        case 'KeyD': case 'ArrowRight':
            e.preventDefault(); museumMoveState.right = true; break;
        case 'KeyE':
            e.preventDefault();
            if (museumViewingPainting) closePaintingView();
            else if (museumNearestPainting) viewPainting(museumNearestPainting);
            break;
        case 'Escape':
            if (museumViewingPainting) closePaintingView();
            break;
    }
}

function museumKeyUp(e) {
    if (!museumActive) return;
    switch (e.code) {
        case 'KeyW': case 'KeyZ': case 'ArrowUp': museumMoveState.forward = false; break;
        case 'KeyS': case 'ArrowDown': museumMoveState.backward = false; break;
        case 'KeyA': case 'KeyQ': case 'ArrowLeft': museumMoveState.left = false; break;
        case 'KeyD': case 'ArrowRight': museumMoveState.right = false; break;
    }
}

// ========== MOVEMENT (SMOOTHED) ==========
function updateMuseumMovement(dt) {
    if (!museumStarted || museumViewingPainting) {
        museumVelX = 0;
        museumVelZ = 0;
        return;
    }

    const speed = MUSEUM_MOVE_SPEED;
    const fx = -Math.sin(museumYaw), fz = -Math.cos(museumYaw);
    const rx = Math.cos(museumYaw), rz = -Math.sin(museumYaw);

    // Calculate target velocity
    let targetVx = 0, targetVz = 0;
    if (museumMoveState.forward) { targetVx += fx * speed; targetVz += fz * speed; }
    if (museumMoveState.backward) { targetVx -= fx * speed; targetVz -= fz * speed; }
    if (museumMoveState.left) { targetVx -= rx * speed; targetVz -= rz * speed; }
    if (museumMoveState.right) { targetVx += rx * speed; targetVz += rz * speed; }

    // Normalize diagonal movement
    if (targetVx !== 0 && targetVz !== 0) {
        const len = Math.sqrt(targetVx * targetVx + targetVz * targetVz);
        if (len > speed) {
            const scale = speed / len;
            targetVx *= scale;
            targetVz *= scale;
        }
    }

    // Smooth interpolation toward target velocity (eliminates jitter/teleportation)
    const lerp = 1 - Math.pow(1 - MUSEUM_MOVE_LERP, dt * 60);
    museumVelX += (targetVx - museumVelX) * lerp;
    museumVelZ += (targetVz - museumVelZ) * lerp;

    // Dead zone - stop tiny drifting
    if (Math.abs(museumVelX) < 0.01 && Math.abs(museumVelZ) < 0.01) {
        museumVelX = 0;
        museumVelZ = 0;
        return;
    }

    const dx = museumVelX * dt;
    const dz = museumVelZ * dt;

    const cx = museumCamera.position.x, cz = museumCamera.position.z;

    // Slide collision: try X and Z independently for smooth wall sliding
    if (!museumCollision(cx + dx, cz)) {
        museumCamera.position.x = cx + dx;
    } else {
        museumVelX *= -0.1; // Slight bounce-back to prevent sticking
    }
    if (!museumCollision(museumCamera.position.x, cz + dz)) {
        museumCamera.position.z = cz + dz;
    } else {
        museumVelZ *= -0.1;
    }
}

function museumCollision(x, z) {
    for (let i = 0; i < MUSEUM_ZONES.length; i++) {
        const zone = MUSEUM_ZONES[i];
        if (x >= zone.xMin && x <= zone.xMax && z >= zone.zMin && z <= zone.zMax) {
            return false;
        }
    }
    return true;
}

// ========== PAINTING INTERACTION ==========
function updatePaintingProximity() {
    if (museumViewingPainting) return;

    let nearest = null;
    let nearestDist = MUSEUM_INTERACT_DIST;
    const cx = museumCamera.position.x, cz = museumCamera.position.z;

    for (let i = 0; i < museumPaintings.length; i++) {
        const p = museumPaintings[i];
        const pdx = cx - p.data.pos[0];
        const pdz = cz - p.data.pos[2];
        const dist = pdx * pdx + pdz * pdz;
        if (dist < nearestDist * nearestDist) {
            nearest = p;
            nearestDist = Math.sqrt(dist);
        }
    }

    if (nearest !== museumNearestPainting) {
        museumNearestPainting = nearest;
        _museumInteractEl.style.opacity = nearest ? '1' : '0';
    }
}

function viewPainting(painting) {
    museumViewingPainting = painting;
    const overlay = document.getElementById('museum-painting-overlay');
    overlay.classList.add('active');

    document.getElementById('museum-painting-zoom-img').src = painting.data.image;

    const msg = document.getElementById('museum-painting-message');
    msg.textContent = painting.data.message;
    msg.classList.remove('visible');
    setTimeout(() => msg.classList.add('visible'), 400);

    if (document.pointerLockElement) document.exitPointerLock();
}

function closePaintingView() {
    document.getElementById('museum-painting-overlay').classList.remove('active');
    document.getElementById('museum-painting-message').classList.remove('visible');
    museumViewingPainting = null;
    museumStarted = true; // on s'assure que le mouvement/caméra reste actif


    // Reprendre le contrôle caméra
    const canvas = document.getElementById('museum-canvas');
    if (museumActive && 'requestPointerLock' in canvas) {
        try { canvas.requestPointerLock(); } catch (e) { /* drag mode fallback */ }
    }
}

// ========== RENDER LOOP ==========
const _euler = new (typeof THREE !== 'undefined' ? THREE.Euler : Object)(0, 0, 0, 'YXZ');

// Fixed timestep for physics (prevents teleportation on lag spikes)
const MUSEUM_FIXED_DT = 1 / 60;
let museumAccumulator = 0;

function museumAnimate(time) {
    if (!museumActive) return;
    museumAnimationId = requestAnimationFrame(museumAnimate);

    // Calculate raw delta, cap at 100ms to prevent huge jumps after tab switch
    let rawDt = (time - museumLastTime) * 0.001;
    museumLastTime = time;

    // First frame or returning from background tab
    if (rawDt <= 0 || rawDt > 0.1) {
        rawDt = MUSEUM_FIXED_DT;
    }

    // Fixed timestep accumulator (prevents physics teleportation)
    museumAccumulator += rawDt;

    // Process physics in fixed steps (max 3 steps per frame to prevent spiral of death)
    let steps = 0;
    while (museumAccumulator >= MUSEUM_FIXED_DT && steps < 3) {
        updateMuseumMovement(MUSEUM_FIXED_DT);
        museumAccumulator -= MUSEUM_FIXED_DT;
        steps++;
    }

    // If we still have leftover, just consume it (prevents accumulation)
    if (museumAccumulator > MUSEUM_FIXED_DT) {
        museumAccumulator = 0;
    }

    // Update camera orientation every frame (reuse euler object)
    if (museumStarted && !museumViewingPainting) {
        _euler.set(museumPitch, museumYaw, 0);
        museumCamera.quaternion.setFromEuler(_euler);
    }

    // Check painting proximity every 6 frames (~10 Hz at 60fps)
    if (++_museumProximityFrame >= 6) {
        _museumProximityFrame = 0;
        updatePaintingProximity();
    }

    museumRenderer.render(museumScene, museumCamera);
}

// ========== CLEANUP ==========
function disposeMuseum() {
    museumActive = false;

    if (museumAnimationId) {
        cancelAnimationFrame(museumAnimationId);
        museumAnimationId = null;
    }

    if (document.pointerLockElement) document.exitPointerLock();

    const canvas = document.getElementById('museum-canvas');
    if (canvas) {
        canvas.removeEventListener('click', museumCanvasClick);
        canvas.removeEventListener('mousedown', museumMouseDown);
    }
    const clickPrompt = document.getElementById('museum-click-prompt');
    if (clickPrompt) clickPrompt.removeEventListener('click', museumPromptClick);
    document.removeEventListener('pointerlockchange', museumPointerLockChange);
    document.removeEventListener('webkitpointerlockchange', museumPointerLockChange);
    document.removeEventListener('mousemove', museumMouseHandler);
    document.removeEventListener('mouseup', museumMouseUp);
    document.removeEventListener('keydown', museumKeyDown);
    document.removeEventListener('keyup', museumKeyUp);
    window.removeEventListener('resize', museumResize);

    if (museumScene) {
        museumScene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
                } else {
                    if (obj.material.map) obj.material.map.dispose();
                    obj.material.dispose();
                }
            }
        });
    }

    if (museumRenderer) {
        museumRenderer.dispose();
        museumRenderer = null;
    }

    museumScene = null;
    museumCamera = null;
    museumPaintings = [];
    museumViewingPainting = null;
    museumNearestPainting = null;
    _museumInteractEl = null;
    _sharedGeometries = {};
    _sharedMaterials = {};
    museumMoveState = { forward: false, backward: false, left: false, right: false };
    museumVelX = 0;
    museumVelZ = 0;
    museumAccumulator = 0;

    startBackgroundHearts();
}

function exitMuseum() {
    if (museumViewingPainting) {
        closePaintingView();
        return;
    }
    if (document.pointerLockElement) document.exitPointerLock();
    goToScreen('screen-celebrate');
}

// ========== MOBILE FALLBACK ==========
let mobilePaintingIndex = 0;

function initMuseumMobileFallback() {
    museumActive = true;
    stopBackgroundHearts();
    mobilePaintingIndex = 0;

    const screen = document.getElementById('screen-museum');
    document.getElementById('museum-canvas').style.display = 'none';
    document.getElementById('museum-click-prompt').style.display = 'none';
    document.getElementById('museum-crosshair').style.display = 'none';
    document.getElementById('museum-interact-prompt').style.display = 'none';

    let gallery = document.getElementById('museum-mobile-gallery-el');
    if (!gallery) {
        gallery = document.createElement('div');
        gallery.id = 'museum-mobile-gallery-el';
        gallery.className = 'museum-mobile-gallery';
        screen.appendChild(gallery);
    }
    gallery.style.display = 'flex';
    renderMobileGallery();
}

function renderMobileGallery() {
    const gallery = document.getElementById('museum-mobile-gallery-el');
    const p = PAINTINGS_DATA[mobilePaintingIndex];
    gallery.innerHTML = `
        <div class="museum-mobile-card">
            <img src="${p.image}" alt="Tableau ${mobilePaintingIndex + 1}"
                 onerror="this.style.background='#${PLACEHOLDER_COLORS[mobilePaintingIndex].toString(16).padStart(6,'0')}';this.style.width='280px';this.style.height='200px'">
            <p class="museum-mobile-message">${p.message}</p>
            <p class="museum-mobile-counter">${mobilePaintingIndex + 1} / ${PAINTINGS_DATA.length}</p>
            <div class="museum-mobile-nav">
                ${mobilePaintingIndex > 0 ? '<button class="btn btn-small" onclick="mobilePrev()">Precedent</button>' : ''}
                ${mobilePaintingIndex < PAINTINGS_DATA.length - 1
                    ? '<button class="btn btn-small" onclick="mobileNext()">Suivant</button>'
                    : '<button class="btn btn-small" onclick="exitMuseum()">Terminer</button>'}
            </div>
        </div>
    `;
}

function mobileNext() {
    if (mobilePaintingIndex < PAINTINGS_DATA.length - 1) { mobilePaintingIndex++; renderMobileGallery(); }
}

function mobilePrev() {
    if (mobilePaintingIndex > 0) { mobilePaintingIndex--; renderMobileGallery(); }
}

// ========== RESIZE ==========
function museumResize() {
    if (!museumActive || !museumRenderer || !museumCamera) return;
    museumCamera.aspect = window.innerWidth / window.innerHeight;
    museumCamera.updateProjectionMatrix();
    museumRenderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', museumResize);
