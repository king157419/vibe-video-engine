// 全部图标用 SVG 路径画（分镜表 §2“图标”：不用 emoji 和符号字符）。
// 每个图标画在以 (0,0) 为中心、边长 100 的方框里，用 <Icon x y size> 摆放。
import React from 'react';
import {C} from './theme';

type P = {color?: string; fill?: string; sw?: number; extra?: number};

export const Stopwatch: React.FC<P & {hand?: number}> = ({color = C.ink, fill = 'none', sw = 8, hand = 0.12}) => {
	const a = hand * Math.PI * 2 - Math.PI / 2;
	return (
		<g>
			<rect x={-10} y={-50} width={20} height={12} rx={3} fill={color} />
			<line x1={30} y1={-30} x2={38} y2={-38} stroke={color} strokeWidth={sw} strokeLinecap="round" />
			<circle cx={0} cy={6} r={40} fill={fill} stroke={color} strokeWidth={sw} />
			<line x1={0} y1={6} x2={Math.cos(a) * 28} y2={6 + Math.sin(a) * 28} stroke={color} strokeWidth={sw} strokeLinecap="round" />
			<circle cx={0} cy={6} r={5} fill={color} />
		</g>
	);
};

export const Calendar: React.FC<P> = ({color = C.ink, fill = 'none', sw = 7}) => (
	<g>
		<rect x={-42} y={-34} width={84} height={78} rx={8} fill={fill} stroke={color} strokeWidth={sw} />
		<rect x={-42} y={-34} width={84} height={22} rx={6} fill={color} />
		<line x1={-20} y1={-46} x2={-20} y2={-26} stroke={color} strokeWidth={sw} strokeLinecap="round" />
		<line x1={20} y1={-46} x2={20} y2={-26} stroke={color} strokeWidth={sw} strokeLinecap="round" />
		{[-22, 0, 22].map((x) => [8, 28].map((y) => <rect key={`${x}_${y}`} x={x - 6} y={y - 6} width={12} height={12} rx={2} fill={color} />))}
	</g>
);

export const Pause: React.FC<P & {crack?: number}> = ({color = C.ink, fill, sw = 6, crack = 0}) => (
	<g>
		<rect x={-34} y={-42} width={24} height={84} rx={6} fill={fill ?? color} stroke={color} strokeWidth={sw} />
		<rect x={10} y={-42} width={24} height={84} rx={6} fill={fill ?? color} stroke={color} strokeWidth={sw} />
		{crack > 0 ? (
			<path
				d="M22,-44 L16,-22 L28,-8 L18,10 L27,24 L20,44"
				fill="none"
				stroke={C.paper}
				strokeWidth={5}
				strokeLinejoin="round"
				strokeDasharray="120"
				strokeDashoffset={120 * (1 - crack)}
			/>
		) : null}
	</g>
);

export const Rewind: React.FC<P> = ({color = C.ink, fill}) => (
	<g>
		<path d="M-2,-34 L-2,34 L-46,0 Z" fill={fill ?? color} stroke={color} strokeWidth={5} strokeLinejoin="round" />
		<path d="M44,-34 L44,34 L0,0 Z" fill={fill ?? color} stroke={color} strokeWidth={5} strokeLinejoin="round" />
	</g>
);

// 勾用深灰（二审 S9：青色只代表芽孢）
export const Check: React.FC<P & {u?: number}> = ({color = C.ink, sw = 12, u = 1}) => (
	<path d="M-34,2 L-10,28 L36,-30" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="120" strokeDashoffset={120 * (1 - u)} />
);

export const Cross: React.FC<P & {u?: number}> = ({color = C.ink, sw = 12, u = 1}) => (
	<g>
		<line x1={-28} y1={-28} x2={28} y2={28} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray="80" strokeDashoffset={80 * (1 - Math.min(1, u * 2))} />
		<line x1={28} y1={-28} x2={-28} y2={28} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray="80" strokeDashoffset={80 * (1 - Math.max(0, u * 2 - 1))} />
	</g>
);

export const Snowflake: React.FC<P> = ({color = C.coldInk, sw = 7}) => (
	<g stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none">
		{[0, 60, 120].map((a) => (
			<g key={a} transform={`rotate(${a})`}>
				<line x1={0} y1={-42} x2={0} y2={42} />
				<polyline points="-12,-32 0,-22 12,-32" />
				<polyline points="-12,32 0,22 12,32" />
			</g>
		))}
	</g>
);

export const Moon: React.FC<P> = ({color = C.ink, fill}) => (
	<path d="M10,-40 A40,40 0 1,0 34,26 A32,32 0 1,1 10,-40 Z" fill={fill ?? color} stroke={color} strokeWidth={4} strokeLinejoin="round" />
);

// 温度计：深灰线稿 + 暖橙液柱（二审 S9：绝不用品红，品红只代表毒素）
export const Thermo: React.FC<P & {level?: number}> = ({color = C.ink, fill = C.warm, level = 0.85}) => (
	<g>
		<rect x={-11} y={-46} width={22} height={70} rx={11} fill="none" stroke={color} strokeWidth={6} />
		<circle cx={0} cy={30} r={18} fill={fill} stroke={color} strokeWidth={6} />
		<rect x={-4} y={24 - 66 * level} width={8} height={66 * level} rx={4} fill={fill} />
		{[-30, -16, -2].map((y) => (
			<line key={y} x1={14} y1={y} x2={24} y2={y} stroke={color} strokeWidth={4} strokeLinecap="round" />
		))}
	</g>
);

export const Fridge: React.FC<P> = ({color = C.ink, fill = C.paper, sw = 6}) => (
	<g>
		<rect x={-30} y={-46} width={60} height={92} rx={8} fill={fill} stroke={color} strokeWidth={sw} />
		<line x1={-30} y1={-12} x2={30} y2={-12} stroke={color} strokeWidth={sw} />
		<line x1={-18} y1={-36} x2={-18} y2={-22} stroke={color} strokeWidth={sw} strokeLinecap="round" />
		<line x1={-18} y1={0} x2={-18} y2={22} stroke={color} strokeWidth={sw} strokeLinecap="round" />
	</g>
);

/** 浅盒（分装用） */
export const Box: React.FC<P> = ({color = C.ink, fill = C.paper, sw = 5}) => (
	<g>
		<path d="M-40,-8 L40,-8 L34,22 L-34,22 Z" fill={fill} stroke={color} strokeWidth={sw} strokeLinejoin="round" />
		<rect x={-44} y={-18} width={88} height={10} rx={4} fill={fill} stroke={color} strokeWidth={sw} />
	</g>
);

/** 炒锅 + 火苗（回锅炒透）。审片后 P2-10：火苗改成白底深灰线，暖橙只留给“室温在走” */
export const Wok: React.FC<P> = ({color = C.ink, fill = C.paper}) => (
	<g>
		<path d="M-42,-8 L42,-8 Q40,26 0,28 Q-40,26 -42,-8 Z" fill={fill} stroke={color} strokeWidth={6} strokeLinejoin="round" />
		<line x1={42} y1={-6} x2={60} y2={-18} stroke={color} strokeWidth={7} strokeLinecap="round" />
		<path d="M-18,44 Q-22,36 -14,30 Q-12,38 -6,36 Q-4,30 0,28 Q6,36 4,44 Z" fill={C.white} stroke={color} strokeWidth={3.5} strokeLinejoin="round" />
		<path d="M10,46 Q8,40 14,36 Q18,42 18,46 Z" fill={C.white} stroke={color} strokeWidth={3.5} strokeLinejoin="round" />
	</g>
);

/** 高压锅：锅身 + 盖 + 限压阀 */
export const PressureCooker: React.FC<P> = ({color = C.ink, fill = C.paper}) => (
	<g>
		<rect x={-40} y={-10} width={80} height={46} rx={8} fill={fill} stroke={color} strokeWidth={6} />
		<path d="M-44,-10 Q0,-34 44,-10 Z" fill={fill} stroke={color} strokeWidth={6} strokeLinejoin="round" />
		<rect x={-6} y={-38} width={12} height={12} rx={3} fill={color} />
		<line x1={44} y1={-4} x2={62} y2={-4} stroke={color} strokeWidth={7} strokeLinecap="round" />
		<line x1={-44} y1={-4} x2={-62} y2={-4} stroke={color} strokeWidth={7} strokeLinecap="round" />
	</g>
);

/** 白闪图标：一圈短射线 */
export const FlashIcon: React.FC<P> = ({color = C.ink, fill = C.white}) => (
	<g>
		<circle cx={0} cy={0} r={20} fill={fill} stroke={color} strokeWidth={5} />
		{Array.from({length: 8}).map((_, i) => {
			const a = (i / 8) * Math.PI * 2;
			return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30} x2={Math.cos(a) * 44} y2={Math.sin(a) * 44} stroke={color} strokeWidth={6} strokeLinecap="round" />;
		})}
	</g>
);

/** 两个紫色胶囊（“室温里长”） */
export const TwoCapsules: React.FC<P> = () => (
	<g>
		<rect x={-40} y={-26} width={52} height={22} rx={11} fill={C.bac} stroke={C.bacEdge} strokeWidth={3} transform="rotate(-18)" />
		<rect x={-8} y={6} width={52} height={22} rx={11} fill={C.bac} stroke={C.bacEdge} strokeWidth={3} transform="rotate(-18)" />
	</g>
);

/** 毒素点：品红实心圆 */
export const ToxinDot: React.FC<P> = ({extra = 1}) => <circle cx={0} cy={0} r={22 * extra} fill={C.toxin} />;

/** 箭头（链条里的连接符） */
export const Arrow: React.FC<P> = ({color = C.ink, sw = 7}) => (
	<g>
		<line x1={-40} y1={0} x2={30} y2={0} stroke={color} strokeWidth={sw} strokeLinecap="round" />
		<polyline points="14,-16 34,0 14,16" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
	</g>
);

/** 在 SVG 里摆一个图标：中心 (x,y)，边长 size */
export const Icon: React.FC<{x: number; y: number; size: number; rot?: number; opacity?: number; children: React.ReactNode}> = ({x, y, size, rot = 0, opacity = 1, children}) => (
	<g transform={`translate(${x},${y}) rotate(${rot}) scale(${size / 100})`} opacity={opacity}>
		{children}
	</g>
);

/** 在 HTML 里内联一个图标 */
export const IconBox: React.FC<{size: number; style?: React.CSSProperties; children: React.ReactNode}> = ({size, style, children}) => (
	<svg width={size} height={size} viewBox="-50 -50 100 100" style={{display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', ...style}}>
		{children}
	</svg>
);
