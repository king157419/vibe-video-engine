// 段 2 认零件 · 记录 01 种子（K3，B13–B16）：单个显微视野，直径 760。
// 审片后 P1-1：细菌画大（约 106×38 像素，比芽孢大），推近到 3.6 倍（细胞约 380 像素长），芽孢长在细胞一端、约占 40% 长，
// 硬壳一圈一圈变厚；“蜡样芽孢杆菌”的引线指着细胞另一端的菌体，“硬壳”指着壳环，两根引线不共点；
// 细胞外皮淡掉时“蜡样芽孢杆菌”一起淡掉，之后才出“芽孢”：任何时刻一个对象只挂一个名字。
// 视野里原有的青点先压淡到 35%，到“叫芽孢”时才一起亮起来，建立“青点 = 芽孢”的对应。
import React from 'react';
import type {Timeline} from './data';
import {Icon, Wok} from './icons';
import {Capsule, circleShape, Field, Misc, Spore, SPORE_SCALE, Starch} from './micro';
import {Callout, DORMANT, GERM, Label, MISC, SPORE_ANGLE} from './specimen';
import {C, L} from './theme';
import {fade, lin, mix, pulse, ramp} from './util';

// 中央那个蜡样芽孢杆菌：长 84、宽 30（单位坐标）。芽孢结在 (0,0)，细胞中心往后挪 22，这样芽孢在细胞一端
const CELL_LEN = 84;
const CELL_W = 30;
const SPORE_OFF = 22;
const A0 = SPORE_ANGLE[0];
const CC = {x: -SPORE_OFF * Math.cos(A0), y: -SPORE_OFF * Math.sin(A0)};
const rot = (x: number, y: number) => ({x: x * Math.cos(A0) - y * Math.sin(A0), y: x * Math.sin(A0) + y * Math.cos(A0)});
const ZOOM = 3.6;
// 硬壳三圈（合起来正好等于 Spore 组件的壳：rx 14.85、ry 11.48、线宽约 6.2）
const RINGS = [-2.07, 0, 2.07];

export const PartsScene: React.FC<{T: Timeline; t: number; irisU: number}> = ({T, t, irisU}) => {
	const {cx, cy, r} = L.single;
	const k = r / 300;
	// B14：推近到这个细菌（3.6 倍），结出芽孢，再拉回
	const zin = ramp(t, T.jieChu, 0.9);
	const zout = ramp(t, T.yaBao2End - 0.05, 0.55);
	const zf = zin * (1 - zout);
	const zoom = mix(1, ZOOM, zf);
	const f = {x: CC.x * zf, y: CC.y * zf};
	// 中央的菌：出现 → 菌体一端长出芽孢、硬壳一圈圈变厚 → 菌体淡掉
	const cellIn = ramp(t, T.laYang, 0.45);
	const core = ramp(t, T.jieChu + 0.35, 0.9);
	const ringU = [ramp(t, T.jieChu + 0.95, 0.3), ramp(t, T.yingKe, 0.3), ramp(t, T.yingKe + 0.3, 0.3)];
	const shellHi = pulse(t, T.yingKe, 0.9);
	const wallOff = ramp(t, T.yingKe + 0.6, 0.8);
	// 视野里原有的芽孢：先压淡，“叫芽孢”时一起亮起来（亮一下）
	const sporeLit = mix(0.35, 1, ramp(t, T.yaBao2 + 0.1, 0.5));
	const litGlow = pulse(t, T.yaBao2 + 0.2, 0.9);
	// B15（二审 S1 新语序）：煮饭白闪（全画面闪在 Video 里）→ 白闪一结束杂菌就干瘪（“杀光”时正在死）→ 留下虚线空圈 →“清了场”时空圈淡掉
	const flashT = T.zhuFan + 0.12;
	const dead = lin(t, flashT + 0.3, flashT + 1.4);
	const ghost = Math.min(lin(t, flashT + 1.0, flashT + 1.5), 1 - lin(t, T.qingChang, T.qingChang + 0.9));
	// B16 转折拍（审片后 P2-5）：“芽孢自己”描边加深 →“杀不死”硬壳亮起并保持加粗 →“被催着发芽”壳上出现一道裂纹、轻轻胀大（被叫醒，还没破开）
	const emph = pulse(t, T.yaBao4 - 0.05, 0.8);
	const hold = ramp(t, T.shaBuSi, 0.3);
	const glow = Math.max(litGlow, pulse(t, T.shaBuSi, 0.8), 0.6 * pulse(t, T.beiCui + 0.2, 1.0));
	const swell = ramp(t, T.beiCui + 0.3, 0.6);
	const crack = ramp(t, T.beiCui + 0.15, 0.5);
	const shellW = 1 + 1.6 * emph + 1.0 * hold;
	const toScreen = (x: number, y: number) => ({x: cx + (x - f.x) * k * zoom, y: cy + (y - f.y) * k * zoom});
	// 引线目标：细菌 → 细胞远端的菌体；硬壳 → 壳环顶上；芽孢 → 芽孢中心
	const bodyLocal = rot(-SPORE_OFF - 20, 0);
	const bodyPt = toScreen(bodyLocal.x, bodyLocal.y);
	const ringLocal = rot(0, -13.6);
	const ringPt = toScreen(ringLocal.x, ringLocal.y);
	const centre = toScreen(0, 0);
	// “别的细菌”标签指向的那一个灰色杂菌（二审补；审片后 P2-9：字改深灰）
	const miscPick = MISC[1];
	const miscPt = toScreen(miscPick.x, miscPick.y);
	const miscOp = Math.max(fade(t, T.laYang + 0.6, T.jieChu, 0.3, 0.3), fade(t, T.zhuFan - 0.1, T.bieDe + 0.3, 0.25, 0.4));
	const deg = (A0 * 180) / Math.PI;
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
			<Field id="single" shape={circleShape(cx, cy, r * irisU)} r={r} rim={irisU > 0.98}>
				<g transform={`scale(${zoom}) translate(${-f.x},${-f.y})`}>
					<Starch seed={3} />
					{MISC.map((m, i) => (
						<Misc key={i} x={m.x} y={m.y} a={m.a} kind={m.k} dead={dead} />
					))}
					{ghost > 0
						? MISC.map((m, i) => <circle key={`g${i}`} cx={m.x} cy={m.y} r={22} fill="none" stroke={C.inkFaint} strokeWidth={2.5} strokeDasharray="6 6" opacity={ghost} />)
						: null}
					{GERM.slice(1).map((p, i) => (
						<Spore key={i} x={p.x} y={p.y} a={SPORE_ANGLE[i + 1]} glow={glow} swell={swell} shell={shellW} crack={crack} opacity={sporeLit} />
					))}
					{DORMANT.map((p, i) => (
						<Spore key={`d${i}`} x={p.x} y={p.y} a={SPORE_ANGLE[6 + i]} glow={glow} shell={shellW} opacity={sporeLit} />
					))}
					{/* 中央：蜡样芽孢杆菌 → 一端结出芽孢 */}
					{cellIn > 0 && wallOff < 1 ? (
						<g opacity={cellIn}>
							<Capsule x={CC.x} y={CC.y} a={A0} len={CELL_LEN} w={CELL_W} opacity={1 - wallOff} />
							{core > 0 ? (
								<g transform={`rotate(${deg})`}>
									<ellipse rx={9 * SPORE_SCALE * core} ry={6.5 * SPORE_SCALE * core} fill={C.spore} />
									{RINGS.map((d, i) =>
										ringU[i] > 0 ? (
											<ellipse
												key={i}
												rx={11 * SPORE_SCALE + d}
												ry={8.5 * SPORE_SCALE + d}
												fill="none"
												stroke={C.shell}
												strokeWidth={2.1 + 0.9 * shellHi}
												opacity={ringU[i]}
											/>
										) : null,
									)}
								</g>
							) : null}
						</g>
					) : null}
					{wallOff >= 1 ? <Spore x={0} y={0} a={A0} glow={glow} swell={swell} shell={shellW} crack={crack} /> : null}
				</g>
			</Field>
			{/* 标注（视野右侧）：一个对象只挂一个名字 */}
			<Callout x={1384} y={300} tx={bodyPt.x} ty={bodyPt.y} text="蜡样芽孢杆菌" op={fade(t, T.laYang, T.yingKe + 0.6, 0.35, 0.4)} />
			<Callout x={1384} y={430} tx={ringPt.x} ty={ringPt.y} text="硬壳" op={fade(t, T.yingKe, T.yaBao2End - 0.05, 0.3, 0.3)} />
			<Callout x={1384} y={560} tx={centre.x} ty={centre.y + 6} text="芽孢" op={fade(t, T.yaBao2, T.zuo2 - 0.3)} color={C.shell} />
			<Callout x={1384} y={172} tx={miscPt.x + 8} ty={miscPt.y - 6} text="别的细菌" size={36} op={miscOp} color={C.ink} />
			{/* B15：煮饭 100°C */}
			<g opacity={fade(t, T.zhuFan - 0.1, T.shaGuang, 0.25, 0.5)}>
				<rect x={300} y={150} width={318} height={70} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
				<Icon x={346} y={184} size={54}>
					<Wok />
				</Icon>
				<Label x={386} y={200} text="煮饭 100°C" size={40} />
			</g>
			{/* B16：清场 */}
			<Label x={560} y={760} text="清场" size={48} anchor="end" op={fade(t, T.qingChang, T.zuo2, 0.3, 0.4)} bg={C.paper} />
		</svg>
	);
};
