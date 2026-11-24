// 萤火存档：2026-10-12 第四版按用户意见改片的 Workflow（含当天续跑用的 RESUME）。原样复制，只加了这段头注。
// 通用骨架整理在 references\改片流程.md §4，新改片照那份写；这份只做实例参考。

export const meta = {
  name: 'v4-revise-1012',
  description: 'Apply the user 2026-10-12 notes to 峰终/赫布/弱关系, re-render, and independently verify each film',
  phases: [
    { title: 'Fix', detail: 'one agent per film: edit, re-time, re-score, render, self-QA' },
    { title: 'Verify', detail: 'independent check per film; one repair round if needed' },
  ],
}

const ROOT = 'D:\\desk\\claudex\\24'
const COMMON = `
Project root: ${ROOT}. Video code: ${ROOT}\\video-engine (Remotion 4.0.530; run from that dir). Python: D:\\conda\\envs\\d2l\\python.exe (numpy/scipy) — score.py and QA tools need it.
Read first: video-engine\\src\\v4\\CONTRACT.md, video-engine\\src\\v4\\kit\\KIT.md, and your film's 4_第四版资料\\<slug>\\自检记录.md (it records the exact build pipeline: timeline/subtitle generator → public\\v4\\<slug>\\subs.json + cue.json → music via tools\\score.py (hebb uses its own score_hebb.py wrapper) → mix → render). Also 剧本.md and 事实核查.md in that folder.

USER FEEDBACK 2026-10-12 — general rules that apply to every film:
- A hard silence after a climax must read as INTENTIONAL, never like the player stuttered. Pattern to use: in the same frame the sound cuts, the picture does something clearly deliberate (cut or fast ≤0.25 s fade to near-black, or the hero element freezes while dust/grain keeps drifting), then the next scene fades in. No single-frame pops, no frozen frames while things were moving.
- Every bell/ding must land on a visible on-screen emphasis (something appears/lights/lands on that beat). Remove or move dings with no matching visual.
- End mark: only the tiny text "Opus 5.5" — no "由 Claude 用代码生成". The lead already changed the kit EndMark default to 'Opus 5.5'; if your film has its own end-mark text, change it to "Opus 5.5".
- Key numbers should land by contrast; viewers scrolling short videos don't remember earlier numbers.
- Everything the user praised must stay as good as it is.

HARD RULES:
- Edit only: video-engine\\src\\v4\\<slug>\\**, video-engine\\public\\v4\\<slug>\\**, 4_第四版资料\\<slug>\\**, video-engine\\out\\v4\\<slug>\\**. Never edit src\\v4\\kit, other films, src\\Root.tsx, package.json; no npm install. Never touch ${ROOT}\\成片 (the lead copies finals there).
- Determinism rules from CONTRACT (no Math.random/Date.now/CSS animation).
- Renders: PowerShell with $env:TEMP and $env:TMP = 'D:\\tmp\\v4<slug>'; --concurrency=5 (the other two films render at the same time); delete remotion-webpack-bundle-* in that temp dir afterwards.
- Before overwriting out\\v4\\<slug>\\final.mp4, rename the existing file to final_1008.mp4 if that name does not exist yet (it is the version the user reviewed).
- Finish with: tsc --noEmit; music re-synthesis whenever timing or hits changed; full-size render; two-pass loudnorm mix (I=-16 LUFS, TP ≤ -1.5 dBTP, LRA 7–10); final at out\\v4\\<slug>\\final.mp4 with the mixed audio.
- QA on the new final (required):
  * D:\\conda\\envs\\d2l\\python.exe tools\\v4_stutter.py out\\v4\\<slug>\\final.mp4 — whole film. The user-reported spots must be gone; any other POP/FREEZE must be explained as an intentional cut/flash (fast fades show as runs of small POPs — fine).
  * ebur128 loudness; tools\\v4_qa.py as described in 自检记录.
  * Extract full-size frames at every changed moment and actually look at them (Read the image).
- Append "## 2026-10-12 用户反馈修改" to 4_第四版资料\\<slug>\\自检记录.md: each change, old → new text/time, evidence frame paths, QA numbers. Update 剧本.md (and 事实核查.md if wording of a fact changed).`

const FILMS = [
  {
    slug: 'peak', name: '《峰终》',
    spec: `
1. Cold-water experiment (~0:38–0:57). The user did not notice 14° vs 15°: "你要说『比 14 度多 1 度』，把这个点强调出来". Replace subtitle 51.50 「多出的三十秒，水只暖了一度，还是冷。」 with two lines, e.g. 「多出的三十秒，水从14度升到15度。」 then 「只暖了1度——还是冷。」 (≤20 字 each; update English too). Picture: while these lines are up, "14°" and "15°" must both be visible and the "+1°" difference lit in gold for ≥3 s, synced to the subtitle.
2. 「越亮越冷」 contrast is not obvious enough. Find the part that maps cold to brightness and widen it a lot, so the 14° part vs the 15° part differ in brightness at a glance (e.g. 14° near-full-bright ice blue, 15° clearly a notch darker). Any on-screen legend must match.
3. Two lives (~2:56–3:18). 「一个美好的人生，」 reads like an unfinished sentence; the user asked for a colon. Rewrite as a clear list, e.g. 「第一种人生：一直很美好——」 then 「戛然而止。」, and 「第二种人生：一模一样，只是后面多了五年还不错的日子。」. The user loved the abrupt stop but "都没反应过来就继续了" — extend the stop after 「戛然而止」 to about 3 s (hard silence ~2.5–3 s; the life-line itself stops dead while dust keeps drifting so it reads as intentional, not as a frozen player). Shift everything after it: subtitles, cue, music, visual anchors.
4. End mark → "Opus 5.5" (peak has its own text in src\\v4\\peak\\Overlay.tsx around line 198).
5. Audit bells (cue hits incl. bell 68.7, 96.1, 198.05, 261.45, 273.4, 278.5 — times before your shift): each must coincide with a visible emphasis; fix or remove.
User praise to preserve: the opening (melody → wrong note) was 「惊艳」, and the film overall 「做得真牛逼」.`,
  },
  {
    slug: 'hebb', name: '《赫布》',
    spec: `
1. 3:08.6 stutter: music hard-silences at 188.6 (cue silences [188.6,190.1]); the picture makes a single-frame jump (diff 15.3) plus two frozen frames at the same moment, so it looks like the player froze. Make the stop deliberate (picture cuts/fast-fades to near-black with the sound, dust keeps moving, next scene fades in after the pause). v4_stutter must report no POP/FREEZE there.
2. Line 「走过的，成了路；没走的，长回了草。」 → 「走过的，成了路；没走的，长回了荒草。」 (user: 如果台词能够改成荒草就更好了). Update the English line and any on-screen text.
3. The ending's "waiting for the light" did not work: the user did not wait for the light ("可能是不够强烈，也可能是重复的不够多"). Now: 5 ding+light pairs at 0.5–8.5 s, the 6th at 23.5 with the title, then nothing until the light-less ding at 269.0 — four minutes in which the association fades. Fix: in the last chapter (around the lines 「你闭着眼，也摸得到家里的电灯开关。」「那条路，你的手走过几千遍。」「走过的，成了路……」) re-establish 2–3 ding+light pairs with exactly the same rhythm, timbre and light shape as the opening, but a stronger, bigger, brighter light so it's unmistakable; then the final ding rings and the light does NOT come; hold darkness ~2 s; then 「四分钟了，你还在等那道光。」. If any text or doc counts the dings (e.g. 「全片七声叮」), make it consistent. Total length may grow a few seconds but must stay ≤ 4:50.
4. End mark → "Opus 5.5" (hebb's own EndMark reads meta.endmark.text from its timeline generator in 4_第四版资料\\hebb\\tools\\ / public\\v4\\hebb\\timeline_meta.json).
5. Audit every bell/ding for a matching visual emphasis.
User praise to preserve: the 鲁迅 passage 「很好，升华了，这正是我需要的」.`,
  },
  {
    slug: 'ties', name: '《弱关系》',
    spec: `
1. 2:56.4 discontinuity: music hard-silences at 176.37 (cue silences [176.37,177.87]); in the same frame the network inside the circle pops on (single-frame diff 35.9), which reads as a skipped frame. Make the stop deliberate: when the sound cuts the picture also settles into a clean state (e.g. fast fade to dark leaving only the gold line), and the network then brightens smoothly, never in one frame.
2. 3:47 (222.70–229.20) 「最能帮人换工作的，不是最弱的线，是稍强一点的。」 can be misread as strong ties, which ruins the contrast with the next line 「可你跌倒的时候，接住你的，常常是强关系。」. Make it explicitly the middling weak tie, consistent with 事实核查 #19 (LinkedIn inverted-U, peak at about 10 mutual connections), e.g. 「最能帮人换工作的，是有十来个共同好友的人。」 + 「不算熟，也不算生。」. Update English, 事实核查, and the on-screen row of 9 lines / inverted-U labels so the peak line clearly reads "约 10 个共同好友" and is still a weak tie.
3. End mark: Video.tsx uses the kit EndMark default, already changed to "Opus 5.5" by the lead — confirm the render shows exactly that.
4. Audit every bell/note for a matching visual emphasis.
Do NOT restructure the film: the user also feels 《弱关系》 lacks a 醍醐灌顶 moment, but that will be discussed with them first.`,
  },
]

const REPORT = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    changes: { type: 'array', items: { type: 'object', properties: {
      item: { type: 'string' }, what: { type: 'string' }, new_time: { type: 'string' } }, required: ['item', 'what', 'new_time'] } },
    final_path: { type: 'string' },
    duration_s: { type: 'number' },
    loudness: { type: 'string', description: 'I / TP / LRA as measured' },
    stutter_scan: { type: 'string', description: 'full v4_stutter output and your explanation of each remaining event' },
    open_issues: { type: 'string' },
  },
  required: ['summary', 'changes', 'final_path', 'duration_s', 'loudness', 'stutter_scan', 'open_issues'],
}
const VERDICT = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    checked: { type: 'string' },
    issues: { type: 'array', items: { type: 'object', properties: {
      severity: { type: 'string', enum: ['blocker', 'should-fix', 'nit'] }, where: { type: 'string' }, detail: { type: 'string' } },
      required: ['severity', 'where', 'detail'] } },
  },
  required: ['pass', 'checked', 'issues'],
}

const fixPrompt = (f, extra) => `${COMMON}

YOUR FILM: ${f.name} (slug ${f.slug}). Apply exactly these user notes:
${f.spec}
${extra || ''}
Work through to a finished, mixed, QA'd final. Return the structured report.`

const verifyPrompt = (f, rep) => `${COMMON}

You are an INDEPENDENT reviewer for ${f.name} (slug ${f.slug}). Do not edit anything except scratch files under D:\\tmp\\verify_${f.slug}. The builder claims to have applied these user notes:
${f.spec}

Builder report:
${JSON.stringify(rep, null, 1)}

Check for yourself, on ${ROOT}\\video-engine\\out\\v4\\${f.slug}\\final.mp4:
- Each note is really done: read public\\v4\\${f.slug}\\subs.json for the new text and times; extract full-size frames at the changed moments (and a few frames around them) and LOOK at them. Judge as the user would: is the 1° / 荒草 / middling-weak-tie / pause / ending-light change obvious and correct on screen, readable on a phone?
- Run D:\\conda\\envs\\d2l\\python.exe tools\\v4_stutter.py on the whole film. The user-reported spot must be gone; any remaining POP/FREEZE needs a convincing intentional reason, otherwise it's an issue.
- Loudness via ffmpeg ebur128: I −16 ± 0.5, TP ≤ −1.5, LRA 7–10. Duration sane (≤ 4:50).
- Last 2 s show only "Opus 5.5" as the end mark.
- For each bell/ding in public\\v4\\${f.slug}\\cue.json, grab frames at the hit time and ±0.3 s: is there a visible emphasis on that beat?
- No regressions: compare contact sheets (every 10 s) of final.mp4 vs final_1008.mp4 in the same folder; outside the changed regions the films should match (allowing a time shift after a lengthened pause).
pass=true only if there are no blocker or should-fix issues.`

const RESUME_HEAD = `
RESUMING AN INTERRUPTED ATTEMPT: a previous agent started exactly this task and was cut off mid-way by a usage limit (no new final was rendered). Its partial edits are ALREADY in the files listed below. First inspect the current state (read the changed files; compare subs.json / cue.json text and times against the spec; check what each note still needs), then finish the job from there. Do not start over, do not blindly revert, and treat anything half-done as yours to complete or correct. Leftover scratch from the previous attempt may exist under D:\\tmp\\v4<slug> and out\\v4\\<slug>.`
const RESUME = {
  peak: `${RESUME_HEAD}
Files already changed for peak: src\\v4\\peak\\{Overlay.tsx, Video.tsx, warp.ts (new), scenes\\s1.ts, s2.ts, s4.ts, s6.ts}; public\\v4\\peak\\{cue.json, subs.json, numbers.json, music.wav, mix.wav}; 4_第四版资料\\peak\\build_timeline.py. The previous agent saved a full backup of the 10-08 state in out\\v4\\peak\\bak_1008\\ (src, public, doc) — use it to diff what changed. out\\v4\\peak\\final.mp4 is still the 10-08 render (rename it to final_1008.mp4 before rendering).`,
  hebb: `${RESUME_HEAD}
Files already changed for hebb: src\\v4\\hebb\\{Video.tsx, scenes\\s4.ts, scenes\\s6.ts}; public\\v4\\hebb\\{cue.json, subs.json, timeline_meta.json, music.wav, mix.wav}; 4_第四版资料\\hebb\\tools\\subs_timeline.py; a test clip out\\v4\\hebb\\fix1012\\seg_silence.mp4. out\\v4\\hebb\\final.mp4 was already renamed to final_1008.mp4 (the 10-08 version); there is no new final yet. No source backup exists — the 10-08 film is ${ROOT}\\成片\\4_第四版_vibe知识大赏\\C_赫布.mp4 if you need to compare.`,
  ties: `${RESUME_HEAD}
Files already changed for ties: src\\v4\\ties\\{data.gen.ts, Overlays.tsx, scenes\\s2022.ts, time.ts, Video.tsx, world.ts}; public\\v4\\ties\\{cue.json, subs.json}; 4_第四版资料\\ties\\{ties_anchors.json, ties_anchors_story.json, ties_timeline.py}. Music (music.wav/mix.wav) has NOT been regenerated yet. out\\v4\\ties\\final.mp4 is still the 10-08 render (rename it to final_1008.mp4 before rendering). No source backup exists — the 10-08 film is ${ROOT}\\成片\\4_第四版_vibe知识大赏\\B_弱关系.mp4.`,
}

phase('Fix')
const results = await pipeline(
  FILMS,
  f => agent(fixPrompt(f, RESUME[f.slug]), { label: `fix:${f.slug}`, phase: 'Fix', schema: REPORT }),
  (rep, f) => agent(verifyPrompt(f, rep), { label: `verify:${f.slug}`, phase: 'Verify', schema: VERDICT })
    .then(v => ({ rep, v })),
  async ({ rep, v }, f) => {
    if (!v || v.pass) return { slug: f.slug, rep, verdict: v, rounds: 1 }
    const extra = `\nAN INDEPENDENT REVIEWER FOUND THESE PROBLEMS IN YOUR FIRST PASS — fix all blocker/should-fix items, re-render, re-QA:\n${JSON.stringify(v.issues, null, 1)}\n`
    const rep2 = await agent(fixPrompt(f, extra), { label: `fix2:${f.slug}`, phase: 'Fix', schema: REPORT })
    const v2 = await agent(verifyPrompt(f, rep2), { label: `verify2:${f.slug}`, phase: 'Verify', schema: VERDICT })
    return { slug: f.slug, rep: rep2, verdict: v2, firstVerdict: v, rounds: 2 }
  },
)
return results
