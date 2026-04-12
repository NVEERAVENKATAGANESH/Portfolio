'use strict';

/* ── HERO SPHERE (Three.js wireframe) ── */
function initHeroSphere(){
  const container = document.getElementById('heroSphere');
  if(!container || typeof THREE === 'undefined') return;

  const W = container.offsetWidth  || 280;
  const H = container.offsetHeight || 260;

  // Scene + camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.z = 3.2;

  // Renderer — transparent background so hero gradient shows through
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Outer wireframe icosahedron (main sphere)
  const outerGeo   = new THREE.IcosahedronGeometry(1, 5);
  const outerEdges = new THREE.EdgesGeometry(outerGeo);
  const outerMat   = new THREE.LineBasicMaterial({
    color: 0xa5b4fc,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
  });
  const outerMesh = new THREE.LineSegments(outerEdges, outerMat);
  scene.add(outerMesh);

  // Inner counter-rotating icosahedron (depth / glow)
  const innerGeo   = new THREE.IcosahedronGeometry(0.62, 3);
  const innerEdges = new THREE.EdgesGeometry(innerGeo);
  const innerMat   = new THREE.LineBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
  });
  const innerMesh = new THREE.LineSegments(innerEdges, innerMat);
  scene.add(innerMesh);

  // Floating dot particles orbiting the sphere
  const pCount    = 220;
  const pPositions = new Float32Array(pCount * 3);
  for(let i = 0; i < pCount; i++){
    const r     = 1.25 + Math.random() * 0.75;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    pPositions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pPositions[i*3+2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xa5b4fc,
    size: 0.022,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // Mouse parallax
  let mx = 0, my = 0, tx = 0, ty = 0;
  const onMouseMove = e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = -(e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('mousemove', onMouseMove, {passive:true});

  // Resize
  const onResize = () => {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  // ── Orbiting spaceship — high-detail hex-fuselage interceptor ───────────
  const _sv = (() => {
    const v = [];
    const L = (ax,ay,az,bx,by,bz) => v.push(ax,ay,az,bx,by,bz);
    // ── Nose cone: tip → hex ring B ──
    L(1.05,0,0, 0.70, 0.110, 0    ); L(1.05,0,0, 0.70, 0.055, 0.095);
    L(1.05,0,0, 0.70,-0.055, 0.095); L(1.05,0,0, 0.70,-0.110, 0    );
    L(1.05,0,0, 0.70,-0.055,-0.095); L(1.05,0,0, 0.70, 0.055,-0.095);
    // ── Station B ring  x=0.70 r=0.11 ──
    L(0.70, 0.110, 0,    0.70, 0.055, 0.095); L(0.70, 0.055, 0.095, 0.70,-0.055, 0.095);
    L(0.70,-0.055, 0.095, 0.70,-0.110, 0   ); L(0.70,-0.110, 0,    0.70,-0.055,-0.095);
    L(0.70,-0.055,-0.095, 0.70, 0.055,-0.095); L(0.70, 0.055,-0.095, 0.70, 0.110, 0   );
    // ── Station C ring  x=0.30 r=0.16 ──
    L(0.30, 0.160, 0,    0.30, 0.080, 0.139); L(0.30, 0.080, 0.139, 0.30,-0.080, 0.139);
    L(0.30,-0.080, 0.139, 0.30,-0.160, 0   ); L(0.30,-0.160, 0,    0.30,-0.080,-0.139);
    L(0.30,-0.080,-0.139, 0.30, 0.080,-0.139); L(0.30, 0.080,-0.139, 0.30, 0.160, 0   );
    // ── Station D ring  x=-0.15 r=0.19 ──
    L(-0.15, 0.190, 0,   -0.15, 0.095, 0.165); L(-0.15, 0.095, 0.165,-0.15,-0.095, 0.165);
    L(-0.15,-0.095, 0.165,-0.15,-0.190, 0   ); L(-0.15,-0.190, 0,   -0.15,-0.095,-0.165);
    L(-0.15,-0.095,-0.165,-0.15, 0.095,-0.165); L(-0.15, 0.095,-0.165,-0.15, 0.190, 0   );
    // ── Station E ring  x=-0.55 r=0.16 ──
    L(-0.55, 0.160, 0,   -0.55, 0.080, 0.139); L(-0.55, 0.080, 0.139,-0.55,-0.080, 0.139);
    L(-0.55,-0.080, 0.139,-0.55,-0.160, 0   ); L(-0.55,-0.160, 0,   -0.55,-0.080,-0.139);
    L(-0.55,-0.080,-0.139,-0.55, 0.080,-0.139); L(-0.55, 0.080,-0.139,-0.55, 0.160, 0   );
    // ── Station F ring  x=-0.88 r=0.12 ──
    L(-0.88, 0.120, 0,   -0.88, 0.060, 0.104); L(-0.88, 0.060, 0.104,-0.88,-0.060, 0.104);
    L(-0.88,-0.060, 0.104,-0.88,-0.120, 0   ); L(-0.88,-0.120, 0,   -0.88,-0.060,-0.104);
    L(-0.88,-0.060,-0.104,-0.88, 0.060,-0.104); L(-0.88, 0.060,-0.104,-0.88, 0.120, 0   );
    // ── Stringers B→C ──
    L(0.70, 0.110, 0,    0.30, 0.160, 0   ); L(0.70, 0.055, 0.095, 0.30, 0.080, 0.139);
    L(0.70,-0.055, 0.095, 0.30,-0.080, 0.139); L(0.70,-0.110, 0,    0.30,-0.160, 0   );
    L(0.70,-0.055,-0.095, 0.30,-0.080,-0.139); L(0.70, 0.055,-0.095, 0.30, 0.080,-0.139);
    // ── Stringers C→D ──
    L(0.30, 0.160, 0,   -0.15, 0.190, 0   ); L(0.30, 0.080, 0.139,-0.15, 0.095, 0.165);
    L(0.30,-0.080, 0.139,-0.15,-0.095, 0.165); L(0.30,-0.160, 0,   -0.15,-0.190, 0   );
    L(0.30,-0.080,-0.139,-0.15,-0.095,-0.165); L(0.30, 0.080,-0.139,-0.15, 0.095,-0.165);
    // ── Stringers D→E ──
    L(-0.15, 0.190, 0,   -0.55, 0.160, 0   ); L(-0.15, 0.095, 0.165,-0.55, 0.080, 0.139);
    L(-0.15,-0.095, 0.165,-0.55,-0.080, 0.139); L(-0.15,-0.190, 0,   -0.55,-0.160, 0   );
    L(-0.15,-0.095,-0.165,-0.55,-0.080,-0.139); L(-0.15, 0.095,-0.165,-0.55, 0.080,-0.139);
    // ── Stringers E→F ──
    L(-0.55, 0.160, 0,   -0.88, 0.120, 0   ); L(-0.55, 0.080, 0.139,-0.88, 0.060, 0.104);
    L(-0.55,-0.080, 0.139,-0.88,-0.060, 0.104); L(-0.55,-0.160, 0,   -0.88,-0.120, 0   );
    L(-0.55,-0.080,-0.139,-0.88,-0.060,-0.104); L(-0.55, 0.080,-0.139,-0.88, 0.060,-0.104);
    // ── Cockpit canopy ──
    L(0.70, 0.110, 0,    0.62, 0.280, 0   ); // A-post
    L(0.62, 0.280, 0,    0.48, 0.250, 0.09); L(0.62, 0.280, 0,    0.48, 0.250,-0.09);
    L(0.48, 0.250, 0.09, 0.48, 0.250,-0.09); // mid arch
    L(0.48, 0.250, 0.09, 0.32, 0.220, 0   ); L(0.48, 0.250,-0.09, 0.32, 0.220, 0   );
    L(0.32, 0.220, 0,    0.30, 0.160, 0   ); // rear post
    L(0.70, 0.055, 0.095, 0.48, 0.250, 0.09); L(0.70, 0.055,-0.095, 0.48, 0.250,-0.09);
    // ── Dorsal spine fin ──
    L(-0.15, 0.190, 0,    0.00, 0.340, 0   ); L(0.00, 0.340, 0,   -0.42, 0.380, 0   );
    L(-0.42, 0.380, 0,   -0.82, 0.200, 0   ); L(-0.82, 0.200, 0,  -0.88, 0.120, 0   );
    L(-0.15, 0.190, 0,   -0.42, 0.380, 0   ); // diagonal brace
    // ── Canard foreplanes ──
    L(0.70, 0.055, 0.095, 0.42, 0.010, 0.33); L(0.42, 0.010, 0.33,  0.30,-0.050, 0.18);
    L(0.70, 0.055,-0.095, 0.42, 0.010,-0.33); L(0.42, 0.010,-0.33,  0.30,-0.050,-0.18);
    // ── Delta wing — right (+z) ──
    L(0.30,-0.080, 0.139,-0.22, 0.010, 1.05); // leading edge
    L(-0.22, 0.010, 1.05,-0.88,-0.060, 0.104); // trailing edge
    L(-0.15,-0.095, 0.165,-0.18, 0.000, 0.62); L(-0.18, 0.000, 0.62,-0.22, 0.010, 1.05); // mid rib
    L(0.05,-0.060, 0.38, -0.60,-0.020, 0.62); // forward spar
    // Winglet right
    L(-0.22, 0.010, 1.05,-0.35, 0.240, 0.98); L(-0.35, 0.240, 0.98,-0.65, 0.080, 1.00);
    L(-0.65, 0.080, 1.00,-0.22, 0.010, 1.05);
    // ── Delta wing — left (-z) ──
    L(0.30,-0.080,-0.139,-0.22, 0.010,-1.05);
    L(-0.22, 0.010,-1.05,-0.88,-0.060,-0.104);
    L(-0.15,-0.095,-0.165,-0.18, 0.000,-0.62); L(-0.18, 0.000,-0.62,-0.22, 0.010,-1.05);
    L(0.05,-0.060,-0.38, -0.60,-0.020,-0.62);
    // Winglet left
    L(-0.22, 0.010,-1.05,-0.35, 0.240,-0.98); L(-0.35, 0.240,-0.98,-0.65, 0.080,-1.00);
    L(-0.65, 0.080,-1.00,-0.22, 0.010,-1.05);
    // ── Engine nacelle — right (+z, center y=-0.24 z=0.37) ──
    L(-0.42,-0.18, 0.31,-0.42,-0.18, 0.43); L(-0.42,-0.18, 0.43,-0.42,-0.30, 0.43);
    L(-0.42,-0.30, 0.43,-0.42,-0.30, 0.31); L(-0.42,-0.30, 0.31,-0.42,-0.18, 0.31);
    L(-1.05,-0.18, 0.31,-1.05,-0.18, 0.43); L(-1.05,-0.18, 0.43,-1.05,-0.30, 0.43);
    L(-1.05,-0.30, 0.43,-1.05,-0.30, 0.31); L(-1.05,-0.30, 0.31,-1.05,-0.18, 0.31);
    L(-0.42,-0.18, 0.31,-1.05,-0.18, 0.31); L(-0.42,-0.18, 0.43,-1.05,-0.18, 0.43);
    L(-0.42,-0.30, 0.43,-1.05,-0.30, 0.43); L(-0.42,-0.30, 0.31,-1.05,-0.30, 0.31);
    L(-0.42,-0.18, 0.31,-0.35,-0.15, 0.31); L(-0.42,-0.18, 0.43,-0.35,-0.15, 0.43); // intake cowl
    L(-0.42,-0.18, 0.37,-0.35,-0.06, 0.42); // pylon strut
    // ── Engine nacelle — left (-z) ──
    L(-0.42,-0.18,-0.31,-0.42,-0.18,-0.43); L(-0.42,-0.18,-0.43,-0.42,-0.30,-0.43);
    L(-0.42,-0.30,-0.43,-0.42,-0.30,-0.31); L(-0.42,-0.30,-0.31,-0.42,-0.18,-0.31);
    L(-1.05,-0.18,-0.31,-1.05,-0.18,-0.43); L(-1.05,-0.18,-0.43,-1.05,-0.30,-0.43);
    L(-1.05,-0.30,-0.43,-1.05,-0.30,-0.31); L(-1.05,-0.30,-0.31,-1.05,-0.18,-0.31);
    L(-0.42,-0.18,-0.31,-1.05,-0.18,-0.31); L(-0.42,-0.18,-0.43,-1.05,-0.18,-0.43);
    L(-0.42,-0.30,-0.43,-1.05,-0.30,-0.43); L(-0.42,-0.30,-0.31,-1.05,-0.30,-0.31);
    L(-0.42,-0.18,-0.31,-0.35,-0.15,-0.31); L(-0.42,-0.18,-0.43,-0.35,-0.15,-0.43);
    L(-0.42,-0.18,-0.37,-0.35,-0.06,-0.42);
    // ── Main engine bell + hex nozzle exit ring ──
    L(-0.88, 0.120, 0,   -1.05, 0.090, 0   ); L(-0.88,-0.120, 0,   -1.05,-0.090, 0   );
    L(-0.88, 0.060, 0.104,-1.05, 0.045, 0.078); L(-0.88,-0.060, 0.104,-1.05,-0.045, 0.078);
    L(-0.88, 0.060,-0.104,-1.05, 0.045,-0.078); L(-0.88,-0.060,-0.104,-1.05,-0.045,-0.078);
    L(-1.05, 0.090, 0,   -1.05, 0.045, 0.078); L(-1.05, 0.045, 0.078,-1.05,-0.045, 0.078);
    L(-1.05,-0.045, 0.078,-1.05,-0.090, 0   ); L(-1.05,-0.090, 0,   -1.05,-0.045,-0.078);
    L(-1.05,-0.045,-0.078,-1.05, 0.045,-0.078); L(-1.05, 0.045,-0.078,-1.05, 0.090, 0   );
    return new Float32Array(v);
  })();
  const shipGeo = new THREE.BufferGeometry();
  shipGeo.setAttribute('position', new THREE.BufferAttribute(_sv, 3));
  const ship = new THREE.LineSegments(shipGeo, new THREE.LineBasicMaterial({
    color: 0xb8e8ff, transparent: true, opacity: 0.92,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  ship.scale.setScalar(0.22);
  scene.add(ship);

  // Twin engine glows (main nozzles + pod nozzles = 4 points)
  const _eBuf = new Float32Array(4 * 3);
  const eGeo  = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(_eBuf, 3));
  const eGlow = new THREE.Points(eGeo, new THREE.PointsMaterial({
    color: 0x67e8f9, size: 0.055, transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(eGlow);
  // Pre-compute local nozzle positions (in ship local space × scale)
  const sc = 0.22;
  const _nozzles = [
    new THREE.Vector3(-1.05 * sc,  0.07 * sc,  0          ), // main nozzle top
    new THREE.Vector3(-1.05 * sc, -0.07 * sc,  0          ), // main nozzle bottom
    new THREE.Vector3(-1.05 * sc, -0.24 * sc,  0.37 * sc  ), // right nacelle
    new THREE.Vector3(-1.05 * sc, -0.24 * sc, -0.37 * sc  ), // left nacelle
  ];
  const _eWP = new THREE.Vector3();

  // Orbit trail ring (72-point ellipse matching ship path)
  const _tilt = Math.PI * 0.30;
  const _oPts = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r = 1.10 + 0.12 * Math.cos(a);
    _oPts.push(Math.cos(a) * r, Math.sin(a) * Math.sin(_tilt) * r, Math.sin(a) * Math.cos(_tilt) * r);
  }
  const orbitRingGeo = new THREE.BufferGeometry();
  orbitRingGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(_oPts), 3));
  scene.add(new THREE.LineLoop(orbitRingGeo, new THREE.LineBasicMaterial({
    color: 0x818cf8, transparent: true, opacity: 0.12,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  // Exhaust trails — 4 lines, XLEN=8 points each
  const XLEN = 8;
  const _trails = _nozzles.map(() => {
    const buf = new Float32Array(XLEN * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(buf, 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0x67e8f9, transparent: true, opacity: 0.50,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(line);
    return { buf, geo };
  });

  // Nav lights — right winglet (red), left winglet (green)
  const _navR_buf = new Float32Array(3);
  const _navG_buf = new Float32Array(3);
  const _navRGeo = new THREE.BufferGeometry();
  const _navGGeo = new THREE.BufferGeometry();
  _navRGeo.setAttribute('position', new THREE.BufferAttribute(_navR_buf, 3));
  _navGGeo.setAttribute('position', new THREE.BufferAttribute(_navG_buf, 3));
  const navLightR = new THREE.Points(_navRGeo, new THREE.PointsMaterial({
    color: 0xff3333, size: 0.036, transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  const navLightG = new THREE.Points(_navGGeo, new THREE.PointsMaterial({
    color: 0x33ff66, size: 0.036, transparent: true, opacity: 0.0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(navLightR); scene.add(navLightG);
  // Winglet tip positions in ship local space × scale
  const _navTips = [
    new THREE.Vector3(-0.35 * sc,  0.24 * sc,  0.98 * sc), // right winglet tip
    new THREE.Vector3(-0.35 * sc,  0.24 * sc, -0.98 * sc), // left winglet tip
  ];
  const _nWP = new THREE.Vector3();
  // ── END ship setup ───────────────────────────────────────────────────────

  // Animate
  const clock = new THREE.Clock();
  let rafId = null;
  (function frame(){
    rafId = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    tx += (mx - tx) * 0.04;
    ty += (my - ty) * 0.04;

    outerMesh.rotation.y = t * 0.14 + tx * 0.28;
    outerMesh.rotation.x = t * 0.07 + ty * 0.18;

    innerMesh.rotation.y = -t * 0.22 + tx * 0.18;
    innerMesh.rotation.x = -t * 0.11 + ty * 0.12;

    points.rotation.y = t * 0.06;
    points.rotation.x = t * 0.04;

    // ── Ship orbit — Kepler ellipse with full effects ──
    const baseAngle = t * 0.45;
    const oa  = baseAngle - 0.14 * Math.sin(baseAngle);  // Kepler speed variation
    const oR  = 1.10 + 0.12 * Math.cos(oa);              // elliptical radius 1.10–1.22
    const tilt = Math.PI * 0.30;
    ship.position.x = Math.cos(oa) * oR + tx * 0.10;
    ship.position.y = Math.sin(oa) * Math.sin(tilt) * oR + ty * 0.06;
    ship.position.z = Math.sin(oa) * Math.cos(tilt) * oR;
    // Face direction of travel (tangent to orbit)
    const vx = -Math.sin(oa);
    const vy =  Math.cos(oa) * Math.sin(tilt);
    const vz =  Math.cos(oa) * Math.cos(tilt);
    ship.rotation.y = -Math.atan2(vx, vz);
    ship.rotation.x =  Math.atan2(vy, Math.sqrt(vx * vx + vz * vz));
    ship.rotation.z = -Math.cos(oa) * 0.32 + Math.sin(t * 0.9) * 0.04; // correct bank + drift wobble
    ship.scale.setScalar(0.22 * (1 + Math.sin(t * 0.7) * 0.014));       // size shimmer
    ship.updateMatrixWorld(true);
    // 4 engine glows
    for (let n = 0; n < 4; n++) {
      _eWP.copy(_nozzles[n]).applyMatrix4(ship.matrixWorld);
      _eBuf[n * 3]     = _eWP.x;
      _eBuf[n * 3 + 1] = _eWP.y;
      _eBuf[n * 3 + 2] = _eWP.z;
    }
    eGeo.attributes.position.needsUpdate = true;
    eGlow.material.size = 0.05 + Math.sin(t * 12) * 0.012;
    // Exhaust trails — shift history, inject current nozzle world position
    for (let n = 0; n < 4; n++) {
      _eWP.copy(_nozzles[n]).applyMatrix4(ship.matrixWorld);
      const { buf, geo } = _trails[n];
      buf.copyWithin(3, 0, (XLEN - 1) * 3); // shift older points back
      buf[0] = _eWP.x; buf[1] = _eWP.y; buf[2] = _eWP.z;
      geo.attributes.position.needsUpdate = true;
    }
    // Nav lights — red/green alternate blink
    const blink = Math.sin(t * 5.0) > 0.2 ? 1.0 : 0.0;
    _nWP.copy(_navTips[0]).applyMatrix4(ship.matrixWorld);
    _navR_buf[0] = _nWP.x; _navR_buf[1] = _nWP.y; _navR_buf[2] = _nWP.z;
    _navRGeo.attributes.position.needsUpdate = true;
    navLightR.material.opacity = blink;
    _nWP.copy(_navTips[1]).applyMatrix4(ship.matrixWorld);
    _navG_buf[0] = _nWP.x; _navG_buf[1] = _nWP.y; _navG_buf[2] = _nWP.z;
    _navGGeo.attributes.position.needsUpdate = true;
    navLightG.material.opacity = 1.0 - blink;

    renderer.render(scene, camera);
  })();

  // Scroll fade — sphere fades out as user scrolls down
  const heroWrap=document.querySelector('.hero-sphere-wrap');
  const onSphereScroll = heroWrap ? ()=>{
    const pct=Math.min(window.scrollY/(window.innerHeight*0.7),1);
    heroWrap.style.opacity=String(1-pct*0.85);
    heroWrap.style.transform=`scale(${1-pct*0.1})`;
  } : null;
  if(onSphereScroll) window.addEventListener('scroll', onSphereScroll, {passive:true});

  // Clean up on navigate/close to prevent battery drain
  window._heroSphereCleanup = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onResize);
    if(onSphereScroll) window.removeEventListener('scroll', onSphereScroll);
    renderer.dispose();
  };
}
