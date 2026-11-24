# 11 · Shots and prompts (EN, 30 s)

中文说明：每个镜头两段英文提示词。先用 IMAGE PROMPT 出定帧图，挑一张满意的当首帧，再用 VIDEO PROMPT 做图生视频。每镜生成 5 秒，剪辑时只用表里的秒数。提示词直接复制，不用翻译。

竖版 9:16：把每条 IMAGE PROMPT 里的 `wide 16:9 frame` 换成 `vertical 9:16 frame, subject centred, clean empty space in the top third`。

| # | In film | Use | Generate | 中文一句话 | Subject refs |
|---|---|---|---|---|---|
| 1 | 0–3 | 3 s | 5 s | 钩子：精华落在棉布上被吸走 | none |
| 2 | 3–7 | 4 s | 5 s | 问题：脸压在棉枕套上睡 | Model_A |
| 3 | 7–12 | 5 s | 5 s | 解法：真丝上精华不渗 | none |
| 4 | 12–15 | 3 s | 5 s | 证明：真丝织纹微距 | none |
| 5 | 15–18 | 3 s | 5 s | 枕套 | Pillowcase |
| 6 | 18–21 | 3 s | 5 s | 眼罩 | Model_A, Mask, Pillowcase |
| 7 | 21–24 | 3 s | 5 s | 发帽 | Model_A, Bonnet |
| 8 | 24–27 | 3 s | 5 s | 清晨醒来 | Model_A, Pillowcase |
| 9 | 27–30 | 3 s | — | 结束卡，剪辑里做 | logo file |

Add this line to the end of every video prompt:
`Keep the product identical to the reference image. No text, no captions, no logos, no watermark. Photoreal, premium beauty commercial, shallow depth of field, steady camera.`

---

## Shot 1 — Hook: cotton soaks it up

**IMAGE PROMPT**
> Extreme macro, top-down, wide 16:9 frame. White cotton pillowcase fabric fills the frame: a plain weave with clearly visible coarse yarns and tiny loose fibres, matte and dry. In the exact centre sits one plump, glossy drop of golden face serum, glowing softly, about to sink in. Cool, neutral overhead light, slightly desaturated. 100mm macro lens, shallow depth of field, photoreal, no text.

**VIDEO PROMPT**
> 0–1 s: the golden serum drop lands on the cotton with a tiny ripple. 1–3 s: the drop collapses and wicks outward along the yarns, its golden shine fading. 3–5 s: only a dull, uneven damp patch remains; the camera pushes in slowly. Sound: one soft low thud, then silence.

## Shot 2 — Problem: eight hours on cotton

**IMAGE PROMPT**
> Night bedroom, dim cool blue-grey light, wide 16:9 frame. Close-up of a woman in her late twenties asleep on her side, cheek pressed into a slightly rumpled white cotton pillowcase with a visible matte weave. Long dark-brown hair, a few strands caught and frizzy against the fabric. Natural skin with visible texture, no heavy makeup, ivory camisole strap. 85mm lens, shallow depth of field, photoreal, calm, no text.

**VIDEO PROMPT**
> 0–5 s: she sleeps, breathing slowly; her cheek shifts very slightly against the cotton. The camera pushes in very slowly toward the point where skin meets fabric. Dim cool light, nothing else moves. Sound: quiet room tone, a faint clock tick.

## Shot 3 — Solution: silk absorbs less

Use first and last frame if available. First frame: silk mostly in darkness with light just touching one edge. Last frame: the bead resting high on a fold, the whole sheet lit.

**IMAGE PROMPT**
> Dark studio, black background, wide 16:9 frame. Ivory mulberry silk satin fills the frame in deep, rounded, liquid-looking folds with a soft pearl sheen. A strip light from the left draws long thin highlights along the ridges. Left of centre, one round, glossy bead of golden face serum sits on top of the silk, not absorbed, with a small golden reflection beneath it. Low three-quarter angle, 50mm lens, shallow depth of field, premium silk commercial, photoreal, no text.

**VIDEO PROMPT**
> 0–2 s: a strip of light sweeps from left to right, revealing ivory silk that ripples slowly like liquid. 2–3 s: a golden serum drop falls onto the silk, bounces once and stays a perfect round bead. 3–5 s: the bead rolls slowly down a fold, staying whole, leaving a golden glint; the camera follows it at a low angle. Warm tone. Sound: one bright glass chime as it lands, a whisper of silk.

## Shot 4 — Proof: the weave

**IMAGE PROMPT**
> Extreme macro of ivory mulberry silk satin, wide 16:9 frame: a dense, very fine, perfectly even weave, with a pearl-like sheen and one soft diagonal fold. Raking side light, dark background falling off to black at the edges. Shallow depth of field, photoreal, luxury textile photography, no text.

**VIDEO PROMPT**
> 0–5 s: the silk moves gently as if lifted by air; a band of light travels slowly across the weave from left to right; the camera slides sideways along the fold. Sound: a soft high shimmer.

## Shot 5 — Pillowcase

Subject: Pillowcase.

**IMAGE PROMPT**
> Product shot, wide 16:9 frame. The Moonlight white silk pillowcase from the reference image on a plump pillow, resting against a neutral linen headboard on a neatly made bed with oatmeal linen sheets. Soft window light from the left makes long gentle highlights on the satin; folds are rounded and heavy. The pillow sits right of centre, with clean empty space on the left. 70mm lens, shallow depth of field, photoreal, no text, no logos, no hands.

**VIDEO PROMPT**
> 0–5 s: soft light drifts slowly across the pillowcase and the highlights on the satin move with it; the camera pushes in slowly. The pillow does not move or change shape. Sound: one soft bell.

## Shot 6 — Sleep mask

Subjects: Model_A, Mask, Pillowcase.

**IMAGE PROMPT**
> Night bedroom, warm low lamp light, wide 16:9 frame. Model_A lies on her back on the Moonlight white silk pillowcase, head and shoulders, wearing the Crystal Pink 3D contoured silk sleep mask from the reference image; the two domed cups sit around her eyes. Relaxed mouth, hair spread smoothly on the pillow. Her face sits right of centre with empty space on the left. 85mm lens, shallow depth of field, photoreal, no text, no hands.

**VIDEO PROMPT**
> 0–5 s: she breathes out slowly and her shoulders relax into the pillow; the camera pushes in slowly toward the mask until the pink satin sheen is clear. The mask keeps its shape. Sound: one soft bell.

## Shot 7 — Bonnet

Subjects: Model_A, Bonnet.

**IMAGE PROMPT**
> Evening, warm lamp light, wide 16:9 frame. Model_A sits at a simple wooden vanity in three-quarter profile, wearing the lavender silk bonnet from the reference image, the tie band and bow at the front, all of her hair tucked inside. Ivory silk camisole. Soft blurred bedroom behind her. She sits right of centre with empty space on the left. 85mm lens, shallow depth of field, photoreal, no text, no hands touching the bonnet.

**VIDEO PROMPT**
> 0–5 s: she turns her head slowly toward the camera and smiles a little; the lavender satin catches the lamp light; the camera arcs about 15 degrees around her. The bonnet keeps its shape and colour. Sound: one soft bell.

If you want the reversible point on screen, generate a second version with `mint green` instead of `lavender` and cut between the two halfway through the shot.

## Shot 8 — Morning

Subjects: Model_A, Pillowcase.

**IMAGE PROMPT**
> Morning bedroom, warm golden sunlight through a gap in the curtains from the left, fine dust in the light, wide 16:9 frame. Model_A has just woken on the Moonlight white silk pillowcase, head still on the pillow, long dark-brown hair lying smooth across the satin, a small relaxed smile, natural skin. She is in the lower half of the frame; the upper third is a softly blurred pale wall, clean and empty. 50mm lens, shallow depth of field, photoreal, no text.

**VIDEO PROMPT**
> 0–2 s: the light brightens; she opens her eyes and lifts her head from the pillow, her hair sliding smoothly off the satin. 2–5 s: she smiles and settles on one elbow; the camera pulls back slowly and rises a little, keeping the top third of the frame clean. Warm tone. Sound: a warm full chord, a faint bird outside.

## Shot 9 — End card

Not generated. Build it in the edit from `12_Copy_Music_Edit_EN.md`.

---

## Negative prompt (if the model has a field for it)

> text, captions, subtitles, watermark, logo, extra fingers, deformed hands, plastic-looking fabric, over-smoothed skin, overexposed, camera shake, cartoon, illustration

## Model_A — character sheet prompt (generate once, save to the subject library)

> Half-length portrait of a woman in her late twenties, long dark-brown hair, natural skin with visible texture, minimal makeup, ivory silk camisole, relaxed expression. Soft window side light, pale neutral bedroom background, softly blurred. 85mm lens, shallow depth of field, premium skincare commercial, photoreal.

## Product subjects — descriptions to save with each reference image

- **Pillowcase**: xmomo Moonlight white silk pillowcase, 22-momme 6A-grade 100% mulberry silk on both sides, hidden envelope closure, no zipper. Soft pearl sheen, heavy drape, rounded folds.
- **Mask**: xmomo Crystal Pink 3D contoured silk sleep mask. Two domed cups that sit around the eyes without pressing on them, silk-wrapped rim, thin padding, blackout.
- **Bonnet**: xmomo reversible silk bonnet, lavender on one side and mint on the other, adjustable tie band with a decorative bow, no elastic.
