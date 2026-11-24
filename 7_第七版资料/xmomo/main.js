// xmomo — 30 seconds of skincare, 8 hours of silk.  36 s, 1920×1080, 30 fps. Every frame is a pure function of t.
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eio, eo, ei, mulberry, env as envl } from '/core/lib.js';

const W = 1920, H = 1080;
window.DUR = 36;
const TAU = Math.PI * 2;

// ───────── renderer / post ─────────
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(2); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 1, 600);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 2, ao: false });
post.bloom.threshold = 1.0; post.bloom.radius = .55;
post.vig.uniforms.amt.value = .34; post.vig.uniforms.contrast.value = .1;

// ───────── studio: strip lights baked to an environment every frame ─────────
const envS = new THREE.Scene(); envS.background = new THREE.Color('#000');
const strip = (w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: '#fff', side: THREE.DoubleSide })); envS.add(m); return m; };
const face = (m, p) => { m.position.set(...p); m.lookAt(0, 0, 0); };
const L = { left: strip(26, 180), right: strip(26, 180), top: strip(170, 80), back: strip(280, 18), front: strip(170, 60), sweep: strip(30, 260), warm: strip(200, 120) };
face(L.left, [-150, 50, -50]); face(L.right, [150, 50, -60]); face(L.top, [0, 170, 20]); face(L.back, [0, 30, -190]); face(L.front, [0, 20, 170]); face(L.warm, [120, 90, 110]);
const LCOL = { left: '#f2f6ff', right: '#fff8ee', top: '#ffffff', back: '#f0e8ff', front: '#ffffff', warm: '#ffc98a' };
const pmrem = new THREE.PMREMGenerator(renderer); let envRT = null;
function updateEnv(o) {
  for (const k in LCOL) { const I = o[k] ?? 0; L[k].visible = I > 0; L[k].material.color.set(LCOL[k]).multiplyScalar(I); }
  const sw = o.sweep; L.sweep.visible = !!sw && sw.I > 0;
  if (L.sweep.visible) { const a = (sw.az || 0) + sw.x * 1.5, r = 170; L.sweep.position.set(Math.sin(a) * r, sw.y ?? 40, Math.cos(a) * r); L.sweep.lookAt(0, 0, 0); L.sweep.material.color.set(sw.col || '#ffffff').multiplyScalar(sw.I); }
  const rt = pmrem.fromScene(envS, 0, 1, 1000); scene.environment = rt.texture; if (envRT) envRT.dispose(); envRT = rt;
}
// background: a berry-tinted radial glow (the brand's own colour), intensity per shot
const bgc = document.createElement('canvas'); bgc.width = 512; bgc.height = 288;
{ const g = bgc.getContext('2d'), gr = g.createRadialGradient(256, 150, 10, 256, 150, 300); gr.addColorStop(0, '#5a2238'); gr.addColorStop(.5, '#1c0a12'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, 512, 288); }
const bgTex = new THREE.CanvasTexture(bgc); bgTex.colorSpace = THREE.SRGBColorSpace; scene.background = bgTex; scene.backgroundIntensity = 0;

const keyLight = new THREE.DirectionalLight('#fff6ea', 0); keyLight.position.set(-22, 38, 34); scene.add(keyLight);
const fillLight = new THREE.DirectionalLight('#dfe6ff', 0); fillLight.position.set(30, 8, 20); scene.add(fillLight);
const hemi = new THREE.HemisphereLight('#ffffff', '#3a2430', 0); scene.add(hemi);

// ───────── materials ─────────
const silkMat = (color, o = {}) => new THREE.MeshPhysicalMaterial({
  color, roughness: o.rough ?? .3, metalness: o.metal ?? .32, sheen: 1, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#fff'), .6), sheenRoughness: .35,
  anisotropy: o.aniso ?? .55, anisotropyRotation: o.arot ?? 0, envMapIntensity: o.env ?? 1.15, side: o.side ?? THREE.DoubleSide, specularIntensity: 1, ior: 1.8,
});
function paramSurface(nu, nv, fn, closeU = false) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2), idx = [], p = [0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const k = j * (nu + 1) + i; fn(i / nu, j / nv, p); pos.set(p, k * 3); uv[k * 2] = i / nu; uv[k * 2 + 1] = j / nv; }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  if (closeU) { const n = g.attributes.normal; for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu; const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); } }
  return g;
}

// ───────── flowing silk sheet ─────────
function silkH(x, z, t) {
  const xw = x + 1.6 * Math.sin(.11 * z + .45 * t), zw = z + 1.3 * Math.sin(.09 * x - .38 * t + 1.);
  let h = 1.5 * Math.sin(.15 * xw + .10 * zw + .55 * t) + 1.0 * Math.sin(-.085 * xw + .2 * zw - .42 * t + 1.3);
  const f = .5 + .5 * Math.sin(.42 * xw - .24 * zw + .7 * t + 2. * Math.sin(.07 * zw + .2 * t));
  h += 1.1 * f * f * f; h += .22 * Math.sin(.85 * xw + .55 * zw - .9 * t);
  return h;
}
const SHEET = { w: 96, d: 60, nx: 288, nz: 180 };
const sheetGeo = new THREE.PlaneGeometry(SHEET.w, SHEET.d, SHEET.nx, SHEET.nz); sheetGeo.rotateX(-Math.PI / 2);
const sheet = new THREE.Mesh(sheetGeo, silkMat('#f3e8d6', { rough: .28, metal: .16 })); scene.add(sheet);
function updateSheet(t) { const p = sheetGeo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, silkH(p.getX(i), p.getZ(i), t)); p.needsUpdate = true; sheetGeo.computeVertexNormals(); }

// ───────── cotton ─────────
function weaveCanvas() {
  const S = 1024, n = 32, c = S / n, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), R = mulberry(7);
  g.fillStyle = '#6f6a60'; g.fillRect(0, 0, S, S);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const over = (i + j) % 2 === 0, x = i * c, y = j * c, m = 2.2;
    const gr = over ? g.createLinearGradient(0, y, 0, y + c) : g.createLinearGradient(x, 0, x + c, 0);
    const b = 190 + R() * 40 | 0; gr.addColorStop(0, '#5d584f'); gr.addColorStop(.5, `rgb(${b},${b - 5},${b - 16})`); gr.addColorStop(1, '#5d584f');
    g.fillStyle = gr; g.beginPath(); over ? g.roundRect(x - 4, y + m, c + 8, c - 2 * m, 9) : g.roundRect(x + m, y - 4, c - 2 * m, c + 8, 9); g.fill();
    g.strokeStyle = 'rgba(60,54,44,.35)'; g.lineWidth = 1;
    for (let k = 0; k < 5; k++) { g.beginPath(); if (over) { const yy = y + m + R() * (c - 2 * m); g.moveTo(x, yy); g.lineTo(x + c, yy + (R() - .5) * 5); } else { const xx = x + m + R() * (c - 2 * m); g.moveTo(xx, y); g.lineTo(xx + (R() - .5) * 5, y + c); } g.stroke(); }
  }
  g.strokeStyle = 'rgba(235,230,215,.5)'; g.lineWidth = 1.1;   // loose fibres
  for (let k = 0; k < 900; k++) { const x = R() * S, y = R() * S, a = R() * TAU, l = 8 + R() * 22; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + (R() - .5) * 10, y + Math.sin(a) * l * .5 + (R() - .5) * 10, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return cv;
}
const wv = weaveCanvas();
const wTex = new THREE.CanvasTexture(wv); wTex.wrapS = wTex.wrapT = THREE.RepeatWrapping; wTex.repeat.set(9, 9); wTex.colorSpace = THREE.SRGBColorSpace; wTex.anisotropy = 8;
const wBump = new THREE.CanvasTexture(wv); wBump.wrapS = wBump.wrapT = THREE.RepeatWrapping; wBump.repeat.set(9, 9); wBump.anisotropy = 8;
const cotton = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ map: wTex, bumpMap: wBump, bumpScale: 2.2, roughness: 1, metalness: 0, color: '#d8d4cc', envMapIntensity: .9 }));
cotton.rotation.x = -Math.PI / 2; scene.add(cotton);
function blobCanvas(seed, soft) {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), R = mulberry(seed), ph = [R() * 9, R() * 9, R() * 9];
  const im = g.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = (x - S / 2) / (S / 2), dy = (y - S / 2) / (S / 2), a = Math.atan2(dy, dx), r = Math.hypot(dx, dy);
    const edge = .78 + .06 * Math.sin(3 * a + ph[0]) + .04 * Math.sin(7 * a + ph[1]) + .025 * Math.sin(13 * a + ph[2]);
    const v = 1 - clamp((r - edge + soft) / soft); const k = (y * S + x) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = 255; im.data[k + 3] = 255 * v * v * (3 - 2 * v); }
  g.putImageData(im, 0, 0); return new THREE.CanvasTexture(cv);
}
const stain = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: blobCanvas(3, .16), color: '#1a140b', transparent: true, depthWrite: false, opacity: 0 }));
stain.rotation.x = -Math.PI / 2; stain.position.y = .03; scene.add(stain);
const stainGlow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: blobCanvas(3, .5), color: '#ffb23e', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
stainGlow.rotation.x = -Math.PI / 2; stainGlow.position.y = .05; scene.add(stainGlow);

// ───────── the drop of serum ─────────
const dropMat = new THREE.MeshPhysicalMaterial({ color: '#ffb640', emissive: '#ff9a1c', emissiveIntensity: 2.2, roughness: .06, metalness: 0, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 1.6 });
const drop = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), dropMat); scene.add(drop);
const dropLight = new THREE.PointLight('#ffb040', 0, 0, 2); scene.add(dropLight);

// ───────── filaments ─────────
const FIL = { n: 84, m: 150, x0: -26, x1: 26 }; const filG = new THREE.Group(); scene.add(filG);
{ const R = mulberry(22);
  for (let i = 0; i < FIL.n; i++) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FIL.m * 3), 3));
    const hue = R(); const col = new THREE.Color().setRGB(1.0, .8 + hue * .15, .5 + hue * .3);
    const ln = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .34, blending: THREE.AdditiveBlending, depthWrite: false }));
    ln.userData = { a: R() * TAU, r: .8 + 5.2 * Math.sqrt(R()), ph: R() * TAU, k: .25 + R() * .3, lag: R() * .18 }; filG.add(ln); } }
function updateFil(t, t0) {
  filG.children.forEach((ln) => { const u = ln.userData, p = ln.geometry.attributes.position;
    for (let j = 0; j < FIL.m; j++) { const x = lerp(FIL.x0, FIL.x1, j / (FIL.m - 1)), c = ss(seg(x, -18, 3));
      const rad = lerp(u.r, .16, c), ang = u.a + c * (x * .9 + t * 2.4) + (1 - c) * .25 * Math.sin(u.k * x + u.ph + t * .8);
      const wav = (1 - c) * .5 * Math.sin(u.k * 1.7 * x + u.ph * 2 - t * 1.1);
      p.setXYZ(j, x, 3 + rad * Math.sin(ang) * .62 + wav, rad * Math.cos(ang)); }
    p.needsUpdate = true; const head = eo(seg(t, t0 + u.lag, t0 + 2.0 + u.lag)); ln.geometry.setDrawRange(0, Math.max(2, Math.floor(head * FIL.m))); });
}

// ───────── pillowcase ─────────
const pillow = new THREE.Group(); scene.add(pillow);
{ const A = 9.2, B = 6.1, T = 1.9;
  const half = (sgn) => paramSurface(96, 64, (u, v, p) => { const U = u * 2 - 1, V = v * 2 - 1, aU = Math.abs(U), aV = Math.abs(V);
    const prof = Math.pow(Math.max(0, 1 - Math.pow(aU, 2.6)), .55) * Math.pow(Math.max(0, 1 - Math.pow(aV, 2.6)), .55);
    const corner = Math.pow(aU * aV, 3);
    const wr = .09 * Math.sin(U * 9 + V * 7) * corner * 6 + .05 * Math.sin((U - V) * 14) * Math.pow(Math.max(aU, aV), 4);
    p[0] = A * U * (1 - .055 * (1 - V * V) * Math.pow(aU, 3)); p[1] = B * V * (1 - .075 * (1 - U * U) * Math.pow(aV, 3)); p[2] = sgn * (T * prof + wr * prof); });
  const m = silkMat('#f6f1e8', { rough: .3, metal: .06 });
  pillow.add(new THREE.Mesh(half(1), m), new THREE.Mesh(half(-1), m));
  const pts = []; for (let i = 0; i < 240; i++) { const s = i / 240 * 4, e = Math.floor(s), f = s - e; let U, V; if (e === 0) { U = -1 + 2 * f; V = -1; } else if (e === 1) { U = 1; V = -1 + 2 * f; } else if (e === 2) { U = 1 - 2 * f; V = 1; } else { U = -1; V = 1 - 2 * f; }
    pts.push(new THREE.Vector3(A * U * (1 - .055 * (1 - V * V) * Math.pow(Math.abs(U), 3)), B * V * (1 - .075 * (1 - U * U) * Math.pow(Math.abs(V), 3)), 0)); }
  pillow.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', .1), 480, .085, 8, true), silkMat('#c9c6c4', { rough: .4, metal: .05, aniso: 0 })));
}

// ───────── bonnet ─────────
const bonnet = new THREE.Group(); scene.add(bonnet);
const bonnetMats = [];
{ const R = 5.2, fm = 2.25;
  const dome = paramSurface(160, 72, (u, v, p) => { const th = u * TAU, f = v * fm; const g = ss(seg(f, 1.0, fm));
    const rho = R * Math.sin(f) * (1 + .045 * g * Math.sin(22 * th) + .02 * g * Math.sin(9 * th + 1)) * (1 + .02 * Math.sin(3 * th + 2 * f));
    p[0] = rho * Math.cos(th); p[1] = R * .78 * Math.cos(f) + .12 * Math.sin(4 * th + 3 * f) * Math.sin(f); p[2] = rho * Math.sin(th); }, true);
  const yb = R * .78 * Math.cos(fm), rb = R * Math.sin(fm);
  const frill = paramSurface(160, 10, (u, v, p) => { const th = u * TAU, rr = rb + v * 1.25, w = v * (.34 * Math.sin(16 * th) + .12 * Math.sin(7 * th + 1));
    p[0] = rr * Math.cos(th); p[1] = yb - .2 - v * .75 + w; p[2] = rr * Math.sin(th); }, true);
  const m1 = silkMat('#b9a3dd', { rough: .3, metal: .06 }), m2 = silkMat('#b9a3dd', { rough: .32, metal: .06 }), m3 = silkMat('#a48fd0', { rough: .35, metal: .05, aniso: 0 });
  bonnetMats.push(m1, m2, m3);
  const band = new THREE.Mesh(new THREE.TorusGeometry(rb + .02, .3, 14, 120), m3); band.rotation.x = Math.PI / 2; band.position.y = yb - .08; band.scale.z = 1.5;
  bonnet.add(new THREE.Mesh(dome, m1), new THREE.Mesh(frill, m2), band);
  const bow = new THREE.Group(); bow.position.set(0, yb - .1, rb + .35);
  for (const s of [-1, 1]) { const lp = new THREE.Mesh(new THREE.TorusGeometry(.78, .3, 14, 40), m3); lp.scale.set(1.25, .72, .5); lp.position.set(s * 1.05, .08, 0); lp.rotation.z = s * -.25; bow.add(lp);
    const tail = new THREE.Mesh(paramSurface(4, 16, (u, v, p) => { p[0] = s * (.25 + v * .7) + (u - .5) * .5; p[1] = -v * 2.1; p[2] = .12 * Math.sin(v * 5); }), m3); bow.add(tail); }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(.36, 20, 14), m3); knot.scale.set(1, 1.15, .8); bow.add(knot); bonnet.add(bow);
}

// ───────── 3D contoured sleep mask ─────────
const mask = new THREE.Group(); scene.add(mask);
{ const A = 9.2, B = 4.3;
  const Rout = (th) => { const c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th)), n = 2.7; let r = 1 / Math.pow(Math.pow(c / A, n) + Math.pow(s / B, n), 1 / n);
    const d = Math.atan2(Math.sin(th + Math.PI / 2), Math.cos(th + Math.PI / 2)); r *= 1 - .34 * Math.exp(-(d * d) / (.3 * .3)); return r; };
  const cup = (x, y, cx) => { const d = Math.hypot((x - cx) / 3.3, (y - .25) / 2.6); return d < 1 ? Math.pow(1 - d * d, .9) : 0; };
  const frontF = (u, v, p) => { const th = u * TAU, r = Rout(th) * v, x = r * Math.cos(th), y = r * Math.sin(th);
    p[0] = x; p[1] = y; p[2] = .5 * Math.pow(Math.max(0, 1 - Math.pow(v, 5)), .5) + 1.25 * (cup(x, y, -4.2) + cup(x, y, 4.2)) * (1 - Math.pow(v, 6)) - .055 * x * x * .12; };
  const backF = (u, v, p) => { const th = u * TAU, r = Rout(th) * v, x = r * Math.cos(th), y = r * Math.sin(th); p[0] = x; p[1] = y; p[2] = -.3 * Math.pow(Math.max(0, 1 - Math.pow(v, 5)), .5) - .055 * x * x * .12; };
  const m = silkMat('#f2b6c8', { rough: .3, metal: .06 });
  mask.add(new THREE.Mesh(paramSurface(200, 60, frontF, true), m), new THREE.Mesh(paramSurface(200, 24, backF, true), silkMat('#e3a5b9', { rough: .4, metal: .05 })));
  const pts = []; for (let i = 0; i < 200; i++) { const th = i / 200 * TAU, r = Rout(th), x = r * Math.cos(th); pts.push(new THREE.Vector3(x, r * Math.sin(th), .06 - .055 * x * x * .12)); }
  mask.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 400, .2, 10, true), silkMat('#eeaec1', { rough: .36, metal: .05, aniso: 0 })));
  const sp = []; for (let i = 0; i <= 60; i++) { const a = Math.PI * i / 60; sp.push(new THREE.Vector3(-A * .98 * Math.cos(a), .1 + .25 * Math.sin(a * 6) * .3, -.4 - 9.5 * Math.sin(a))); }
  const strap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 160, .22, 10, false), silkMat('#eeaec1', { rough: .36, metal: .05 })); strap.scale.y = 5.5; strap.position.y = -.4;
}

// ───────── per-shot staging ─────────
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hideAll = () => { for (const o of [sheet, cotton, stain, stainGlow, drop, filG, pillow, bonnet, mask]) o.visible = false; dropLight.intensity = 0; keyLight.intensity = 0; fillLight.intensity = 0; hemi.intensity = 0; };
const LAV = new THREE.Color('#b9a3dd'), MINT = new THREE.Color('#a9dcc8'), WHITE = new THREE.Color('#fff');
const T = { cotton: 4.5, silkLand: 11.0 };   // impact times
function look(pos, tgt, fov = 30) { camera.fov = fov; camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(tgt); camera.updateProjectionMatrix(); }

function stage(t) {
  hideAll(); keyLight.color.set('#fff6ea');
  const P = { fade: 1, bloom: .25, sat: 1, warm: 0, bg: 0, focus: null, aper: 0 };
  let E = {};
  if (t < 4) {                                   // A — the drop falls
    cotton.visible = drop.visible = true;
    const y = lerp(13.5, 2.6, Math.pow(seg(t, 0, 4), 1.35)); drop.position.set(0, y, 0); drop.scale.set(.5, .5 * (1 + .1 * Math.sin(t * 5)), .5);
    dropMat.emissiveIntensity = 2.4; dropLight.position.set(0, y, 0); dropLight.intensity = 60;
    E = { top: .05, back: .25, left: .5, right: .35 };
    look(V(lerp(3, 0, eio(t / 4)), lerp(7.5, 5, eio(t / 4)), lerp(40, 30, eio(t / 4))), V(0, lerp(9, 3.6, eio(t / 4)), 0));
    P.fade = eo(seg(t, 0, .7)); P.bloom = .55; P.sat = .85; P.focus = drop.position; P.aper = 30;
  } else if (t < 10) {                           // B — cotton drinks it
    cotton.visible = true; const ti = T.cotton, k = t - ti;
    E = { top: 1.5, back: .5, left: .7, right: .5 }; hemi.intensity = .5;
    if (k < 0) { drop.visible = true; const y = lerp(2.6, .5, Math.pow(seg(t, 4, ti), 2)); drop.position.set(0, y, 0); drop.scale.setScalar(.5); dropMat.emissiveIntensity = 2.4; dropLight.position.set(0, y + .4, 0); dropLight.intensity = 60; }
    else { const sq = eo(seg(k, 0, .22)), sink = ss(seg(k, .25, 2.4)); drop.visible = sink < 1;
      const rr = lerp(.5, 1.05, sq) * (1 - sink * .55); drop.scale.set(rr, lerp(.5, .13, sq) * (1 - sink), rr); drop.position.set(0, lerp(.5, .1, sq) * (1 - sink) + .02, 0);
      dropMat.emissiveIntensity = 2.4 * (1 - sink); dropLight.position.set(0, 1.0, 0); dropLight.intensity = 60 * (1 - ss(seg(k, .1, 2.8)));
      const sr = lerp(.5, 4.4, eo(seg(k, 0, 3.2))); stain.visible = stainGlow.visible = true; stain.scale.set(sr, sr, 1); stain.material.opacity = .86 * ss(seg(k, .1, 1.2));
      stainGlow.scale.set(sr * .9, sr * .9, 1); stainGlow.material.opacity = .55 * ss(seg(k, 0, .3)) * (1 - ss(seg(k, .5, 2.9))); }
    const u = eio(seg(t, 4, 9.2)); look(V(lerp(-2.5, 1.5, u), lerp(12, 9.5, u), lerp(15.5, 12, u)), V(0, 0, .3));
    P.fade = 1 - ss(seg(t, 8.7, 9.5)); P.bloom = .5; P.sat = .7; P.focus = V(0, 0, 0); P.aper = 18;
  } else if (t < 16) {                           // C — silk doesn't
    sheet.visible = true; updateSheet(t); const ti = T.silkLand, k = t - ti;
    const rv = eo(seg(t, 10, 11.4));
    E = { top: .5 * rv, back: 1.6 * rv, left: 2.4 * rv, right: 1.7 * rv, sweep: { x: lerp(-1.1, 1.2, seg(t, 10, 14.5)), I: 5.5 * (1 - seg(t, 13.5, 14.5)), az: Math.PI, y: 60 } }; hemi.intensity = .45 * rv; keyLight.intensity = 1.5 * rv;
    const px = lerp(-7, 9, eio(seg(k, 0, 5.4))), pz = 1.5 + 2.2 * Math.sin(k * .8), r = .62;
    if (t > ti - .5) { drop.visible = true; let y = silkH(px, pz, t) + r * .82;
      if (k < 0) y = lerp(y + 9, y, Math.pow(seg(t, ti - .5, ti), 2)); else y += 1.1 * Math.abs(Math.sin(k * 7.5)) * Math.exp(-k * 3.2);
      const sq = k >= 0 ? 1 + .25 * Math.exp(-k * 6) : 1; drop.position.set(px, y, pz); drop.scale.set(r * sq, r * (.86 / sq), r * sq);
      dropMat.emissiveIntensity = 2.6; dropLight.position.set(px, y + 1.2, pz); dropLight.intensity = 9; }
    const u = eio(seg(t, 10, 16)); const tg = V(lerp(-2, px, ss(seg(t, 11.5, 14))), 1.2, lerp(0, pz, ss(seg(t, 11.5, 14))));
    look(V(lerp(-16, 12, u) * .6 + tg.x * .4, lerp(15, 8.5, u), lerp(38, 21, u)), tg, 30);
    P.fade = eo(seg(t, 10, 10.5)); P.bloom = .42; P.warm = .35; P.bg = .0; P.focus = k > 0 ? drop.position : V(0, 1, 0); P.aper = lerp(6, 16, u);
  } else if (t < 20) {                           // D — 22 momme
    sheet.visible = true; sheet.position.y = -7; updateSheet(t); filG.visible = true; updateFil(t, 16);
    E = { top: .08, back: .5, left: .7, right: .3, sweep: { x: lerp(-1, 1, seg(t, 16, 19.5)), I: 2.2, az: Math.PI, y: 70 } };
    const u = eio(seg(t, 16, 20)); look(V(lerp(-9, -2, u), lerp(7.5, 6.2, u), lerp(36, 31, u)), V(lerp(-3, 2, u), 6.6, 0), 30); hemi.intensity = .25;
    P.fade = eo(seg(t, 16, 16.35)); P.bloom = .45; P.warm = .3; P.bg = .3; P.focus = V(4, 3, 0); P.aper = 12;
  } else if (t < 23) {                           // E1 — pillowcase
    pillow.visible = true; const u = seg(t, 20, 23);
    pillow.rotation.set(-.2, lerp(-.75, -.2, eio(u)), .06); pillow.position.set(0, .3 + .12 * Math.sin(t * 1.8), 0);
    E = { top: .5, back: .9, left: 2.2, right: 1.5, front: .1, sweep: { x: lerp(-.9, .9, eo(seg(t, 20, 21.6))), I: 5 * (1 - seg(t, 21.2, 21.7)), az: 0, y: 30 } };
    keyLight.intensity = 2.4; fillLight.intensity = .5; hemi.intensity = .55; look(V(lerp(-4, -8, eio(u)), 3.5, lerp(54, 50, eio(u))), V(-9.5, -1.6, 0), 30);
    P.fade = eo(seg(t, 20, 20.3)); P.bloom = .3; P.bg = .55; P.focus = V(0, 0, 2); P.aper = 4;
  } else if (t < 26) {                           // E2 — reversible bonnet
    bonnet.visible = true; const u = seg(t, 23, 26), sp = eio(seg(t, 24.2, 25.1));
    bonnet.rotation.set(.28, -.35 + sp * TAU, 0); bonnet.position.set(0, -.6 + .9 * Math.sin(sp * Math.PI), 0);
    const cm = ss(seg(sp, .35, .65)); bonnetMats.forEach((m, i) => { m.color.copy(LAV).lerp(MINT, cm); if (i === 2) m.color.multiplyScalar(.9); m.sheenColor.copy(m.color).lerp(WHITE, .6); });
    E = { top: .55, back: 1.0, left: 2.0, right: 1.6, front: .12, sweep: { x: lerp(-.9, .9, eo(seg(t, 23, 24.4))), I: 4.5 * (1 - seg(t, 24, 24.5)), az: 0, y: 30 } };
    keyLight.intensity = 2.4; fillLight.intensity = .5; hemi.intensity = .55; look(V(lerp(-9, -6, eio(u)), 5.5, lerp(44, 40, eio(u))), V(-7.6, -.6, 0), 30);
    P.fade = eo(seg(t, 23, 23.3)); P.bloom = .3; P.bg = .55; P.focus = V(0, 0, 3); P.aper = 4;
  } else if (t < 31.5) {                         // F — the mask, lights out
    const u = seg(t, 26, 30), go = ei(seg(t, 28.5, 29.55));
    mask.visible = t < 29.7;
    mask.rotation.set(lerp(.18, 0, eio(seg(t, 27.6, 28.8))), lerp(.75, 0, eio(seg(t, 26, 28.6))), lerp(-.08, 0, eio(seg(t, 27, 28.6))));
    mask.position.set(0, .2 + .15 * Math.sin(t * 1.7) * (1 - go), lerp(0, 36.5, go));
    E = { top: .5, back: .9, left: 2.1, right: 1.6, front: .1, sweep: { x: lerp(-.9, .9, eo(seg(t, 26, 27.4))), I: 4.5 * (1 - seg(t, 27, 27.5)), az: 0, y: 30 } };
    keyLight.intensity = 2.4; fillLight.intensity = .5; hemi.intensity = .55; look(V(0, 1.5, lerp(42, 39, eio(u))), V(lerp(-7, 0, eio(seg(t, 28.2, 29.2))), lerp(-2.2, 0, eio(seg(t, 28.2, 29.2))), 0), 30);
    P.fade = eo(seg(t, 26, 26.3)) * (1 - ss(seg(t, 29.25, 29.55))); P.bloom = .3; P.bg = .55 * (1 - go); P.focus = mask.position.clone().add(V(0, 0, 1)); P.aper = 4;
  } else {                                       // G — morning
    pillow.visible = true; const u = seg(t, 31.5, 36);
    pillow.rotation.set(-.32, lerp(.5, .3, eio(u)), -.05); pillow.position.set(0, -5.2, 0);
    const dawn = eo(seg(t, 31.5, 33.2));
    E = { top: .35 * dawn, back: .5 * dawn, left: .9 * dawn, right: .6 * dawn, warm: 1.0 * dawn, sweep: { x: lerp(-1.0, .9, eo(seg(t, 31.5, 34.5))), I: 4.5 * (1 - seg(t, 33.6, 34.6)), az: 0, y: 50, col: '#ffe6c4' } };
    keyLight.intensity = 2.0 * dawn; keyLight.color.set('#fff0dc'); hemi.intensity = .4 * dawn; look(V(0, 2.5, lerp(52, 60, eo(u))), V(0, .4, 0), 30);
    P.fade = eo(seg(t, 31.5, 32.4)); P.bloom = .35; P.warm = .3; P.bg = .7 * dawn; P.focus = V(0, -4, 2); P.aper = 3;
  }
  if (!(t >= 16 && t < 20)) sheet.position.y = 0;
  updateEnv(E);
  scene.backgroundIntensity = P.bg;
  post.dof.focus = P.focus ? camera.position.distanceTo(P.focus) : 100; post.dof.aper = P.aper; post.dof.maxCoc = 14;
  post.bloom.strength = P.bloom; post.vig.uniforms.fade.value = P.fade; post.vig.uniforms.sat.value = P.sat; post.vig.uniforms.warm.value = P.warm;
}

// ───────── type ─────────
const ov = document.getElementById('ov'), g = ov.getContext('2d');
const IV = '#f4ecdf', GOLD = '#f2c27a';
const F = (px, w = 300) => `${w} ${px}px NSerif`;
// kind: line (lower third, centred) · spec · label (left) · dark (centre, small) · end
const TX = [
  { id: 't1', a: .5, b: 3.8, kind: 'line', en: '30 seconds of skincare.', zh: '' },
  { id: 't2', a: 4.1, b: 6.9, kind: 'line', en: 'Then 8 hours on cotton.', zh: '' },
  { id: 't3', a: 7.0, b: 9.7, kind: 'line', en: 'Cotton soaks it up.', zh: '' },
  { id: 't4', a: 10.4, b: 12.75, kind: 'line', en: "Silk doesn't.", zh: '' },
  { id: 't5', a: 12.9, b: 15.9, kind: 'line', en: 'Helps skincare stay on your skin.', zh: '' },
  { id: 't6', a: 16.3, b: 19.9, kind: 'spec' },
  { id: 't7', a: 20.05, b: 23.0, kind: 'label', cap: 'SILK PILLOWCASE', en: 'Less friction than cotton.', zh: '' },
  { id: 't8', a: 23.05, b: 26.0, kind: 'label', cap: 'REVERSIBLE SILK BONNET', en: 'Lavender or mint. Your call.', zh: '' },
  { id: 't9', a: 26.05, b: 28.85, kind: 'label', cap: '3D CONTOURED SLEEP MASK', en: 'Zero pressure. 100% blackout.', zh: '' },
  { id: 't10', a: 29.85, b: 31.45, kind: 'dark', en: 'Lights out.', zh: '' },
  { id: 't11', a: 32.0, b: 36.5, kind: 'end' },
];
const alphaOf = (x, t) => Math.min(ss(seg(t, x.a, x.a + .25)), 1 - ss(seg(t, x.b - .25, x.b)));
function spaced(str, x, y, sp, align = 'left') {   // letter-spaced text; returns width
  let w = 0; for (const ch of str) w += g.measureText(ch).width + sp; w -= sp;
  let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; g.textAlign = 'left';
  for (const ch of str) { g.fillText(ch, cx, y); cx += g.measureText(ch).width + sp; } return w;
}
const boxes = [];
const box = (id, text, x0, y0, x1, y1) => boxes.push({ id, text, x0, y0, x1, y1 });
function drawText(t) {
  g.clearRect(0, 0, W, H); boxes.length = 0; g.textBaseline = 'alphabetic';
  for (const x of TX) { const a = alphaOf(x, t); if (a <= 0) continue; const full = a > .985, dy = 14 * (1 - eo(seg(t, x.a, x.a + .5)));
    g.save(); g.globalAlpha = a; g.fillStyle = IV; g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 18;
    if (x.kind === 'line' || x.kind === 'dark') { const y = x.kind === 'dark' ? 548 : 880, s = x.kind === 'dark' ? 54 : 66;
      if (x.kind === 'line' && t >= 10 && t < 16) { g.save(); g.shadowBlur = 0; g.globalAlpha = a * .6; const gr = g.createLinearGradient(0, 600, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.6, 'rgba(0,0,0,.8)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(0, 600, W, H - 600); g.restore(); }
      g.font = F(s, 300); g.textAlign = 'center'; g.fillText(x.en, W / 2, y + dy); const w = g.measureText(x.en).width;
      g.globalAlpha = a * .72; g.font = F(30, 400); const w2 = spaced(x.zh, W / 2, y + 58 + dy, 5, 'center');
      if (full) { box(x.id, x.en, W / 2 - w / 2, y - s, W / 2 + w / 2, y + 12); box(x.id + 'z', x.zh, W / 2 - w2 / 2, y + 28, W / 2 + w2 / 2, y + 66); }
    } else if (x.kind === 'label') { const X = 150, y = 800;
      g.fillStyle = GOLD; g.font = F(22, 500); const w0 = spaced(x.cap, X, y - 78 + dy, 7); g.fillRect(X, y - 62 + dy, 64 * eo(seg(t, x.a, x.a + .7)), 1.5);
      g.fillStyle = IV; g.font = F(52, 300); g.textAlign = 'left'; g.fillText(x.en, X, y + dy); const w = g.measureText(x.en).width;
      g.globalAlpha = a * .72; g.font = F(28, 400); const w2 = spaced(x.zh, X, y + 54 + dy, 4);
      if (full) { box(x.id + 'c', x.cap, X, y - 100, X + w0, y - 70); box(x.id, x.en, X, y - 46, X + w, y + 12); box(x.id + 'z', x.zh, X, y + 26, X + w2, y + 62); }
    } else if (x.kind === 'spec') { const X = 170, y = 380, n = Math.round(22 * eo(seg(t, x.a, x.a + 1.1)));
      g.font = F(250, 200); g.textAlign = 'left'; g.fillText(String(n), X, y + dy); const wn = g.measureText('22').width;
      g.fillStyle = GOLD; g.font = F(40, 400); const wm = spaced('MOMME', X + wn + 28, y - 8 + dy, 12);
      g.fillStyle = IV; const a2 = ss(seg(t, x.a + .7, x.a + 1.1)); g.globalAlpha = a * a2; g.font = F(34, 300);
      const s1 = '6A GRADE  ·  100% MULBERRY SILK', w1 = spaced(s1, X + 8, y + 84 + dy, 4);
      g.globalAlpha = a * a2 * .72; g.font = F(28, 400); const s2 = '', w2 = spaced(s2, X + 8, y + 136 + dy, 4);
      g.globalAlpha = a * ss(seg(t, x.a + 1.2, x.a + 1.6)) * .85; g.font = F(20, 500); g.fillStyle = GOLD; const s3 = 'OEKO-TEX® STANDARD 100 CERTIFIED', w3 = spaced(s3, X + 8, y + 196 + dy, 5);
      if (full && a2 > .985) { box(x.id, '22 MOMME', X, y - 200, X + wn + 28 + wm, y + 10); box(x.id + 'a', s1, X, y + 52, X + 8 + w1, y + 94); box(x.id + 'z', s2, X, y + 106, X + 8 + w2, y + 146); if (t > x.a + 1.6) box(x.id + 'o', s3, X, y + 176, X + 8 + w3, y + 202); }
    } else if (x.kind === 'end') { const y = 330, sp = lerp(46, 26, eo(seg(t, x.a, x.a + 1.6)));
      g.font = F(150, 200); const w = spaced('xmomo', W / 2 + sp / 2, y, sp, 'center');
      const a2 = ss(seg(t, x.a + .4, x.a + .8)); g.globalAlpha = a * a2; g.font = F(44, 300); g.textAlign = 'center'; const s1 = "Beauty sleep shouldn't be a metaphor."; g.fillText(s1, W / 2, y + 98); const w1 = g.measureText(s1).width;
      g.globalAlpha = a * a2 * .72; g.font = F(28, 400); const s2 = '', w2 = spaced(s2, W / 2, y + 150, 6, 'center');
      const a3 = ss(seg(t, x.a + .9, x.a + 1.3)); g.globalAlpha = a * a3; g.fillStyle = GOLD; g.font = F(26, 500); const s3 = 'XMOMOSHOP.COM', w3 = spaced(s3, W / 2, 1034, 9, 'center');
      if (full) { box(x.id, 'xmomo', W / 2 - w / 2, y - 120, W / 2 + w / 2, y + 10); if (a2 > .985) { box(x.id + 'a', s1, W / 2 - w1 / 2, y + 58, W / 2 + w1 / 2, y + 110); box(x.id + 'z', s2, W / 2 - w2 / 2, y + 122, W / 2 + w2 / 2, y + 158); } if (a3 > .985) box(x.id + 'u', s3, W / 2 - w3 / 2, 976, W / 2 + w3 / 2, 1006); }
    }
    g.restore(); }
  // the timer: SKINCARE 00:30 → 00:00, then SILK 08:00:00
  const ta = ss(seg(t, .3, .9)) * (1 - ss(seg(t, 35.6, 36))); if (ta > 0) { g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 12;
    const silkT = t >= 31.5, X = W - 110, y = 108; let label, time, col = IV;
    if (!silkT) { const left = Math.max(0, 30 - Math.floor(t)); label = 'SKINCARE'; time = '00:' + String(left).padStart(2, '0'); if (t >= 30) col = (Math.floor(t * 3) % 2 || t > 31) ? IV : 'rgba(244,236,223,.35)'; }
    else { const s = 8 * 3600 - Math.floor(t - 31.5), hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), sc = s % 60; label = 'SILK'; time = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(sc).padStart(2, '0')}`; col = GOLD; }
    const sw = silkT ? ss(seg(t, 31.5, 32.1)) : 1;
    g.globalAlpha = ta * sw * .8; g.fillStyle = col; g.font = F(17, 500); spaced(label, X, y - 44, 6, 'right');
    g.globalAlpha = ta * sw; g.font = F(40, 300); let cx = X; for (const ch of [...time].reverse()) { const cw = ch === ':' ? 14 : 25; g.textAlign = 'center'; g.fillText(ch, cx - cw / 2, y); cx -= cw; }
    const full = silkT ? 1 : clamp(1 - t / 30); g.globalAlpha = ta * sw * .3; g.fillRect(X - 150, y + 18, 150, 1.5); g.globalAlpha = ta * sw; g.fillRect(X - 150 * full, y + 18, 150 * full, 1.5);
    g.restore(); }
}
window.TEXTS = (t) => { drawText(t); return boxes.slice(); };

// sound / cue events (read by score.py)
window.EV = [
  { t: T.cotton, type: 'thud_cotton' }, { t: 10.0, type: 'sweep' }, { t: T.silkLand, type: 'ding_silk' }, { t: 16.0, type: 'threads' },
  { t: 20.0, type: 'reveal' }, { t: 23.0, type: 'reveal' }, { t: 24.3, type: 'swish' }, { t: 26.0, type: 'reveal' }, { t: 29.5, type: 'blackout' }, { t: 31.5, type: 'dawn' },
];

window.render = (t) => { t = clamp(t, 0, window.DUR - 1e-3); stage(t); scene.updateMatrixWorld(); camera.updateMatrixWorld(); post.composer.render(); drawText(t); };
await document.fonts.load('300 40px NSerif', 'xmomo'); await document.fonts.ready;
window.render(0); window.READY = true;
