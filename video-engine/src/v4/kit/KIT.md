# v4 kit 用法

`import {...} from '../kit'`。完整示例：`src/v4/kitdemo/Demo.tsx`（渲染结果 `out/v4/kitdemo/demo.mp4`）。

## 骨架

```tsx
export const Video: React.FC<Props> = ({subs}) => {
  ensureV4Fonts();                       // 必须：加载思源宋体 + Noto Serif（delayRender 保证不会用错字体）
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;                 // 一律用秒思考
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Backdrop />                       // 近黑底 + 星尘 + 暗角 + 颗粒；dim={0..1} 可整体压暗（章节间过渡）
      <Camera scale={1 + 0.02 * t / 10}> ... 场景 ... </Camera>   // 镜头一直在慢慢动
      <ChapterLabel chapters={[{t: 0.6, num: '00', zh: '序', en: 'prologue'}, ...]} />
      <Subtitles subs={subs} />
      <EndMark t={t} from={duration - 2.5} />
    </AbsoluteFill>
  );
};
```

## 发光绘制：`<GlowCanvas draw={(g, t, frame) => {...}} />`

全画幅 canvas，默认 `'lighter'` 叠加（光与光相加）。draw 每帧调用一次，只能依赖 t、frame 和预先算好的数据。可以叠好几层 GlowCanvas。

| 函数 | 用途 |
|---|---|
| `dot(g, x, y, r, color, k=1, core=0.18)` | 发光点：白热的核 + 彩色光晕。r 是光晕半径，k 是亮度 |
| `haze(g, x, y, r, color, k=0.3)` | 大而柔的光雾，没有白核（氛围、高潮辉光） |
| `line(g, pts, color, w=2, k=1, closed=false)` | 发光折线：多遍描边，中心一条白热细线 |
| `hair(g, pts, color, w=1, a=0.35)` | 不发光的暗细线（刻度、网格、结构线） |
| `ring(g, x, y, r, color, w, k, a0, a1)` | 发光圆弧或整圆；a1 递增就是「画出一个圆」 |
| `comet(g, tail, color, w, k)` | 彗星拖尾：tail 是走过的点，最后一个是头 |
| `sample(fn, n, u0, u1)` | 把参数曲线 u→[x,y] 采样成点列 |
| `partial(pts, p)` | 截取折线前 p 的长度（线条生长） |
| `resample(pts, n)` / `morph(a, b, t)` | **形变转场**：把上一幕的形状变成下一幕的形状 |

## 文字

| 组件 | 说明 |
|---|---|
| `<Subtitles subs={subs}/>` | 双语字幕，中文细宋白字 + 英文灰色斜体，无底框，逐句淡入淡出 |
| `<ChapterLabel chapters={[{t, num, zh, en}]}/>` | 左上章节标签，每章只露约 3.8 秒 |
| `<Label x y zh en color opacity size/>` | 贴在物体旁的小标签（宽字距，小而暗）。用完要把 opacity 收到 0 |
| `<TitleCard title sub en p out y size titleOpacity/>` | 片名卡；p / out 是 0–1 的出现、消失进度 |
| `<ParticleText text p cy size tracking burst opacity/>` | 粒子聚字（p 从 0 到 1）、吹散（burst）。和 TitleCard 交接时：`cy={titleCenterY(y, size)}`，size、tracking 跟 TitleCard 一致（默认 0.48），再用 titleOpacity 做交叉淡化 |
| `<Typewriter text t t0 cps y size>{句尾元素}</Typewriter>` | 逐字打出 + 闪烁光标；children 在打完后接在句尾（例如一个金色空格） |
| `<BreathingMark t t0 t1 x y/>` | 会呼吸的金色问号（提问后的留白） |
| `<Readout x y value note size/>` | 发光的大号衬线数字 |
| `<EndMark t from/>` | 片尾身份标记 |

## 其他

- `Camera`：整体平移、缩放、旋转。`Veil`：整屏压黑或闪白，例如 `<Veil a={0.9} color="#fff"/>`。
- 时间工具：
  - `win(t, a, b, fi, fo)`：区间可见度；
  - `prog(t, a, b, ease)`：区间进度；
  - `smooth` / `easeInOut` / `easeOut` / `easeOutExpo`；
  - `lerp`、`clamp`、`inv`；
  - `rgba(hex, a)`、`mix(h1, h2, t)`。
- 随机：`mulberry32(seed)()`、`hash2(x, y, seed)`。不要用 `Math.random`。
- 颜色常量 `C`：bg、text、en、dim、faint、gold、goldCore、amber、cyan、cyanDeep、pink、ice、silver。

## 性能

- `kitdemo` 40 秒 1080p 全尺寸渲染约 37 秒（`--concurrency=8`）。
- 粒子数控制在 4000 以内。
- `createRadialGradient` 很便宜，`shadowBlur` 很贵，不要用后者。
- 重计算（模拟、路径）放进 `useMemo` 预算整段。
