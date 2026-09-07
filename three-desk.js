/* v1.24 Three.js + WebXR anatomical hand GLBs */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

if (!window.__cbThreeDeskGLB) {
  window.__cbThreeDeskGLB = true;
  const LEFT_URL = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/left.glb';
  const RIGHT_URL = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/right.glb';
  function isFemale() {
    try {
      const g = (window.state && state.player && state.player.gender) || (window.ccSel && ccSel.gender) || '';
      return g === 'female';
    } catch (e) { return false; }
  }
  function skinHex() { return isFemale() ? 0x7a4a34 : 0x6b3d28; }
  function curlHand(root) {
    root.traverse((o) => {
      const n = (o.name || '').toLowerCase();
      if (n.includes('phalanx-proximal')) o.rotation.x = 0.55;
      if (n.includes('phalanx-intermediate')) o.rotation.x = 0.7;
      if (n.includes('phalanx-distal')) o.rotation.x = 0.35;
      if (n.includes('thumb') && n.includes('proximal')) o.rotation.y = 0.45;
    });
  }
  function paint(root, hex) {
    const mat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.48, metalness: 0.04 });
    root.traverse((o) => { if (o.isMesh) { o.material = mat; o.castShadow = true; o.frustumCulled = false; } });
  }
  function cuff() {
    const g = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: 0x2c3e1f, roughness: 0.82 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.35, metalness: 0.35 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.044, 0.09, 18), cloth);
    c.rotation.z = Math.PI / 2; c.position.set(0, 0, -0.08);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.003, 8, 20), gold);
    band.rotation.y = Math.PI / 2; band.position.z = -0.04;
    g.add(c, band); return g;
  }
  function boot() {
    const desk = document.getElementById('desk');
    if (!desk) return setTimeout(boot, 300);
    if (document.getElementById('cb-three')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'cb-three';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;';
    desk.style.position = 'relative';
    desk.insertBefore(canvas, desk.firstChild);
    const css = document.createElement('style');
    css.textContent = '.pov-hand,.pov-hand-svg,.cb-hand-layer{display:none!important}#desk.desk{background:#160e08}.doc-pov{z-index:6}.doc-pov .doc-card{background:#f3e6c4;box-shadow:0 14px 30px rgba(0,0,0,.55)}';
    document.head.appendChild(css);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x160e08);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 20);
    camera.position.set(0, 0.42, 0.62); camera.lookAt(0, 0.02, -0.05);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.1), new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.84 }));
    slab.position.set(0, -0.08, -0.05); slab.receiveShadow = true; scene.add(slab);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.04), new THREE.MeshStandardMaterial({ color: 0x24301a, roughness: 0.9 }));
    wall.position.set(0, 0.38, -0.55); scene.add(wall);
    scene.add(new THREE.AmbientLight(0xffe2bc, 0.55));
    const lamp = new THREE.SpotLight(0xffd7a0, 18, 3, 0.7, 0.45, 1.2);
    lamp.position.set(0.12, 0.85, 0.5); lamp.target.position.set(0, 0, 0); scene.add(lamp, lamp.target);
    const fill = new THREE.DirectionalLight(0x8899aa, 0.55); fill.position.set(-0.6, 0.5, 0.4); scene.add(fill);
    const loader = new GLTFLoader(); const group = new THREE.Group(); scene.add(group);
    function place(model, side) {
      paint(model, skinHex()); curlHand(model);
      model.scale.setScalar(isFemale() ? 0.9 : 1);
      model.rotation.set(-1.15, side * 0.35, side * 0.15);
      model.position.set(side * 0.22, -0.02, 0.12);
      model.add(cuff()); group.add(model);
    }
    loader.load(LEFT_URL, (g) => place(g.scene, -1));
    loader.load(RIGHT_URL, (g) => place(g.scene, 1));
    function resize() {
      const w = desk.clientWidth || 390, h = desk.clientHeight || 520;
      renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    }
    resize(); window.addEventListener('resize', resize);
    function tick(t) {
      group.position.y = Math.sin((t || 0) * 0.0015) * 0.006;
      group.scale.setScalar(isFemale() ? 0.92 : 1);
      renderer.render(scene, camera); requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}
