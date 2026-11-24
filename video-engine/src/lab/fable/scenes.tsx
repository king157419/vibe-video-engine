import React from 'react';
import {bump, clamp01, easeOut, fade, lin, progress} from './anim';
import type {Board, Drawn, Text} from './board';
import type {MarkerPath} from './parts';
import {HandText, Hatch, Ink, Marker, Written} from './parts';
import {AMBER, AMBER_DEEP, INK, INK_SOFT, LW, SANS} from './theme';

// 场景组件：每个都只读 board 里的数据 + 当前 ms，画出「此刻应该画到哪」。世界坐标，外层 <g> 负责镜头。

type P = {b: Board; ms: number; vi: number};

const D: React.FC<{d: Drawn; ms: number; vi: number; color?: string; width?: number; opacity?: number; dash?: string; lag?: number}> = ({d, ms, vi, color, width, opacity, dash, lag}) => (
	<Ink geo={d.geo} p={progress(ms, d.t0, d.dur)} vi={vi} color={color} width={width} opacity={opacity} dash={dash} lag={lag} />
);
const Tx: React.FC<{t: Text; ms: number; id: string; color?: string; weight?: number; family?: string; opacity?: number; wobble?: number}> = ({t, ms, id, color, weight, family, opacity, wobble}) => (
	<HandText text={t.text} x={t.x} y={t.y} size={t.size} t0={t.t0} dur={t.dur} ms={ms} id={id} anchor={t.anchor} color={color} weight={weight} family={family} opacity={opacity} wobble={wobble} />
);

const Mk: React.FC<{m: {m: MarkerPath; t0: number; dur: number}; ms: number; color?: string; size?: number; opacity?: number}> = ({m, ms, color, size, opacity}) => (
	<Marker m={m.m} p={lin(ms, m.t0, m.dur)} color={color} size={size} opacity={opacity} />
);

// ---------- 手机 + 聊天 + 朋友圈 ----------
export const Phone: React.FC<P> = ({b, ms, vi}) => {
	const {T, phone, feed} = b;
	const k = fade(ms, T.pick, 280) - fade(ms, T.down, 280) + fade(ms, T.again, 280) - fade(ms, T.noreply, 420);
	const ang = -7 * k;
	const chatOut = fade(ms, T.feed, 360);
	const feedIn = ms >= T.feed ? fade(ms, T.feed + 120, 260) : 0;
	return (
		<g transform={`translate(0 ${-22 * k}) rotate(${ang} ${phone.pivot[0]} ${phone.pivot[1]})`}>
			<D d={phone.body} ms={ms} vi={vi} />
			<D d={phone.screen} ms={ms} vi={vi} width={LW.thin} color={INK_SOFT} />
			<D d={phone.speaker} ms={ms} vi={vi} width={LW.thin} color={INK_SOFT} />
			{chatOut < 1 ? (
				<g opacity={1 - chatOut}>
					<D d={phone.sent} ms={ms} vi={vi} width={LW.thin} />
					{phone.sentLines.map((d, i) => (
						<D key={i} d={d} ms={ms} vi={vi} width={2} color={INK_SOFT} />
					))}
					<D d={phone.ask} ms={ms} vi={vi} width={LW.thin} />
					<Tx t={phone.askText} ms={ms} id="ask" weight={600} />
					<D d={phone.reply} ms={ms} vi={vi} width={LW.thin} color={INK_SOFT} dash="9 9" />
				</g>
			) : null}
			{feedIn > 0 ? (
				<g opacity={feedIn}>
					<Tx t={feed.title} ms={ms} id="feedt" weight={700} wobble={0.5} />
					<D d={feed.rule} ms={ms} vi={vi} width={LW.hair} color={INK_SOFT} />
					{feed.posts.map((post, pi) =>
						post.map((d, i) => <D key={`${pi}-${i}`} d={d} ms={ms} vi={vi} width={LW.hair} color={pi === 2 ? INK_SOFT : INK} opacity={pi === 2 ? 0.6 : 0.9} />),
					)}
					<Tx t={feed.time} ms={ms} id="ftime" color={INK_SOFT} family={SANS} weight={600} wobble={0.4} />
					<Hatch d={feed.heartFill} p={fade(ms, T.likeEnd - 200, 260)} box={feed.heartBox} id="hf" color={AMBER_DEEP} opacity={0.85} width={1.6} />
					<D d={feed.heart} ms={ms} vi={vi} width={LW.thin} />
					<D d={feed.ring} ms={ms} vi={vi} width={3} color={AMBER} opacity={0.95} />
				</g>
			) : null}
		</g>
	);
};

// ---------- 时钟 ----------
export const Clock: React.FC<P> = ({b, ms, vi}) => {
	const {T, clock} = b;
	if (ms < T.clock) return null;
	const u1 = progress(ms, clock.sweep1.t0, clock.sweep1.dur);
	const u2 = progress(ms, clock.sweep2.t0, clock.sweep2.dur);
	const minute = 180 * u1 + 70 * u2;
	const hour = 240 + 15 * u1 + 6 * u2;
	const handsIn = fade(ms, T.clock + 720, 240);
	const {cx, cy, r} = clock;
	const hand = (deg: number, len: number, w: number) => {
		const a = (deg * Math.PI) / 180;
		return <line x1={cx} y1={cy} x2={cx + Math.sin(a) * len} y2={cy - Math.cos(a) * len} stroke={INK} strokeWidth={w} strokeLinecap="round" />;
	};
	return (
		<g>
			<D d={clock.face} ms={ms} vi={vi} />
			{clock.ticksGeo.map((g, i) => (
				<Ink key={i} geo={g} p={progress(ms, T.clock + 420 + i * 30, 120)} width={i % 3 === 0 ? LW.thin : LW.hair} color={INK_SOFT} />
			))}
			<g opacity={handsIn}>
				{hand(hour, r * 0.5, 5)}
				{hand(minute, r * 0.78, 3.6)}
				<circle cx={cx} cy={cy} r={6} fill={INK} />
			</g>
			<Written w={clock.label} ms={ms} id="half" />
		</g>
	);
};

// ---------- 「正」计数 ----------
export const Tally: React.FC<P> = ({b, ms, vi}) => (
	<g>
		{b.tally.strokes.map((d, i) => (
			<D key={i} d={d} ms={ms} vi={vi} />
		))}
		<Tx t={b.tally.label} ms={ms} id="tally" color={INK_SOFT} weight={600} family={SANS} wobble={0.5} />
	</g>
);

// ---------- 火 ----------
export const Fire: React.FC<P> = ({b, ms, vi}) => {
	const {T, fire} = b;
	if (ms < T.fire) return null;
	const rise = 120 * (1 - easeOut(lin(ms, T.fire, 900)));
	const dim = 1 - 0.7 * fade(ms, T.calmWord, 700);
	const pf = fade(ms, fire.fillAt, 520);
	return (
		<g transform={`translate(0 ${rise})`} opacity={dim}>
			<Hatch d={fire.fillOut} p={pf} box={fire.box} id="fo" color={AMBER} opacity={0.28} width={2.4} angle={-60} />
			<Hatch d={fire.fillIn} p={pf} box={fire.box} id="fi" color={AMBER} opacity={0.62} width={3} angle={-60} />
			<D d={fire.outer} ms={ms} vi={vi} />
			<D d={fire.inner} ms={ms} vi={vi} width={LW.thin} color={AMBER_DEEP} />
		</g>
	);
};

// ---------- 过渡箭头 ----------
export const Bridge: React.FC<P> = ({b, ms, vi}) => (
	<g>
		{b.bridge.map((d, i) => (
			<D key={i} d={d} ms={ms} vi={vi} />
		))}
	</g>
);

// ---------- 三层图 ----------
export const Stack: React.FC<P> = ({b, ms, vi}) => {
	const {T, stack: s} = b;
	if (ms < s.outline[0].t0) return null;
	const swapA = fade(ms, T.person, 380); // 顶/中层旧内容退场
	const swapB = fade(ms, T.job, 380); // 人 → 工作
	const fillP = fade(ms, s.fillAt, 720);
	const fillA = 0.5 * (1 - 0.78 * fade(ms, T.neglect, 480) + 0.78 * fade(ms, T.back, 420));
	const pulse = 1 + 0.035 * Math.max(bump(ms, T.back, 600), bump(ms, T.pop, 500), bump(ms, T.clear, 500));
	const bot = s.layers[2];
	const popP = fade(ms, T.pop + 320, 420);
	return (
		<g>
			{/* 底层的琥珀色排线，跟着「起作用 / 没照顾到 / 再冒出来」明暗变化 */}
			<g transform={`translate(${bot.x + bot.w / 2} ${bot.cy}) scale(${pulse}) translate(${-(bot.x + bot.w / 2)} ${-bot.cy})`}>
				<Hatch d={s.fill} p={fillP} box={s.fillBox} id="bf" color={AMBER} opacity={fillA} width={2.8} angle={-8} />
			</g>
			{s.outline.map((d, i) => (
				<D key={`o${i}`} d={d} ms={ms} vi={vi} width={LW.thin} color={INK_SOFT} />
			))}
			{s.trace.map((d, i) => (
				<D key={`t${i}`} d={d} ms={ms} vi={vi} width={i === 2 ? LW.marker - 1 : LW.main} />
			))}
			{s.labels.map((w, i) => (
				<Written key={`l${i}`} w={w} ms={ms} id={`lab${i}`} />
			))}
			<Written w={s.needWord} ms={ms} id="need" color={AMBER_DEEP} />
			<Mk m={s.needRing} ms={ms} size={10} opacity={0.85} />
			{s.upArrow.map((d, i) => (
				<D key={`u${i}`} d={d} ms={ms} vi={vi} color={AMBER_DEEP} width={LW.marker - 1} opacity={0.9} />
			))}

			{/* 顶层内容 A：小气泡 + 小时钟 */}
			{swapA < 1 ? (
				<g opacity={1 - swapA} transform={`translate(${-240 * swapA} 0)`}>
					<D d={s.topA.bubble} ms={ms} vi={vi} width={LW.thin} />
					{s.topA.lines.map((d, i) => (
						<D key={i} d={d} ms={ms} vi={vi} width={2} color={INK_SOFT} />
					))}
					<D d={s.topA.clock} ms={ms} vi={vi} width={LW.thin} />
					{ms >= s.topA.clock.t0 + s.topA.clock.dur ? (
						<g opacity={fade(ms, s.topA.clock.t0 + s.topA.clock.dur, 200)}>
							<line x1={s.topA.clockC[0]} y1={s.topA.clockC[1]} x2={s.topA.clockC[0]} y2={s.topA.clockC[1] + 30} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
							<line x1={s.topA.clockC[0]} y1={s.topA.clockC[1]} x2={s.topA.clockC[0] - 18} y2={s.topA.clockC[1] - 10} stroke={INK} strokeWidth={3} strokeLinecap="round" />
						</g>
					) : null}
				</g>
			) : null}
			{/* 顶层内容 B：换一个人 */}
			{ms >= T.person && swapB < 1 ? (
				<g opacity={1 - swapB} transform={`translate(${-240 * swapB} 0)`}>
					<D d={s.person.head} ms={ms} vi={vi} width={LW.thin} />
					<D d={s.person.body} ms={ms} vi={vi} width={LW.thin} />
					{s.person.lines.map((d, i) => (
						<D key={i} d={d} ms={ms} vi={vi} width={2} color={INK_SOFT} />
					))}
				</g>
			) : null}
			{/* 顶层内容 C：换一份工作 */}
			{ms >= T.job ? (
				<g>
					<D d={s.job.box} ms={ms} vi={vi} width={LW.thin} />
					<D d={s.job.handle} ms={ms} vi={vi} width={LW.thin} />
					<D d={s.job.latch} ms={ms} vi={vi} width={LW.hair} color={INK_SOFT} />
					{s.job.lines.map((d, i) => (
						<D key={i} d={d} ms={ms} vi={vi} width={2} color={INK_SOFT} />
					))}
				</g>
			) : null}

			{/* 中层内容 A：正 / 追问 / 放大镜 */}
			{swapA < 1 ? (
				<g opacity={1 - swapA} transform={`translate(${-240 * swapA} 0)`}>
					{s.midA.zheng.map((d, i) => (
						<D key={i} d={d} ms={ms} vi={vi} width={LW.thin} />
					))}
					<D d={s.midA.bubble} ms={ms} vi={vi} width={LW.thin} />
					<Tx t={s.midA.bubbleText} ms={ms} id="mask" weight={600} wobble={0.6} />
					<D d={s.midA.glass} ms={ms} vi={vi} width={LW.thin} />
					<D d={s.midA.handle} ms={ms} vi={vi} />
					<D d={s.midA.glassHeart} ms={ms} vi={vi} width={LW.hair} color={AMBER_DEEP} />
				</g>
			) : null}
			{/* 中层内容 B：新的反应，还只是几道潦草线 */}
			{s.midB.map((d, i) => (
				<D key={`mb${i}`} d={d} ms={ms} vi={vi} width={2.2} color={INK_SOFT} />
			))}

			{/* 底层：那句话 + 琥珀色下划线 */}
			<Tx t={s.important} ms={ms} id="imp" weight={800} />
			<Mk m={s.underline} ms={ms} size={11} opacity={0.85} />

			{/* 再冒出来一次 */}
			{ms >= T.pop ? (
				<g>
					<Hatch d={s.pop.fill} p={popP} box={s.pop.box} id="pf" color={AMBER} opacity={0.6} width={2.4} angle={-60} />
					<D d={s.pop.outline} ms={ms} vi={vi} />
				</g>
			) : null}

			{/* 结尾：琥珀色再描一遍三层 */}
			{b.finale.map((m, i) => (
				<Mk key={`f${i}`} m={m} ms={ms} size={12} opacity={0.8} />
			))}
		</g>
	);
};

// ---------- 「别想太多」 ----------
export const Dont: React.FC<P> = ({b, ms, vi}) => {
	const {dont} = b;
	if (ms < dont.bubble.t0) return null;
	const out = 1 - fade(ms, dont.gone, 520);
	if (out <= 0) return null;
	return (
		<g opacity={out}>
			<D d={dont.bubble} ms={ms} vi={vi} width={LW.thin} color={INK_SOFT} />
			<Tx t={dont.text} ms={ms} id="dont" weight={700} />
			{dont.strike.map((m, i) => (
				<Mk key={i} m={m} ms={ms} color={INK} size={9} opacity={0.95} />
			))}
		</g>
	);
};

export const clampU = clamp01;
