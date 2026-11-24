// 1080x1920 竖屏。抖音界面会盖住：顶部状态栏/搜索、右侧点赞评论分享按钮列、底部标题/文案/进度条。
// 重要文字放在 SAFE 矩形内（调研结论：关键内容框 x 80–880、y 240–1480；字幕块约 y 1280–1470；钩子大字约 y 300–700）。
// 这些是经验值，正式发布前建议用剪映「抖音预览」或真机截图再核对一次。
export const W = 1080;
export const H = 1920;

export const SAFE = {
	top: 240,
	bottom: 1480,
	left: 80,
	right: 880,
};

export const SAFE_W = SAFE.right - SAFE.left;
