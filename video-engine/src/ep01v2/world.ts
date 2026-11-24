import type {Box} from '../whiteboard';

// EP01v2 的世界地图：一张大纸，每个 section 一个「岛」。岛之间留 400–480 的空纸，镜头跨岛时自动拉远走弧线。
// 标准岛 2400×1120（比例 = 内容区 1920×894，镜头装下整岛时 z≈0.8：世界字号 45 ≈ 屏幕 36px）。
//
//                    x: -2880        0           2880          5760
//   y -2080          ┌ MEMO ┐  ┌──── CORE (3600×1680) ────┐ ┌ S13 ┐
//   (MEMO/S13 略低)   │s10s11│  │ s12 · s15  D14 核心图    │ │ s13 │
//   y     0          ┌ S07 ┐   ┌ OPEN ┐      ┌ S02 ┐
//                    │ s07 │   │s01 s03 s14│ │ s02 │
//   y  1600          ┌ S08 ┐   ┌ BASE ┐      ┌ S05 ┐      ┌ S06 ┐
//                    │ s08 │   │ s04  │      │ s05 │      │ s06 │
//   y  3200          ┌ S09 ┐
//                    │ s09 │
//
// 镜头路线：OPEN(s01) → S02 → OPEN(s03) → BASE(s04) → S05 → S06 → OPEN(s07 回到聊天框) → S07 → S08 → S09
//          → OPEN(s10 回到聊天框) → MEMO(s10, s11) → CORE(s12) → S13 → OPEN(s14 回收) → CORE(s15)

export type IslandId = 'OPEN' | 'S02' | 'BASE' | 'S05' | 'S06' | 'S07' | 'S08' | 'S09' | 'MEMO' | 'CORE' | 'S13';

export const ISLAND_W = 2400;
export const ISLAND_H = 1120;

const std = (x: number, y: number): Box => [x, y, x + ISLAND_W, y + ISLAND_H];

export const ISLANDS: Record<IslandId, Box> = {
	OPEN: std(0, 0), // D1 聊天框 + 句子条 + 联想栏（s01、s03、s14；s02/s07/s10 开头会回来）
	S02: std(2880, 0), // 片名卡、协议长卷、「事 / 那句话」
	BASE: std(0, 1600), // D4 底座五格
	S05: std(2880, 1600), // 证据一：心算分屏
	S06: std(5760, 1600), // 证据二：三框同色
	S07: std(-2880, 0), // 证据三：赛道 D8
	S08: std(-2880, 1600), // 自证圆圈 D9
	S09: std(-2880, 3200), // 自测：题卡 + 计数柱 D10
	MEMO: std(-2880, -1600), // 备忘录 D11：抓 · 追 · 红变蓝（s10、s11；s12 开头的「加」）
	CORE: [0, -2080, 3600, -400], // D14 核心图（s12 总装，s15 回来）
	S13: std(4080, -1840), // 真警报：两栏 D12
};

/** 每个 section 的主岛（ctx.island）。几个 section 共用一个岛时，各自负责的区域见 CONTRACT.md */
export const SECTION_ISLAND: Record<string, IslandId> = {
	s01: 'OPEN',
	s02: 'S02',
	s03: 'OPEN',
	s04: 'BASE',
	s05: 'S05',
	s06: 'S06',
	s07: 'S07',
	s08: 'S08',
	s09: 'S09',
	s10: 'MEMO',
	s11: 'MEMO',
	s12: 'CORE',
	s13: 'S13',
	s14: 'OPEN',
	s15: 'CORE',
};

/** 整张纸（拉远看全貌用） */
export const WORLD_BOX: Box = [-2880, -2080, 8160, 4320];
