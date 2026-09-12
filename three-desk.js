/* v1.27 Three.js POV desk + procedural officer hands (no GLTFLoader / bare imports) */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

if (!window.__cbThreeDeskGLB) {
  window.__cbThreeDeskGLB = true;

  function isFemale() {
    try {
      const g = (window.state && state.player && state.player.gender) || (window.ccSel && ccSel.gender) || '';
      return g === 'female';
    } catch (e) {
      return false;
    }
  }

  function skinHex() {
    return isFemale() ? 0x7a4a34 : 0x6b3d28;
  }

  function nailHex() {
    return isFemale() ? 0xc4a090 : 0xb08a78;
  }

  function cuff() {
    const g = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: 0x2c3e1f, roughness: 0.82 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.35, metalness: 0.35 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.044, 0.09, 18), cloth);
    c.rotation.z = Math.PI / 2;
    c.position.set(0, 0, -0.08);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.003, 8, 20), gold);
    band.rotation.y = Math.PI / 2;
    band.position.z = -0.04;
    g.add(c, band);
    return g;
  }

  /** Always-on anatomical-ish hand from primitives (offline-safe). */
  function makeProcHand(side) {
    const root = new THREE.Group();
    root.name = side < 0 ? 'proc-hand-left' : 'proc-hand-right';
    const skin = new THREE.MeshStandardMaterial({ color: skinHex(), roughness: 0.48, metalness: 0.04 });
    const nail = new THREE.MeshStandardMaterial({ color: nailHex(), roughness: 0.55, metalness: 0.08 });

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.028, 0.11), skin);
    palm.position.set(0, 0, 0.02);
    palm.castShadow = true;
    root.add(palm);

    const fingers = [
      { x: -0.032, z: 0.08, len: 0.07, thick: 0.014 },
      { x: -0.01, z: 0.085, len: 0.078, thick: 0.015 },
      { x: 0.012, z: 0.082, len: 0.074, thick: 0.014 },
      { x: 0.032, z: 0.07, len: 0.06, thick: 0.013 },
    ];
    for (let i = 0; i < fingers.length; i++) {
      const f = fingers[i];
      const finger = new THREE.Mesh(
        new THREE.CapsuleGeometry(f.thick, f.len * 0.55, 4, 8),
        skin
      );
      finger.rotation.x = 0.55;
      finger.position.set(f.x * side, 0.01, f.z);
      finger.castShadow = true;
      root.add(finger);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(f.thick * 0.85, 8, 8), nail);
      tip.position.set(f.x * side, 0.018, f.z + f.len * 0.42);
      root.add(tip);
    }

    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.04, 4, 8), skin);
    thumb.rotation.set(0.35, side * 0.9, side * 0.35);
    thumb.position.set(side * 0.055, 0.005, 0.03);
    thumb.castShadow = true;
    root.add(thumb);

    root.add(cuff());
    root.scale.setScalar(isFemale() ? 0.9 : 1);
    root.rotation.set(-1.15, side * 0.35, side * 0.15);
    root.position.set(side * 0.22, -0.02, 0.12);
    root.traverse((o) => {
      if (o.isMesh) o.frustumCulled = false;
    });
    return root;
  }

  function paintSkin(root, hex) {
    root.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      if (o.material.color && o.material.metalness !== undefined && o.material.metalness < 0.2) {
        // keep gold cuff band; recolor skin/cloth-ish only when roughness-like skin
        const c = o.material.color.getHex();
        if (c === 0x2c3e1f || c === 0xd4a017) return;
        o.material.color.setHex(hex);
      }
    });
  }

  function boot() {
    const desk = document.getElementById('desk');
    if (!desk) return setTimeout(boot, 300);
    if (document.getElementById('cb-three')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'cb-three';
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;';
    desk.style.position = 'relative';
    desk.insertBefore(canvas, desk.firstChild);

    // Hide legacy POV plates only. Keep .cb-hand-layer visible until Three proves a paint.
    const css = document.createElement('style');
    css.id = 'cb-three-desk-css';
    css.textContent =
      '.pov-hand,.pov-hand-svg{display:none!important}#desk.desk{background:#160e08}.doc-pov{z-index:6}.doc-pov .doc-card{background:#f3e6c4;box-shadow:0 14px 30px rgba(0,0,0,.55)}';
    document.head.appendChild(css);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) {
      // WebGL unavailable — leave desk-v22 SVG hands alone
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      window.__cbThreeDeskReady = false;
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x160e08);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 20);
    camera.position.set(0, 0.42, 0.62);
    camera.lookAt(0, 0.02, -0.05);

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.06, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.84 })
    );
    slab.position.set(0, -0.08, -0.05);
    slab.receiveShadow = true;
    scene.add(slab);

    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.9, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x24301a, roughness: 0.9 })
    );
    wall.position.set(0, 0.38, -0.55);
    scene.add(wall);

    scene.add(new THREE.AmbientLight(0xffe2bc, 0.55));
    const lamp = new THREE.SpotLight(0xffd7a0, 18, 3, 0.7, 0.45, 1.2);
    lamp.position.set(0.12, 0.85, 0.5);
    lamp.target.position.set(0, 0, 0);
    scene.add(lamp, lamp.target);
    const fill = new THREE.DirectionalLight(0x8899aa, 0.55);
    fill.position.set(-0.6, 0.5, 0.4);
    scene.add(fill);

    const group = new THREE.Group();
    group.name = 'cb-hands';
    scene.add(group);

    const left = makeProcHand(-1);
    const right = makeProcHand(1);
    group.add(left, right);

    let lastFemale = isFemale();

    function resize() {
      const w = desk.clientWidth || desk.offsetWidth || 0;
      const h = desk.clientHeight || desk.offsetHeight || 0;
      // Desk often 0×0 until game screen is shown — keep polling
      if (w < 2 || h < 2) return false;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      return true;
    }

    let sized = resize();
    let svgHidden = false;
    function hideSvgFallbackOnceProven() {
      if (svgHidden || !sized) return;
      // Only after a real-sized desk paint — never blank the desk first
      svgHidden = true;
      canvas.style.zIndex = '4';
      const hide = document.createElement('style');
      hide.id = 'cb-hide-svg-after-three';
      hide.textContent =
        '.cb-hand-layer{display:none!important;visibility:hidden!important;pointer-events:none!important}';
      document.head.appendChild(hide);
    }
    window.addEventListener('resize', () => {
      sized = resize();
    });
    if (typeof ResizeObserver !== 'undefined') {
      try {
        new ResizeObserver(() => {
          sized = resize();
        }).observe(desk);
      } catch (e) {}
    }
    setInterval(() => {
      if (!sized) sized = resize();
    }, 400);

    function tick(t) {
      const fem = isFemale();
      if (fem !== lastFemale) {
        lastFemale = fem;
        paintSkin(left, skinHex());
        paintSkin(right, skinHex());
        left.scale.setScalar(fem ? 0.9 : 1);
        right.scale.setScalar(fem ? 0.9 : 1);
      }
      if (!sized) sized = resize();
      group.position.y = Math.sin((t || 0) * 0.0015) * 0.006;
      group.scale.setScalar(fem ? 0.92 : 1);
      renderer.render(scene, camera);
      if (sized) hideSvgFallbackOnceProven();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Mark ready only after first successful sized paint (SVG stays until then)
    window.__cbThreeHands = { left, right, group, scene, camera, renderer };
    function markReadyWhenSized() {
      if (!sized) {
        sized = resize();
        if (!sized) return setTimeout(markReadyWhenSized, 200);
      }
      window.__cbThreeDeskReady = true;
      hideSvgFallbackOnceProven();
    }
    markReadyWhenSized();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}
