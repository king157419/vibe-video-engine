// 《沙漏与潮水》主组件：一幅 36 小时的横向长卷。所有画面只由帧号推出。
import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {Cards} from './cards';
import type {Props, Sub} from './data';
import {clamp01, ease, easeOut, lerp, makeClock, makeModel, pchip, pulse, ramp, window01} from './data';
import {Boundary, FinaleExtras} from './ending';
import {ensureFonts} from './fonts';
import {Migrate} from './migrate';
import {DeskScene, DeskSky, deskHour, Formula, FORMULA_W, Parts, TimeTag} from './opening';
import type {Lay, PinState} from './scroll';
import {AccidentPins, AfternoonDip, hm, mixLay, NotEmptyArrow, ScrollNotes, ScrollWorld, skyPath, xm} from './scroll';
import {COL, FLAT_VB, FONT_SANS, FORMULA_K, FORMULA_K_PANO, FPS, PLAYHEAD_X, PX_PER_H, SCROLL_LEFT_X} from './theme';
import {Hand} from './draw';

// ---------------------------------------------------------------- 各种镜头的版式
const SCROLL_BASE: Omit<Lay, 'h0' | 'h1' | 'x0' | 'x1'> = {
	skyY0: 0,
	skyY1: 200,
	v1: 560, // 审片 P0-2：场景带缩小，图表区从 300 px 高放到 365 px 高
	v0: 925,
	pinY: 528,
	pinSize: 48,
	pinRow: 0,
	scene: 1,
	skyLab: 1,
	axis: 0,
	axisY: 925,
	note: 1,
	noteX: 1880,
	noteY: 912,
	hMin: 8,
	hMax: 44,
};
const scrollLay = (P: number): Lay => {
	const camH = Math.max(P, 8 + (PLAYHEAD_X - SCROLL_LEFT_X) / PX_PER_H);
	return {...SCROLL_BASE, h0: camH - PLAYHEAD_X / PX_PER_H, h1: camH + (1920 - PLAYHEAD_X) / PX_PER_H, x0: 0, x1: 1920};
};
// 审片 P1-5：一屏总览和全景里的钉子放大到 48 px（错两行防重叠）
const FIT: Lay = {h0: 20, h1: 44, x0: 80, x1: 1570, skyY0: 118, skyY1: 192, v1: 380, v0: 800, pinY: 404, pinSize: 48, pinRow: 58, scene: 0, skyLab: 0, axis: 1, axisY: 800, note: 1, noteX: 1570, noteY: 908, hMin: 20, hMax: 44};
// 审片 P2-5：顶部总览条整体下移 30 px，天色带不再被画面上沿切掉。
// 审片第二轮 P2-3：再上提 14 px，让公式条落到总览条和两条小卷之间时不压车祸图钉、不压卷轴
// 审片第二轮 P2-8：总览条也标“示意，非实测”（写在总览条右下、补觉卷上方的空白里）
const STRIP: Lay = {h0: 20, h1: 44, x0: 480, x1: 1880, skyY0: 16, skyY1: 66, v1: 166, v0: 326, pinY: 158, pinSize: 40, pinRow: 46, scene: 0, skyLab: 0, axis: 0, axisY: 296, note: 1, noteX: 1880, noteY: 368, hMin: 20, hMax: 44};
const BOUND: Lay = {h0: 30.5, h1: 37, x0: 1000, x1: 1580, skyY0: 250, skyY1: 310, v1: 390, v0: 800, pinY: 372, pinSize: 48, pinRow: 0, scene: 0, skyLab: 0, axis: 1, axisY: 800, note: 1, noteX: 1580, noteY: 908, hMin: 30.5, hMax: 37};
// 全景右侧留 600 px 给规则、留题、AI 标识（审片 P1-6）
const PANO: Lay = {h0: 8, h1: 44, x0: 60, x1: 1300, skyY0: 20, skyY1: 130, v1: 290, v0: 680, pinY: 250, pinSize: 48, pinRow: 56, scene: 0, skyLab: 0, axis: 1, axisY: 680, note: 0, noteX: 1380, noteY: 770, hMin: 8, hMax: 44};

// ---------------------------------------------------------------- 字幕（底部单行、固定位置、半透明黑底条）
// 审片 P1-6：AI 标识不再占字幕位置，改为全景图右下角常驻（见 ending.tsx 的 FinaleExtras）
const Subtitles: React.FC<{subs: Sub[]; t: number}> = ({subs, t}) => {
	const cur = subs.find((s) => t >= s.t0 - 0.001 && t < s.t1);
	let text = '';
	let op = 0;
	const small = false;
	if (cur) {
		text = cur.zh;
		op = Math.min(ramp(t, cur.t0, 0.12), 1 - ramp(t, cur.t1 - 0.12, 0.12));
	}
	if (!text || op <= 0) return null;
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: 972, height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: op}}>
			<div
				style={{
					background: 'rgba(0,0,0,0.58)',
					borderRadius: 10,
					padding: small ? '6px 24px' : '6px 28px',
					fontFamily: FONT_SANS,
					fontWeight: 500,
					fontSize: small ? 36 : 40,
					lineHeight: small ? '50px' : '54px',
					color: small ? 'rgba(255,255,255,0.85)' : '#ffffff',
					whiteSpace: 'nowrap',
					letterSpacing: 1,
				}}
			>
				{text}
			</div>
		</div>
	);
};

// ---------------------------------------------------------------- 纹理（固定种子预生成，multiply 叠加）
const Tiles: React.FC<{src: string; offset: number; y: number; h: number; tileW: number; opacity?: number; clip?: string}> = ({src, offset, y, h, tileW, opacity = 1, clip}) => {
	const o = ((offset % tileW) + tileW) % tileW;
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, mixBlendMode: 'multiply', opacity, clipPath: clip ? `path('${clip}')` : undefined, pointerEvents: 'none'}}>
			{[0, 1].map((k) => (
				<Img key={k} src={staticFile(src)} style={{position: 'absolute', left: -o + k * tileW, top: y, width: tileW, height: h}} />
			))}
		</div>
	);
};

export const Video: React.FC<Props> = ({subs, beats, nums}) => {
	ensureFonts();
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const pre = useMemo(() => {
		if (!subs || !beats || !nums) return null;
		const clock = makeClock(subs, beats);
		const model = makeModel(nums);
		const sk = beats.camera.filter((c) => c[1] === 'scroll');
		const P = pchip(
			sk.map((c) => c[0]),
			sk.map((c) => c[2] as number),
		);
		const fitKey = beats.camera.find((c) => c[1] === 'fit');
		// 第二天里缝 ≥ 0.20 的几段（“两段宽缝”）：从数据算，不手写
		const windows: [number, number][] = [];
		let a: number | null = null;
		nums.main.t.forEach((h, i) => {
			const g = nums.main.S[i] - nums.main.C[i];
			if (h >= 24 && g >= 0.2 && a === null) a = h;
			if (a !== null && (g < 0.2 || i === nums.main.t.length - 1)) {
				windows.push([a, h]);
				a = null;
			}
		});
		return {clock, model, P, scrollEnd: sk[sk.length - 1][0], fitT: fitKey ? fitKey[0] : 84.2, windows};
	}, [subs, beats, nums]);
	if (!pre || !subs || !beats || !nums) return <AbsoluteFill style={{background: COL.paper}} />;
	const {clock, model, P, scrollEnd, fitT, windows} = pre;

	const tScroll = clock.cam('scroll');
	const tSplit = clock.cam('split');
	const tBound = clock.cam('boundary');
	const tPano = clock.cam('panorama');
	const panoDur = clock.evDur('拉远成全景终局图');

	// ---------------- 故事时间
	const hDesk = deskHour(t, nums.opening.clockKeys);
	const play = P(t);
	const D = t <= scrollEnd ? play : lerp(P(scrollEnd), 44, ease(ramp(t, scrollEnd, fitT - scrollEnd)));

	// ---------------- 当前版式
	let L: Lay;
	let worldOp = 1;
	if (t < scrollEnd) L = scrollLay(play);
	else if (t < fitT) L = mixLay(scrollLay(P(scrollEnd)), FIT, ease(ramp(t, scrollEnd, fitT - scrollEnd)));
	else if (t < tSplit) L = FIT;
	else if (t < tBound) {
		L = mixLay(FIT, STRIP, ease(ramp(t, tSplit, 1.2)));
		L.axis = 1 - ramp(t, tSplit, 0.35); // 时间轴先收掉，免得刻度字在缩小途中压到总览条
	}
	else if (t < tPano) L = BOUND;
	else L = mixLay(BOUND, PANO, ease(ramp(t, tPano, panoDur)));
	// 审片 P2-7：边界屏右半（早上那段的放大）等第 28 句“缓的那口气不是恢复”出现时才出来
	const s28w = clock.sub(28).t0;
	if (t >= tBound - 0.01 && t < tPano) worldOp = ramp(t, s28w, 0.6);
	if (t < tBound && t >= tBound - 0.4) worldOp = 1 - ramp(t, tBound - 0.4, 0.4);
	const worldIn = ramp(t, tScroll + 0.05, 0.45); // 认零件的小图先淡完（opening.tsx），长卷再出

	// ---------------- 钉子
	const pinGlow = (i: number) => (i === 0 ? pulse(t, clock.ev('伦敦 21:00 钉'), 1.2) : 0);
	const pins: PinState[] = beats.pins.map((p, i) => ({text: p.text, hour: p.hour, p: ramp(t, p.showAt, p.writeSec), glow: pinGlow(i)}));

	// ---------------- 讲解时的高亮
	const s11 = clock.sub(11);
	const s12 = clock.sub(12);
	const s20 = clock.sub(20);
	const s28 = clock.sub(28);
	const evA = clock.ev('便签A的线叠到灰面积上沿');
	const accDrops = nums.accidents.peaks.map((h) => clock.ev(`车祸高峰 ${String(h).padStart(2, '0')}:00 落下`));
	const accHours = nums.accidents.peaks.map((h) => h + 24);
	const hatchDim = t >= s20.t0 && t < tSplit + 0.6 ? ramp(t, s20.t0, 0.8) * (1 - ramp(t, tSplit, 0.6)) : 0;
	// 审片第二轮 P1-1：#17 读完后“压平”——潮水拉直、每个钟点的缝厚度不变，沙漏线就长成 B；B 的线飞下来重合；钉子虚线往下延长到 B
	const evFlat = clock.ev('压平');
	const evBack = clock.ev('还原');
	const backDur = clock.evDur('还原');
	const flatF = ease(ramp(t, evFlat, clock.evDur('压平'))) * (1 - ease(ramp(t, evBack, backDur)));
	const matchK = ease(ramp(t, clock.ev('四枚钉子的虚线'), clock.evDur('四枚钉子的虚线'))) * (1 - ease(ramp(t, evBack, backDur * 0.5)));
	// 压平前后 0.3 秒，跟着沙漏/潮水原位画的附加物（“2–4点”括号）先收起、还原后再出（先收再动）
	const offFlat = 1 - window01(t, evFlat - 0.3, evBack + backDur + 0.3, 0.3, 0.3);
	const o = {
		pins,
		pinLeader: t < tSplit ? 1 : t < tBound ? 0.6 : 0.9,
		stagger: true,
		hatchDim,
		windows,
		blueSeg: {a: 21, b: 23.4, k: window01(t, s12.t0 + 0.5, s12.t1, 0.4, 0.4)},
		dimScene: window01(t, s11.t0 + 0.5, s11.t1, 0.4, 0.4),
		blueGlow: pulse(t, evA + clock.evDur('便签A的线叠到灰面积上沿'), 1.0),
		grayGlow: Math.max(pulse(t, clock.ev('C 的下午段描粗'), 1.2), window01(t, s28.t0, s28.t0 + 2.6, 0.4, 0.6)),
		opacity: worldOp * worldIn,
		// 车祸钟点（48 px 红字）落下时，挨着它们的普通刻度字淡掉，不叠字
		// 审片第二轮 P2-4：车祸钟点和普通刻度不再交叉淡化——时间轴整条收掉（tSplit 后 0.35 秒）之前，普通刻度一直不回来
		axisSkip: {hours: accHours, k: ramp(t, accDrops[0], 0.5) * (1 - ramp(t, tSplit + 0.4, 0.1))},
		flat: flatF > 0 ? {f: flatF, vb: FLAT_VB, match: matchK} : undefined,
		idp: 'w',
	};

	// ---------------- 审片 P0-1：“沙漏没倒”箭头（贴着灰面积上沿朝右上），压成一屏后留作残影
	const arrT = clock.ev('沙漏线旁箭头');
	const arrP = ramp(t, arrT, clock.evDur('沙漏线旁箭头'));
	const arrLeft = Math.max(24, hm(scrollLay(P(arrT)), 40));
	const arrH1 = lerp(arrLeft, Math.min(39.0, D - 0.4), easeOut(arrP));
	const evCpm = clock.ev('C 的下午段描粗');
	const s17 = clock.sub(17);
	const arrDim = ramp(t, evA, 0.5) * (1 - ramp(t, evCpm, 0.5)); // A 的线叠在沙漏上时先压淡，免得两条墨线打架
	const arrOp = t < arrT ? 0 : (1 - 0.65 * arrDim) * (1 - ramp(t, s17.t1 - 0.5, 0.45)); // 和 C 的线一起先收（压平只动图表）
	const arrGlow = pulse(t, evCpm, 1.4);
	const arrLabel = clamp01(arrP * 1.6 - 0.5);
	// 全景里也留“沙漏没倒”箭头（分镜表 §2.8），标签挪到“最困”钉线和 06:00 车祸线之后、“缓一口气”钉线之前的空当
	const panoArr = t >= tPano ? ramp(t, tPano + panoDur * 0.7, 0.6) : 0;
	// 二审：“2–4点”浅坑小标（字幕 #15 改句后钟点挪到画面上），压成一屏后留作残影，迁移段前收掉
	const dipT = clock.ev('午后浅坑小标');
	const dipP = ramp(t, dipT, clock.evDur('午后浅坑小标'));
	const dipOp = t < dipT ? 0 : (1 - ramp(t, tSplit, 0.5)) * offFlat;

	// ---------------- 左上纸签、公式
	const tagHour = t < tScroll ? hDesk : play;
	const tagOp = t < scrollEnd ? 1 : 1 - ramp(t, scrollEnd, 0.5);
	const s8 = clock.sub(8);
	const formP = ramp(t, s8.t0 + 4.1, 1.0);
	const s26 = clock.sub(26);
	// 审片第二轮 P2-6：常驻公式条 48 px（全景 56 px）；P2-3：落到两卷中间时放在总览条和卷轴之间的空当里（42 px，高 86 px）
	let fx = 30;
	let fy = lerp(138, 18, ease(ramp(t, scrollEnd, 0.8)));
	let fk = FORMULA_K;
	const kMid = 1.0;
	const toMid = ease(ramp(t, s26.t0, 0.8)) * (1 - ease(ramp(t, tBound, 0.8)));
	fx = lerp(fx, 960 - (FORMULA_W * kMid) / 2, toMid);
	fy = lerp(fy, 332, toMid);
	fk = lerp(fk, kMid, toMid);
	// 审片第二轮 P2-4：拉远成全景时公式不再横穿图表飞过去（会扫过“缓一口气”钉子）：原地淡出，在右栏淡入
	let formOp = 1;
	if (t >= tPano) {
		const swap = tPano + 0.35;
		if (t < swap) formOp = 1 - ramp(t, tPano, 0.35);
		else {
			fx = 1315;
			fy = 236;
			fk = FORMULA_K_PANO;
			formOp = ramp(t, tPano + panoDur - 0.6, 0.6);
		}
	}
	const formGlow = 0.85 * pulse(t, s26.t0 + 0.9, 1.2);

	// ---------------- 各段的不透明度
	const deskOp = 1 - ramp(t, tScroll, 0.6);
	const cardsOp = 1 - ramp(t, tSplit, 0.6);
	const migOp = t < tSplit ? 0 : 1 - ramp(t, tBound - 0.4, 0.4);
	// 审片 P2-8：边界屏左半和迁移段的淡出交叠 0.3 秒，不留空屏
	const bndOp = t < tBound - 0.3 ? 0 : ramp(t, tBound - 0.3, 0.4) * (1 - ramp(t, tPano, 0.6));
	const finOp = t < tPano ? 0 : 1;

	// ---------------- 纹理位置
	const offAt = (tt: number) => (tt < tScroll ? 0 : (Math.max(P(Math.min(tt, scrollEnd)), 8 + (PLAYHEAD_X - SCROLL_LEFT_X) / PX_PER_H) - (8 + (PLAYHEAD_X - SCROLL_LEFT_X) / PX_PER_H)) * PX_PER_H);
	const paperOff = offAt(t);
	let washClip = '';
	let washY = 0;
	let washH = 240;
	let washOp = 0;
	if (t < tScroll + 0.6) {
		washClip = 'M0 0 L1920 0 L1920 226 C1500 236 1100 220 700 232 C400 240 200 222 0 230 Z';
		washOp = deskOp;
	}
	if (t >= tScroll && t < tSplit + 1.2) {
		const ha = Math.max(L.hMin, hm(L, -60));
		const hb = Math.min(D, L.hMax, hm(L, 1980));
		if (hb > ha) {
			washClip = skyPath(L, ha, hb, L.skyY0, L.skyY1, 0);
			washY = L.skyY0;
			washH = L.skyY1 - L.skyY0 + 12;
			washOp = worldIn * (1 - ramp(t, tSplit, 0.6));
		}
	}

	const accLabel = ramp(t, clock.ev('标签“英国'), 0.6) * (1 - ramp(t, tSplit, 0.5));
	const axisBold = ramp(t, clock.ev('标签“英国'), 0.5) * (1 - ramp(t, tSplit, 0.5));

	return (
		<AbsoluteFill style={{background: COL.paper}}>
			<Audio src={staticFile('v3/nightowl/mix.wav')} />
			<svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
				{/* 开头：书桌（K1）+ 押注 + 认零件 */}
				<DeskSky hour={hDesk} opacity={deskOp} />
				<DeskScene t={t} hour={hDesk} model={model} clock={clock} opacity={deskOp} />
				<Parts t={t} model={model} clock={clock} deskHourNow={hDesk} />
				{/* 主长卷 */}
				{t >= tScroll ? (
					<ScrollWorld L={L} D={D} t={t} model={model} nums={nums} clock={clock} o={o}>
						{t >= clock.sub(18).t0 && t < tBound ? (
							<g opacity={1 - ramp(t, tBound - 0.4, 0.4)}>
								{axisBold > 0 ? <line x1={xm(L, 20)} y1={L.axisY} x2={xm(L, 44)} y2={L.axisY} stroke={COL.ink} strokeWidth={5} opacity={axisBold * L.axis} /> : null}
								<AccidentPins L={L} t={t} drops={accDrops} hours={accHours} labelOp={L.axis * (1 - ramp(t, tSplit, 0.4))} topY={L.v1} r={lerp(11, 8, ramp(t, tSplit, 1.2))} />
							</g>
						) : null}
						{t >= tPano ? <AccidentPins L={L} t={t} drops={accDrops} hours={accHours} labelOp={0} topY={L.v1} r={9} /> : null}
						{arrOp > 0 && t < tSplit ? <NotEmptyArrow L={L} model={model} h0={24} h1={arrH1} label={arrLabel} labelH={32.0} opacity={arrOp} glow={arrGlow} lift={16 * (1 - L.scene)} /> : null}
						{dipOp > 0 && t < tSplit + 0.6 ? <AfternoonDip L={L} model={model} ha={nums.keys.tideDip + 24 - 1} hb={nums.keys.tideDip + 24 + 1} p={dipP} opacity={dipOp} labelShift={-40 * (1 - L.scene)} /> : null}
						{panoArr > 0 ? <NotEmptyArrow L={L} model={model} h0={24} h1={39.0} label={1} labelH={33.0} opacity={panoArr} ls={48} /> : null}
					</ScrollWorld>
				) : null}
				{t >= tScroll && t < scrollEnd + 0.8 ? <ScrollNotes L={L} t={t} model={model} clock={clock} opacity={(1 - ramp(t, scrollEnd, 0.6)) * worldIn} /> : null}
				{accLabel > 0 ? (
					<g opacity={accLabel}>
						{/* 审片 P2-10：画面只留出处，不和字幕“英国统计过打瞌睡造成的车祸”重复 */}
						<Hand x={80} y={262} size={40} color={COL.ink}>
							{nums.accidents.label.replace(/打瞌睡车祸$/, '')}
						</Hand>
					</g>
				) : null}
				<Migrate t={t} clock={clock} nums={nums} model={model} opacity={migOp} />
				<Boundary t={t} clock={clock} nums={nums} model={model} opacity={bndOp} />
				<FinaleExtras t={t} clock={clock} opacity={finOp} />
				<Cards t={t} clock={clock} nums={nums} model={model} L={t >= scrollEnd ? L : null} opacity={cardsOp} />
				<TimeTag hour={tagHour} opacity={tagOp} />
				<Formula x={fx} y={fy} k={fk} p={formP} glow={formGlow} opacity={formOp} />
			</svg>
			{washOp > 0 && washClip ? <Tiles src="v3/nightowl/tex/wash.png" offset={paperOff} y={washY} h={washH} tileW={2048} opacity={washOp * 0.3} clip={washClip} /> : null}
			<Tiles src="v3/nightowl/tex/paper.png" offset={paperOff} y={0} h={1080} tileW={2048} />
			<Subtitles subs={subs} t={t} />
		</AbsoluteFill>
	);
};
