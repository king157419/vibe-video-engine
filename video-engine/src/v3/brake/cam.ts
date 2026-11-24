// 简易针孔相机：把“地面坐标”（单位 = 俯视画面像素，1 米 = 34 px，z 朝上）投到屏幕。
// 同一个相机既做开头的驾驶视角（俯仰约 10°），也做升镜（俯仰 → 90°，同时滚转 90°），
// 升镜结束时退化成正俯视：屏幕坐标 = 地面坐标（缩放 F/H）。所以标线在升镜全程都对齐。

export type V2 = [number, number];
export type V3 = [number, number, number];

export type Cam = {
	pos: V3; // 相机位置（地面坐标，z = 高度）
	pitch: number; // 俯仰（弧度，0 = 水平看 +x，π/2 = 正下方）
	roll: number; // 滚转（弧度，π/2 时路面 +x 朝屏幕右）
	F: number; // 焦距（px）
	pp: V2; // 主点（屏幕）
	clip: V2[]; // 视口裁剪多边形（升镜时分屏线从竖转横，两块视口是互补的半平面）
};

export const NEAR = 6; // 近裁剪面（地面像素，≈0.18 米）

export type CamSpace = {x: number; y: number; z: number};

export const toCam = (c: Cam, p: V3): CamSpace => {
	const dx = p[0] - c.pos[0];
	const dy = p[1] - c.pos[1];
	const dz = p[2] - c.pos[2];
	const cp = Math.cos(c.pitch);
	const sp = Math.sin(c.pitch);
	// f = (cp, 0, -sp), r = (0, 1, 0), u = (sp, 0, cp)
	return {x: dy, y: dx * sp + dz * cp, z: dx * cp - dz * sp};
};

export const camToScreen = (c: Cam, q: CamSpace): V2 => {
	const a = (c.F * q.x) / q.z;
	const b = (-c.F * q.y) / q.z;
	const cr = Math.cos(c.roll);
	const sr = Math.sin(c.roll);
	return [c.pp[0] + a * cr - b * sr, c.pp[1] + a * sr + b * cr];
};

export const project = (c: Cam, p: V3): V2 | null => {
	const q = toCam(c, p);
	if (q.z < NEAR) return null;
	return camToScreen(c, q);
};

/** 多边形（3D 点）投影；先在相机空间按近裁剪面裁掉身后的部分 */
export const projectPoly = (c: Cam, pts: V3[]): V2[] => {
	const q = pts.map((p) => toCam(c, p));
	const out: CamSpace[] = [];
	for (let i = 0; i < q.length; i++) {
		const A = q[i];
		const B = q[(i + 1) % q.length];
		const ain = A.z >= NEAR;
		const bin = B.z >= NEAR;
		if (ain) out.push(A);
		if (ain !== bin) {
			const s = (NEAR - A.z) / (B.z - A.z);
			out.push({x: A.x + (B.x - A.x) * s, y: A.y + (B.y - A.y) * s, z: NEAR});
		}
	}
	return out.map((p) => camToScreen(c, p));
};

/** 地面上一点的屏幕缩放（px / 地面 px），用来定点的半径、字号等 */
export const groundScale = (c: Cam, gx: number, gy: number): number => {
	const q = toCam(c, [gx, gy, 0]);
	if (q.z < NEAR) return 0;
	return c.F / q.z;
};

/** 地平线以上（天空）在视口里的多边形；看不见天空时返回 [] */
export const skyPoly = (c: Cam): V2[] => {
	const tp = Math.tan(c.pitch);
	if (!isFinite(tp) || c.pitch > 1.45) return [];
	const rect = c.clip;
	const cr = Math.cos(c.roll);
	const sr = Math.sin(c.roll);
	// 未滚转坐标 b = -(x' sin ρ) + y' cos ρ；天空：b < -F tanφ
	const val = (p: V2) => {
		const xp = p[0] - c.pp[0];
		const yp = p[1] - c.pp[1];
		const b = -xp * sr + yp * cr;
		return -c.F * tp - b; // > 0 在天空一侧
	};
	return clipHalf(rect, val);
};

/** 地平线上的点（屏幕）和“朝天”的单位方向，用来画天色渐变 */
export const horizonFrame = (c: Cam): {p: V2; up: V2} => {
	const tp = Math.tan(c.pitch);
	const b = -c.F * tp;
	const cr = Math.cos(c.roll);
	const sr = Math.sin(c.roll);
	// 未滚转点 (0, b) → 屏幕
	const p: V2 = [c.pp[0] - b * sr, c.pp[1] + b * cr];
	// 未滚转“向上” (0,-1) → 屏幕 (sr, -cr)
	return {p, up: [sr, -cr]};
};

export const clipHalf = (poly: V2[], val: (p: V2) => number): V2[] => {
	const out: V2[] = [];
	for (let i = 0; i < poly.length; i++) {
		const A = poly[i];
		const B = poly[(i + 1) % poly.length];
		const va = val(A);
		const vb = val(B);
		if (va >= 0) out.push(A);
		if (va >= 0 !== vb >= 0) {
			const s = va / (va - vb);
			out.push([A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s]);
		}
	}
	return out;
};

export const FULL: V2[] = [
	[0, 0],
	[1920, 0],
	[1920, 1080],
	[0, 1080],
];

export const bbox = (p: V2[]): [number, number, number, number] => {
	let x0 = Infinity;
	let y0 = Infinity;
	let x1 = -Infinity;
	let y1 = -Infinity;
	for (const q of p) {
		x0 = Math.min(x0, q[0]);
		y0 = Math.min(y0, q[1]);
		x1 = Math.max(x1, q[0]);
		y1 = Math.max(y1, q[1]);
	}
	return [x0, y0, x1 - x0, y1 - y0];
};

/** 正俯视相机：屏幕 = (地面 - c) * zoom + 画面中心 */
export const topCam = (cx: number, cy: number, zoom: number, F = 685): Cam => ({
	pos: [cx, cy, F / zoom],
	pitch: Math.PI / 2,
	roll: Math.PI / 2,
	F,
	pp: [960, 540],
	clip: FULL,
});

export const ptsAttr = (p: V2[]) => p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');

export const lerp = (a: number, b: number, s: number) => a + (b - a) * s;
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smooth = (x: number) => {
	const s = clamp01(x);
	return s * s * (3 - 2 * s);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeInOut = (x: number) => {
	const s = clamp01(x);
	return s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2;
};
