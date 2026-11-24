import type {SectionCtx} from '../ctx';

// s01 · 开场：补一句（0:00–0:21）  主岛 OPEN（和 s03、s14 共用：本段用左半边聊天框 + 右上句子条）
// 分镜：EP01_终稿.md「开场：补一句」。共享道具：props.chat（D1）。
// 【占位 + 参考用法】这里已经用 D1 道具把分镜大致排了一遍，section 负责人可以整体改写。

export const build = (ctx: SectionCtx) => {
	const {q, props, C} = ctx;
	const {chat} = props;

	// 「你发出去一句话」：聊天框一笔一笔画出来，右上角钟 22:47，「发」时气泡弹出，名字写两笔后涂黑
	ctx.cam(chat.views.panel, 0, 1);
	chat.frame(120, 1500);
	chat.clock(900);
	chat.bubble(q.at('发') + 300);
	chat.name(q.at('一句话') + 200);

	// 「对方正在输入」：三个点跳三轮 + 小计数 1 2 3；「没了」橡皮擦掉
	chat.status(q.at('输入') - 250, q.at('没了') - 150);
	chat.statusOff(q.at('没了'));

	// 「十八分钟」：钟从 22:47 拨到 23:05
	ctx.cam(chat.views.header, q.at('十八') - 300, 800);
	chat.clockTo(q.at('十八'), 1600, '23:05');

	// 「别想，直接补」：句子条（空白横线），笔尖悬在横线上方（停 2 秒）
	ctx.cam(chat.views.chatAndLine, q.at('别想') - 200, 1100);
	const tLine = chat.line(q.at('补'));
	const g = chat.lineGeo;
	ctx.b.hover([g.x0 + 60, g.y - 30], tLine + 100, q.at('补上了吧') - 150);

	// 「补上了吧」：横线右边一个小对勾
	chat.check(q.ch('补上了吧', 1));

	// 「对面这个人是谁」：推镜到涂黑的名字；旁边铅笔轮流写「领导 / 客户 / 对象 / 妈」，各停半秒就擦掉
	const tWho = q.at('谁');
	ctx.cam(chat.views.name, tWho - 600, 900);
	['领导', '客户', '对象', '妈'].forEach((w, i) => {
		const t = tWho + 250 + i * 620;
		ctx.text(w, chat.box.name[2] + 40, chat.box.name[3] - 14, 48, t, {color: C.pencilDark, dur: 200, out: t + 480, outDur: 120});
	});
};
