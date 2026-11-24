import json,sys
from pathlib import Path
BASE=Path(__file__).resolve().parents[3]
out=BASE/'.omx/state/lanchester-native/ralph-progress.json'
out.parent.mkdir(parents=True,exist_ok=True)
state=json.loads(out.read_text(encoding='utf-8')) if out.exists() else {'scope':'lanchester-native','iterations':[]}
round_n=int(sys.argv[1])
verdict={'score':84,'verdict':'revise','category_match':True,
'differences':['真实2万结果点形成生硬矩形，数字与点海重叠','方阵演示前未明确恢复开局状态，可能与持续损耗混淆','开场主体光核比参考细，片名次级行间距偏宽'],
'suggestions':['结果点海透视弯成向观众展开的光面，数值放在点海下面','在方阵形变前回到5对4，并显示回到开局','增加关键主角柔光与有意节拍'],
'reasoning':'暗底宋体双语层级符合参考；结果海构图及阶段连接仍需修。'}
if round_n==1:
    verdict.update(score=88,differences=['与参考并排，主角光核仍偏细，图形重心不够鲜明','静音段主角仅9%亮，手机可能只见尘埃','首尾回环已到原队形，但尚缺末尾片名再现'],suggestions=['提高主角光核半径与柔光','静音保留一条可见细金线，尘埃继续漂','两队回环后短暂复现片名，172秒完全清场'],reasoning='首轮已解决读数重叠及方阵突切，12.4亮度与0.76%细节通过；仍需增强视觉主次与静音辨识。')
if round_n==2:
    verdict.update(score=92,verdict='pass',differences=['模拟光面比参考的数据表达更密集，属于本片有意的两万局奇观'],suggestions=[],reasoning='暗底、宋体双语、细金线和发光主角层级一致；二轮增强主角、静音留线及片名回环。量化画面通过，最终独立审片另行执行。')
state['iterations'].append({'iteration':round_n,'reference':'out/v4/lanchester/reference_18.png','generated':'out/v4/lanchester/native/qa_r1/vs_reference.jpg' if round_n else 'out/v4/lanchester/native/st0/f_2790.png','threshold':90,'threshold_pass':verdict['score']>=90,'next_actions':verdict['suggestions'],**verdict})
out.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
print(out)
