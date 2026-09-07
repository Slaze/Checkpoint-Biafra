/* Checkpoint Biafra Three.js booth v1.23 */
(function () {
  if (window.__cbThreeDesk) return;
  window.__cbThreeDesk = true;
  var CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
  function loadThree(cb) {
    if (window.THREE) return cb();
    var s = document.createElement('script');
    s.src = CDN; s.onload = cb;
    s.onerror = function () { console.warn('THREE CDN failed'); };
    document.head.appendChild(s);
  }
  function genderFemale() {
    try {
      var g = (window.state && state.player && state.player.gender) || (window.ccSel && ccSel.gender) || '';
      return g === 'female';
    } catch (e) { return false; }
  }
  function makeFinger(THREE, mat, len, r) {
    var g = new THREE.Group();
    var bone = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, len, 10), mat);
    bone.rotation.z = Math.PI / 2; bone.position.x = len / 2;
    var tip = new THREE.Mesh(new THREE.SphereGeometry(r * 0.82, 10, 8), mat); tip.position.x = len;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 10, 8), mat), bone, tip);
    return g;
  }
  function makeHand(THREE, side, female) {
    var skin = new THREE.MeshStandardMaterial({ color: female ? 0x7a4a34 : 0x6b3d28, roughness: 0.55, metalness: 0.02 });
    var cloth = new THREE.MeshStandardMaterial({ color: 0x2c3e1f, roughness: 0.8 });
    var gold = new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.4, metalness: 0.3 });
    var hand = new THREE.Group();
    hand.scale.setScalar(female ? 0.88 : 1);
    var cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.7, 16), cloth);
    cuff.rotation.z = Math.PI / 2; cuff.position.set(side * 0.15, -0.15, -0.85);
    var band = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.02, 8, 20), gold);
    band.rotation.y = Math.PI / 2; band.position.copy(cuff.position); band.position.z += 0.28;
    var palm = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.9), skin); palm.position.set(0, 0.02, -0.15);
    var wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.45, 12), skin);
    wrist.rotation.z = Math.PI / 2; wrist.position.set(0, 0, -0.62);
    hand.add(cuff, band, wrist, palm);
    var lengths = female ? [0.42, 0.52, 0.56, 0.5, 0.38] : [0.46, 0.56, 0.62, 0.54, 0.4];
    var radii = female ? [0.075, 0.07, 0.072, 0.065, 0.055] : [0.085, 0.08, 0.082, 0.072, 0.06];
    var zPos = [0.28, 0.16, 0.02, -0.12, -0.26];
    var yOff = [0.08, 0.12, 0.13, 0.1, 0.06];
    for (var i = 0; i < 5; i++) {
      var f = makeFinger(THREE, skin, lengths[i], radii[i]);
      f.position.set(0.34, yOff[i], zPos[i]); f.rotation.y = side * 0.08; f.rotation.z = -0.35;
      hand.add(f);
    }
    var thumb = makeFinger(THREE, skin, female ? 0.38 : 0.42, female ? 0.07 : 0.08);
    thumb.position.set(0.05, 0.06, 0.38); thumb.rotation.set(-0.4, side * 0.9, -0.5);
    hand.add(thumb);
    hand.position.set(side * 1.15, -0.85, 0.15);
    hand.rotation.set(-1.05, side * 0.15, side * 0.35);
    return hand;
  }
  function boot() {
    var THREE = window.THREE; if (!THREE) return;
    var desk = document.getElementById('desk');
    if (!desk) return setTimeout(boot, 400);
    if (document.getElementById('cb-three')) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'cb-three';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;';
    desk.style.position = desk.style.position || 'relative';
    desk.insertBefore(canvas, desk.firstChild);
    var hide = document.createElement('style');
    hide.textContent = '.pov-hand,.pov-hand-svg,.cb-hand-layer{display:none!important}#desk.desk{background:#1a120a}.doc-pov{z-index:6}.doc-pov .doc-card{background:#f3e6c4;box-shadow:0 12px 28px rgba(0,0,0,.5)}';
    document.head.appendChild(hide);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    var scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a120a);
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
    camera.position.set(0, 2.15, 3.1); camera.lookAt(0, 0.15, 0);
    var deskMesh = new THREE.Mesh(new THREE.BoxGeometry(8, 0.18, 5.2), new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.82 }));
    deskMesh.position.y = -0.35; deskMesh.receiveShadow = true; scene.add(deskMesh);
    var booth = new THREE.Mesh(new THREE.BoxGeometry(8.2, 4.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x24301a, roughness: 0.9 }));
    booth.position.set(0, 1.6, -2.4); scene.add(booth);
    var windowPane = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({ color: 0x6a7a4a, emissive: 0x2a3318, roughness: 0.4 }));
    windowPane.position.set(0, 1.7, -2.28); scene.add(windowPane);
    scene.add(new THREE.AmbientLight(0xffe6c0, 0.45));
    var lamp = new THREE.SpotLight(0xffd7a0, 2.4, 12, 0.55, 0.4, 1);
    lamp.position.set(0.4, 3.2, 2.2); lamp.target.position.set(0, 0, 0); lamp.castShadow = true;
    scene.add(lamp, lamp.target);
    scene.add(new THREE.DirectionalLight(0x8899aa, 0.35).translateX(-3));
    var female = genderFemale();
    var left = makeHand(THREE, -1, female), right = makeHand(THREE, 1, female);
    scene.add(left, right);
    for (var i = 0; i < 3; i++) {
      var p = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.012, 0.8), new THREE.MeshStandardMaterial({ color: 0xf3e6c4, roughness: 0.85 }));
      p.position.set((i - 1) * 0.18, -0.22 + i * 0.015, 0.35);
      p.rotation.y = (Math.random() - 0.5) * 0.25; scene.add(p);
    }
    var lastG = female;
    function resize() {
      var w = desk.clientWidth || 390, h = desk.clientHeight || 500;
      renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    }
    resize(); window.addEventListener('resize', resize);
    function tick(t) {
      t = t || 0;
      var f = genderFemale();
      if (f !== lastG) { scene.remove(left, right); left = makeHand(THREE, -1, f); right = makeHand(THREE, 1, f); scene.add(left, right); lastG = f; }
      var b = Math.sin(t * 0.0016) * 0.015;
      left.position.y = -0.85 + b; right.position.y = -0.85 - b * 0.6;
      renderer.render(scene, camera); requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  loadThree(boot);
})();
