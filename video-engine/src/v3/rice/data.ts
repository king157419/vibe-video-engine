// 数据：逐字时间锚点 + numbers.json（3_第三版资料/样片/rice/numbers.py 的输出，原样复制到 public/v3/rice/）。
// 画面里所有数字、所有动作时刻都从这里来，组件里不手写毫秒、不另写数字。
import {easeInOut, lin, mix, sineInOut} from './util';

export type CapChar = {t: string; s: number; e: number; hl: boolean};
export type CapLine = {i: number; text: string; startMs: number; endMs: number; sentenceEnd: boolean; paraEnd?: boolean; chars: CapChar[]};
export type Captions = {id: string; audio: string; durationMs: number; voice?: string; keywords: string[]; lines: CapLine[]};

export type Row15 = {t_h: number; clock: string; left: number; log10_left: number; toxin_left: number; right: number};
export type Numbers = {
	assumptions: {
		N0_per_g: number;
		room_C: number;
		fridge_C: number;
		lag_h: number;
		doubling_min: number;
		toxin_threshold_per_g: number;
		left_start: string;
		left_end: string;
		right_dinner: string;
		right_room_h: number;
		right_end_nextday: string;
		residual_spore_frac: number;
	};
	facts: {cereulide_stable_C: number; cereulide_stable_min: number; rice_fridge_max_days: number; reheat_times_max: number; fridge_within_h_FSA: number};
	left: {hours: number; doublings: number; n_end: number; t_threshold_h: number; t_threshold_hhmm: string};
	right: {n: number; calendar_h: number; room_h: number; fridge_h: number};
	stopwatch: {A: {calendar_h: number; room_h: number}; B: {calendar_h: number; room_h: number}};
	reheat: {left_after: number; right_after: number; toxin_left: number; toxin_right: number};
	table_15min: Row15[];
	grid: {cols_h: number[]; rows: Record<string, string[]>};
	hotter: {C25: {lag_h: number; td_min: number; t_thr_h: number}; C33: {lag_h: number; td_min: number; t_thr_h: number}; ratio: number};
};

export type RiceProps = {captions: Captions | null; numbers: Numbers | null};

/** 找某个词第 nth 次出现的起止时间（秒）。字时间块可能带句末标点（如“子？”），逐字展开 */
export const makeFinder = (cap: Captions) => {
	const chars: CapChar[] = [];
	let text = '';
	for (const line of cap.lines)
		for (const c of line.chars)
			for (const ch of c.t.trim()) {
				chars.push(c);
				text += ch;
			}
	return (word: string, nth = 1): {s: number; e: number} => {
		let pos = -1;
		for (let i = 0; i < nth; i++) {
			pos = text.indexOf(word, pos + 1);
			if (pos < 0) throw new Error(`锚点找不到：${word} #${nth}`);
		}
		return {s: chars[pos].s / 1000, e: chars[pos + word.length - 1].e / 1000};
	};
};

/** 全片时间表：每个画面动作锚定的字（分镜表 §4、§6；带序号的词照 §6 的表） */
export const buildTimeline = (cap: Captions) => {
	const f = makeFinder(cap);
	const S = (w: string, n = 1) => f(w, n).s;
	const E = (w: string, n = 1) => f(w, n).e;
	const voiceEnd = cap.durationMs / 1000;
	return {
		voiceEnd,
		// 段 0–1 立靶 + 押注
		first: S('两碗剩饭'),
		chaoTou1: S('炒透', 1),
		zuo1: S('左边', 1),
		zuo1End: E('一下午'),
		you1: S('右边', 1),
		you1End: E('过了一夜'),
		laoHua: S('老话说'),
		geYeBuNeng: S('隔夜的不能吃'),
		chaoTouMeiShi: S('炒透就没事'),
		naWan: S('哪碗'),
		naWanEnd: E('吃坏肚子'),
		xianXuan: S('先选一个'),
		freeze0: E('先选一个'),
		daAn: S('答案是A'),
		meiGeYe: S('没隔夜'),
		weiShenMe: S('为什么'),
		zuanJin: S('钻进'),
		zuanJinEnd: E('饭里看'),
		// 段 2 认零件
		miLi: S('米里常带着'),
		laYang: S('蜡样芽孢杆菌'),
		jieChu: S('它会结出'),
		yingKe: S('硬壳'),
		yaBao2: S('芽孢', 2),
		yaBao2End: E('芽孢', 2),
		// 二审 S1 新语序：煮饭的热 → 杀光别的细菌、清场 → 芽孢自己杀不死、被催着发芽
		zhuFan: S('煮饭的热'),
		shaGuang: S('杀光'),
		bieDe: S('别的细菌'),
		qingChang: S('清了场'),
		qingChangEnd: E('清了场'),
		yaBao4: S('芽孢', 4),
		shaBuSi: S('杀不死'),
		beiCui: S('被催着'),
		faYa1: S('发芽', 1),
		faYa1End: E('发芽', 1),
		// 段 3 重建① 温度
		zuo2: S('左边', 2),
		d30: S('30度'),
		zhongZi: S('种子先花'),
		yiLiang: S('一两个小时'),
		fenLie: S('分裂'),
		kuai: S('快的时候'),
		fanYiBei: S('翻一倍'),
		fanYiBeiEnd: E('翻一倍'),
		zhaoZhe: S('照这个速度'),
		six1: S('6个小时', 1),
		n1000a: S('1000个', 1),
		baiWan: S('一百多万'),
		baiWanEnd: E('一百多万个'),
		you2: S('右边', 2),
		bingXiang2: S('冰箱', 2),
		yaHaiMei: S('芽还没'),
		zanTing1: S('暂停', 1),
		yiYe: S('一夜过去'),
		n1000b: S('1000个', 2),
		n1000bEnd: E('还是1000个'),
		// 段 4 重建② 毒素和加热
		meiKe: S('每克多到'),
		shiWan: S('十万以上'),
		duSu1: S('毒素', 1),
		duSu1End: E('放毒素'),
		// 审片后 P2-2：删掉“回到开头：”，句子改成“两碗都回锅，炒透。”
		huiDao: S('两碗都回锅'),
		huiGuo2: S('回锅', 2),
		chaoTou3: S('炒透', 3),
		chaoTou3End: E('炒透', 3),
		zhangChu: S('长出来的细菌'),
		quanSi: S('全死了'),
		keNa: S('可那团'),
		meiShao: S('一点没少'),
		naiRe: S('它耐热'),
		d121: S('121度'),
		chaiBuDiao: S('拆不掉'),
		chaiBuDiaoEnd: E('拆不掉'),
		// 段 5 反驳 · 秒表
		suoYi: S('所以危险'),
		riLi1: S('日历', 1),
		shiWenMiaoBiao: S('室温秒表'),
		zanTingJian: S('暂停键', 1),
		daoDai: S('倒带键'),
		geYeXiaRen: S('隔夜吓人'),
		fangDeJiu: S('放得久'),
		suanJinQu: S('一夜算进去'),
		louDiao: S('漏掉'),
		six2: S('6个小时', 2),
		six2End: E('6个小时', 2),
		chaoTouAnQuan: S('炒透就安全'),
		reTou1: S('热透就能防住', 1),
		cuoZai: S('错在'),
		naiReDeDu1: S('耐热的毒', 1),
		naiReDeDu1End: E('耐热的毒', 1),
		// 段 6 别的样本
		paoGuoYe: S('泡过夜'),
		muEr: S('木耳'),
		lingYiZhong: S('另一种菌'),
		gaoYaGuo: S('高压锅'),
		zhuBuHuai: E('煮不坏'),
		xiaTian: S('夏天'),
		luRou: S('卤肉'),
		puTao: S('葡萄球菌'),
		yeBuPa: S('也不怕加热'),
		jiaRe2: S('加热', 2),
		jiaRe2End: E('加热', 2),
		taMen: S('它们和那碗饭'),
		yiYang: S('一样在哪'),
		yiYangEnd: E('一样在哪'),
		duShi: S('都是在'),
		xianZhang: S('室温里先长'),
		naiReDeDu2: S('耐热的毒', 2),
		zaiRe: S('再热就晚了'),
		zaiReEnd: E('再热就晚了'),
		// 段 7 对照 + 边界
		duiZhao: S('对照一下'),
		shaMen: S('沙门氏菌'),
		buXianLiuDu: S('不先留毒'),
		reTou2: S('热透就能防住', 2),
		reTou2End: E('热透就能防住', 2),
		// B41a（审片后 P2-13 改写）：同样的时间，天越热，菌长得越快（秒表只记时长，不再说“秒表不匀速”）
		tongYang: S('同样的时间'),
		tianYueRe: S('天越热'),
		yueKuai: S('长得越快'),
		yueKuaiEnd: E('长得越快'),
		bingXiang5: S('冰箱这个暂停键'),
		buWanQuanLing: S('不完全灵'),
		youDeJun: S('有的菌'),
		lengCang: S('冷藏'),
		manManZhang: S('慢慢长'),
		yiTianNei: S('一天内'),
		yiTianNeiEnd: E('一天内吃完'),
		// 段 8 收束
		jiZhu: S('记住两句'),
		shiWenShiJian: S('室温时间'),
		buKanGeYe: S('不看隔没隔夜'),
		jiaReNeng: S('加热能杀菌'),
		buNengJieDu: S('不能解毒'),
		nengZuo: S('能做的'),
		yiXiaoShiNei2: S('一小时内', 2),
		buYongDeng: S('不用等凉透'),
		fenXiaoHe: S('分小盒'),
		fangJinBingXiang: E('放进冰箱'),
		liuGeTi: S('留个题'),
		yiGuoZhou: S('一锅粥'),
		zaiZaoShang: S('在灶上'),
		shaoKai: S('烧开再喝'),
		miaoBiao2: S('秒表走了多久', 2),
		jiuHuiLai: S('救回来'),
		lastCapEnd: cap.lines[cap.lines.length - 1].endMs / 1000,
		end: voiceEnd,
	};
};
export type Timeline = ReturnType<typeof buildTimeline>;

// ---------- 数字 ----------
/** 左碗（桌上）在故事时间 h 小时的 log10(菌数)：按 numbers.json 逐 15 分钟表在对数上线性插值 */
export const logNLeft = (num: Numbers, h: number) => {
	const tb = num.table_15min;
	if (h <= tb[0].t_h) return tb[0].log10_left;
	for (let i = 1; i < tb.length; i++) {
		if (h <= tb[i].t_h) {
			const u = (h - tb[i - 1].t_h) / (tb[i].t_h - tb[i - 1].t_h);
			return mix(Math.log10(tb[i - 1].left), Math.log10(tb[i].left), u);
		}
	}
	return Math.log10(tb[tb.length - 1].left);
};
/** 左碗毒素（相对量，6 小时 = 1） */
export const toxinLeft = (num: Numbers, h: number) => {
	const tb = num.table_15min;
	const thr = num.left.t_threshold_h;
	if (h <= thr) return 0;
	// 表里 04:15 之后才有值；门槛点 04:16 之后按表线性插值（04:16 处为 0）
	for (let i = 1; i < tb.length; i++) {
		if (h <= tb[i].t_h) {
			const t0 = Math.max(tb[i - 1].t_h, thr);
			const v0 = tb[i - 1].t_h < thr ? 0 : tb[i - 1].toxin_left;
			return mix(v0, tb[i].toxin_left, (h - t0) / (tb[i].t_h - t0));
		}
	}
	return tb[tb.length - 1].toxin_left;
};

/** “178 万”“1,516”这样的读数 */
export const fmtCount = (n: number) => {
	if (n >= 1e4) {
		const w = n / 1e4;
		return `${w >= 100 ? Math.round(w) : w.toFixed(1)} 万`;
	}
	return Math.round(n).toLocaleString('en-US');
};
export const fmtHM = (h: number) => {
	const m = Math.round(h * 60);
	return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** 左碗故事时间（小时）：分镜表 §6 的“故事时间 → 画面时间”重映射（审片后：慢放段改成“分裂”→“翻一倍”） */
export const storyLeft = (T: Timeline, num: Numbers, t: number) => {
	const lag = num.assumptions.lag_h;
	const td = num.assumptions.doubling_min / 60;
	const H = num.left.hours;
	if (t < T.zhongZi) return 0;
	if (t < T.fenLie) return lag * sineInOut(lin(t, T.zhongZi, T.fenLie));
	// 审片后 P1-2：“分裂”一出口第一代就开始收腰，慢放一整次分裂，正好在“翻一倍”分开（秒表 01:30 → 01:55）
	if (t < T.fanYiBei) return lag + td * lin(t, T.fenLie, T.fanYiBei);
	if (t < T.six1) return lag + td;
	if (t < T.baiWan) return mix(lag + td, H, easeInOut(lin(t, T.six1, T.baiWan)));
	return H;
};
/** 右碗：室温秒表（0→1 小时后停住）和日历（→23 小时） */
export const roomRight = (T: Timeline, num: Numbers, t: number) => num.right.room_h * sineInOut(lin(t, T.you2, T.you2 + 1.34));
export const calRight = (T: Timeline, num: Numbers, t: number) =>
	t < T.yiYe ? roomRight(T, num, t) : mix(num.right.room_h, num.right.calendar_h, sineInOut(lin(t, T.yiYe, T.yiYe + 1.4)));
