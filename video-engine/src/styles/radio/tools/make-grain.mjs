// 生成「深夜电台」样式用的静态胶片颗粒贴图（确定性，可复现）
// 用法：node src/styles/radio/tools/make-grain.mjs  → public/styles/radio/grain.png
// 颗粒以「约 2px 的软团块」为主、少量单像素细噪：观感像胶片，且比纯像素噪点好压缩得多。
import {writeFileSync, mkdirSync} from 'node:fs';
import {deflateSync} from 'node:zlib';

const SIZE = 384;
let seed = 20260929;
const rnd = () => {
	// mulberry32
	seed |= 0;
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5; // ~[-1,1]

const HALF = SIZE / 2;
const coarse = Array.from({length: HALF * HALF}, gauss);
const fine = Array.from({length: SIZE * SIZE}, gauss);
// 半分辨率噪声双线性放大（可平铺：坐标取模）
const sampleCoarse = (x, y) => {
	const fx = x / 2 - 0.25;
	const fy = y / 2 - 0.25;
	const x0 = Math.floor(fx);
	const y0 = Math.floor(fy);
	const tx = fx - x0;
	const ty = fy - y0;
	const at = (xx, yy) => coarse[(((yy % HALF) + HALF) % HALF) * HALF + (((xx % HALF) + HALF) % HALF)];
	const a = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
	const b = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
	return a * (1 - ty) + b * ty;
};

const raw = Buffer.alloc(SIZE * (SIZE * 2 + 1)); // 灰度+alpha
for (let y = 0; y < SIZE; y++) {
	const row = y * (SIZE * 2 + 1);
	raw[row] = 0; // filter: none
	for (let x = 0; x < SIZE; x++) {
		const v = 1.25 * sampleCoarse(x, y) + 0.3 * fine[y * SIZE + x];
		const lum = v > 0 ? 255 : 0;
		const a = Math.min(255, Math.round(Math.abs(v) * 190));
		raw[row + 1 + x * 2] = lum;
		raw[row + 2 + x * 2] = a;
	}
}

const crcTable = new Uint32Array(256).map((_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	return c >>> 0;
});
const crc32 = (buf) => {
	let c = 0xffffffff;
	for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length);
	const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(td));
	return Buffer.concat([len, td, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 4; // grayscale + alpha
const png = Buffer.concat([
	Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
	chunk('IHDR', ihdr),
	chunk('IDAT', deflateSync(raw, {level: 9})),
	chunk('IEND', Buffer.alloc(0)),
]);
mkdirSync('public/styles/radio', {recursive: true});
writeFileSync('public/styles/radio/grain.png', png);
console.log('grain.png', png.length, 'bytes');
