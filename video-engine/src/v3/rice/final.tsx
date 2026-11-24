// 段 8 收束（B44–B49）：拉回厨房（压暗当底）→ 终局卡（时间 × 温度 + 两条规则 + 做法）→ 题卡。
// 卡上的字都是关键词 / 符号式，不和旁白同句（审稿 R8）。
import React from 'react';
import type {Numbers, Timeline} from './data';
import {Arrow, Box, Check, Cross, Fridge, Icon, Moon, Pause, Stopwatch, ToxinDot} from './icons';
import {GrainMacro, Kitchen} from './kitchen';
import {C, SANS, SERIF} from './theme';
import {easeOut, fade, lin, mix, pop, ramp, textW} from './util';

const CELL: Record<string, {fill: string; text: string}> = {
	睡: {fill: C.spore, text: '#ffffff'},
	长: {fill: C.bac, text: '#ffffff'},
	毒: {fill: C.toxin, text: '#ffffff'},
	停: {fill: C.coldBar, text: C.ink},
};

const T48 = (p: {x: number; y: number; text: string; op?: number; color?: string; size?: number; weight?: number; family?: string; anchor?: 'start' | 'middle' | 'end'}) =>
	(p.op ?? 1) > 0.001 ? (
		<text x={p.x} y={p.y} textAnchor={p.anchor ?? 'start'} fontFamily={p.family ?? SANS} fontWeight={p.weight ?? 600} fontSize={p.size ?? 48} fill={p.color ?? C.ink} opacity={p.op ?? 1}>
			{p.text}
		</text>
	) : null;

export const FinalScene: React.FC<{T: Timeline; t: number; num: Numbers}> = ({T, t, num}) => {
	// 审片后 P1-3：拉回从“记住两句”开口时开始（原来在“一天内吃完”一念完就拉回，段 7 小结只露约 1 秒）
	if (t < T.jiZhu - 0.01) return null;
	const t0 = T.jiZhu;
	const macro = Math.min(lin(t, t0 - 0.05, t0 + 0.15), 1 - lin(t, t0 + 0.25, t0 + 0.6));
	const darken = 0.66 * lin(t, t0 + 0.6, t0 + 1.4);
	// 终局卡
	const tR = T.jiZhu + 0.75;
	const rise = easeOut(lin(t, tR, tR + 0.6));
	const cols = num.grid.cols_h;
	const rows = Object.entries(num.grid.rows);
	const gx0 = 400;
	const cw = 100;
	const gy0 = 206;
	const rh = 84;
	const r1 = fade(t, T.shiWenShiJian, Infinity, 0.3);
	const r1b = fade(t, T.buKanGeYe, Infinity, 0.3);
	const r2 = fade(t, T.jiaReNeng, Infinity, 0.3);
	const r2b = fade(t, T.buNengJieDu, Infinity, 0.3);
	const a0 = fade(t, T.nengZuo, Infinity, 0.3);
	const a1 = fade(t, T.yiXiaoShiNei2, Infinity, 0.3);
	const a2 = fade(t, T.buYongDeng, Infinity, 0.3);
	const a3 = fade(t, T.fenXiaoHe, Infinity, 0.3);
	const a4 = fade(t, T.fangJinBingXiang - 0.6, Infinity, 0.3);
	const a5 = fade(t, T.fangJinBingXiang, Infinity, 0.4);
	// 分小盒 → 进冰箱的小动画
	const boxMove = ramp(t, T.fenXiaoHe + 0.5, 0.9);
	// 题卡
	const q = easeOut(lin(t, T.liuGeTi, T.liuGeTi + 0.6));
	const pot = fade(t, T.yiGuoZhou, Infinity, 0.4);
	const potTag = fade(t, T.zaiZaoShang, Infinity, 0.3);
	const q1 = fade(t, T.miaoBiao2 - 0.25, Infinity, 0.3);
	const spin = ramp(t, T.miaoBiao2, 1.0);
	const q2 = fade(t, T.jiuHuiLai - 0.6, Infinity, 0.3);
	const ans = fade(t, T.jiuHuiLai + 0.4, Infinity, 0.4);
	// 行做法：x 位置
	const ay = 690;
	const ax = [168, 0, 0, 0, 0];
	const swW = 56;
	ax[1] = ax[0] + swW + 8; // “≤ 1 小时”
	ax[2] = ax[1] + textW('≤ 1 小时', 44) * 1.15 + 22; // 箭头
	ax[3] = ax[2] + 64; // 盒子
	const boxX = ax[3] + 40;
	const tx2 = boxX + 52;
	const arr2 = tx2 + textW('趁热分装', 44) * 1.08 + 22;
	const fridgeX = arr2 + 64 + 30;
	return (
		<>
			<Kitchen T={T} t={t} ending />
			<div style={{position: 'absolute', inset: 0, background: '#1c1a17', opacity: darken}} />
			<GrainMacro op={macro} />
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				{/* 终局卡 */}
				<g opacity={rise} transform={`translate(0,${(1 - rise) * 60})`}>
					<rect x={126} y={118} width={980} height={790} rx={20} fill="#000" opacity={0.25} />
					<rect x={120} y={110} width={980} height={790} rx={20} fill={C.paper} stroke={C.paperEdge} strokeWidth={3} />
					{T48({x: 160, y: 176, text: '时间 × 温度', size: 44, family: SERIF})}
					<rect x={960} y={140} width={100} height={48} rx={24} fill="none" stroke={C.inkFaint} strokeWidth={2.5} />
					{T48({x: 1010, y: 176, text: '示意', size: 36, weight: 500, color: C.inkSoft, anchor: 'middle'})}
					{/* 行首两行字：温度 + 秒表状态（二审 S12：冰箱那一行不是“在室温里”，秒表是暂停的） */}
					{rows.map(([name, states], ri) => {
						const y = gy0 + ri * (rh + 10);
						const fridge = states.every((st) => st === '停');
						return (
							<g key={name}>
								{T48({x: 160, y: y + 36, text: name.replace(/^桌上(?=\d)/, '桌上 '), size: 38, family: SERIF})}
								{T48({x: 160, y: y + 76, text: fridge ? '秒表暂停' : '秒表在走', size: 36, weight: 500, color: fridge ? C.coldInk : C.warmInk})}
								{states.map((st, ci) => {
									const u = ramp(t, tR + 0.35 + (ri * 6 + ci) * 0.06, 0.25);
									const x = gx0 + ci * (cw + 8);
									const c = CELL[st];
									return (
										<g key={ci} opacity={u}>
											<rect x={x} y={y} width={cw} height={rh} rx={12} fill={c.fill} />
											{st === '停' ? (
												<Icon x={x + cw / 2} y={y + rh / 2} size={44}>
													<Pause color={C.ink} fill={C.ink} sw={3} />
												</Icon>
											) : (
												T48({x: x + cw / 2, y: y + rh / 2 + 15, text: st, size: 42, color: c.text, anchor: 'middle', weight: 700})
											)}
										</g>
									);
								})}
							</g>
						);
					})}
					{cols.map((h, ci) => T48({x: gx0 + ci * (cw + 8) + cw / 2, y: gy0 + 2 * (rh + 10) + 30, text: `${h}`, size: 36, weight: 500, color: C.inkSoft, anchor: 'middle'}))}
					{/* 二审 S12：横轴“放了多久（小时）”（原“在室温里放了多久”和冰箱那一行自相矛盾） */}
					{T48({x: gx0 + 6 * (cw + 8) - 8, y: gy0 + 2 * (rh + 10) + 74, text: '放了多久（小时）', size: 36, weight: 500, color: C.inkSoft, anchor: 'end'})}
					{/* 审片后 P2-14：粥题要用到“烫的那段不算”，在横轴旁补一句秒表从什么时候开始走 */}
					{T48({x: 160, y: gy0 + 2 * (rh + 10) + 74, text: '秒表：饭不烫手才开始走', size: 36, weight: 500, color: C.warmInk})}
					<line x1={160} y1={496} x2={1060} y2={496} stroke={C.paperEdge} strokeWidth={3} />
					{/* 规则 1（二审 S3/S12）：看：[秒表] 室温时间 ✓　[月亮] 隔没隔夜 ✗（✓ ✗ 深灰） */}
					<g opacity={r1}>
						{T48({x: 168, y: 556, text: '看：', size: 44, color: C.ink})}
						<Icon x={286} y={540} size={52}>
							<Stopwatch color={C.warmInk} hand={0.3} sw={9} />
						</Icon>
						{T48({x: 320, y: 556, text: '室温时间', size: 44, color: C.ink})}
						<Icon x={530} y={540} size={46}>
							<Check u={ramp(t, T.shiWenShiJian + 0.3, 0.35)} color={C.ink} sw={14} />
						</Icon>
					</g>
					<g opacity={r1b}>
						<Icon x={630} y={540} size={44}>
							<Moon color={C.inkSoft} fill={C.inkSoft} />
						</Icon>
						{T48({x: 664, y: 556, text: '隔没隔夜', size: 44, color: C.inkSoft})}
						<Icon x={874} y={540} size={42}>
							<Cross u={ramp(t, T.buKanGeYe + 0.2, 0.35)} color={C.ink} sw={13} />
						</Icon>
					</g>
					{/* 规则 2：加热：杀菌 ✓  解毒 ✗（只有“解毒 ✗”用品红） */}
					<g opacity={r2}>
						{T48({x: 168, y: 626, text: '加热：', size: 44, color: C.ink})}
						{T48({x: 300, y: 626, text: '杀菌', size: 44, color: C.ink})}
						<Icon x={414} y={610} size={46}>
							<Check u={ramp(t, T.jiaReNeng + 0.35, 0.35)} color={C.ink} sw={14} />
						</Icon>
					</g>
					<g opacity={r2b}>
						{T48({x: 500, y: 626, text: '解毒', size: 44, color: C.toxin})}
						<Icon x={614} y={610} size={42}>
							<Cross u={ramp(t, T.buNengJieDu + 0.2, 0.35)} color={C.toxin} sw={13} />
						</Icon>
					</g>
					<line x1={160} y1={652} x2={1060} y2={652} stroke={C.paperEdge} strokeWidth={3} opacity={a0} />
					{/* 做法：秒表 ≤ 1 小时 → 浅盒 趁热分装 → 冰箱 */}
					<g opacity={a1}>
						<Icon x={ax[0] + swW / 2} y={ay + 6} size={swW}>
							<Stopwatch color={C.ink} hand={1 / 12} sw={9} />
						</Icon>
						{T48({x: ax[1], y: ay + 22, text: '≤ 1 小时', size: 44})}
					</g>
					<g opacity={a2}>
						<Icon x={ax[2] + 26} y={ay + 6} size={42}>
							<Arrow color={C.inkSoft} sw={9} />
						</Icon>
						{T48({x: tx2, y: ay + 22, text: '趁热分装', size: 44})}
					</g>
					<g opacity={a3}>
						{/* 浅盒图标 + 两个小盒顺着这一行推进冰箱 */}
						<Icon x={boxX} y={ay + 6} size={56}>
							<Box />
						</Icon>
						{boxMove > 0 && boxMove < 1 ? (
							<>
								<Icon x={mix(boxX, fridgeX, boxMove)} y={ay - 26} size={30} opacity={1 - lin(boxMove, 0.85, 1)}>
									<Box fill={C.cold} />
								</Icon>
								<Icon x={mix(boxX, fridgeX, Math.max(0, boxMove - 0.12) / 0.88)} y={ay - 26} size={30} opacity={boxMove > 0.12 ? 1 - lin(boxMove, 0.9, 1) : 0}>
									<Box fill={C.cold} />
								</Icon>
							</>
						) : null}
					</g>
					<g opacity={a4}>
						<Icon x={arr2 + 26} y={ay + 6} size={42}>
							<Arrow color={C.inkSoft} sw={9} />
						</Icon>
						<Icon x={fridgeX} y={ay + 4} size={64}>
							<Fridge color={C.ink} fill={C.cold} />
						</Icon>
					</g>
					{T48({x: 168, y: 766, text: '1 天内吃完 · 只热一次', size: 36, weight: 500, color: C.inkSoft, op: a5})}
					{/* 二审 S12：边界一行（方案 §1：终局图 = 规则 + 示意 + 边界）；回顾 B41–B43，不和旁白同句。
					    审片后 P1-3：随终局卡一起出现，接住顶部刚淡出的段 7 小结（同一份内容留在屏幕上） */}
					{T48({x: 168, y: 818, text: '边界：冰箱只变慢 · 越热越快 · 沙门氏菌加热即可', size: 36, weight: 500, color: C.ink})}
					{/* 二审 S12：AI 标识常驻卡底；审片后 P2-9：字色加深（原来约 3.3:1） */}
					{T48({x: 168, y: 874, text: '画面由 Claude 用代码生成 · 配音为 AI 合成（占位）', size: 36, weight: 500, color: C.inkSoft})}
				</g>
				{/* 题卡 */}
				<g opacity={q} transform={`translate(${(1 - q) * 80},0)`}>
					<rect x={1186} y={118} width={620} height={790} rx={20} fill="#000" opacity={0.25} />
					<rect x={1180} y={110} width={620} height={790} rx={20} fill={C.paper} stroke={C.paperEdge} strokeWidth={3} />
					{T48({x: 1220, y: 182, text: '留个题', size: 44, family: SERIF})}
					{/* 盖着锅盖的粥锅，灶上一夜 */}
					<g opacity={pot} transform={`translate(1490,330) scale(${0.9 + 0.1 * pop(t, T.yiGuoZhou, 0.4)})`}>
						<rect x={-150} y={70} width={300} height={22} rx={6} fill="#5d5a55" />
						<rect x={-120} y={92} width={30} height={20} fill="#5d5a55" />
						<rect x={90} y={92} width={30} height={20} fill="#5d5a55" />
						<path d="M-130,-20 L130,-20 L118,62 Q0,78 -118,62 Z" fill="#cfd3d6" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
						<line x1={-130} y1={0} x2={-160} y2={-6} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
						<line x1={130} y1={0} x2={160} y2={-6} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
						<path d="M-140,-22 Q0,-80 140,-22 Z" fill="#e1e4e6" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
						<rect x={-18} y={-66} width={36} height={18} rx={6} fill={C.ink} />
					</g>
					<g opacity={potTag}>
						<rect x={1326} y={444} width={330} height={62} rx={31} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
						<Icon x={1370} y={475} size={38}>
							<Moon color={C.ink} fill={C.ink} />
						</Icon>
						{T48({x: 1400, y: 489, text: '灶上 · 一夜', size: 40, weight: 600})}
					</g>
					{/* ① 秒表走了多久？ */}
					<g opacity={q1}>
						{T48({x: 1230, y: 618, text: '①', size: 48})}
						<Icon x={1316} y={600} size={64}>
							<Stopwatch color={C.ink} hand={spin} sw={9} />
						</Icon>
						{T48({x: 1362, y: 618, text: '? 小时', size: 48})}
					</g>
					{/* ② 烧开 → 毒素 ? */}
					<g opacity={q2}>
						{T48({x: 1230, y: 718, text: '②', size: 48})}
						{T48({x: 1292, y: 718, text: '烧开', size: 48})}
						<Icon x={1430} y={702} size={48}>
							<Arrow color={C.inkSoft} sw={9} />
						</Icon>
						<Icon x={1494} y={702} size={64}>
							<ToxinDot />
						</Icon>
						{T48({x: 1534, y: 718, text: '?', size: 48})}
					</g>
					{T48({x: 1490, y: 856, text: '答案见置顶评论', size: 36, weight: 500, color: C.inkSoft, anchor: 'middle', op: ans})}
				</g>
			</svg>
		</>
	);
};
