from pathlib import Path
import json
BASE=Path(__file__).resolve().parents[3]
p=BASE/'.omx/state/lanchester-native/ralph-progress.json'
d=json.loads(p.read_text(encoding='utf-8'))
d['iterations'].extend([
dict(iteration=3,score=82,verdict='revise',category_match=True,threshold=90,threshold_pass=False,
     differences=['独立审片P1：原结果海具有硬边矩形轮廓，手机缩小成灰板'],suggestions=['保留每局真实索引，改自然消散、有深度的点海'],
     reasoning='独立审片指出奇观不充分，必须实改。',next_actions=['四层确定性点云、保留索引/坐标/颜色验证']),
dict(iteration=4,score=94,verdict='pass',category_match=True,threshold=90,threshold_pass=True,
     generated='out/v4/lanchester/native/cloud_review/f_3000.png',reference='out/v4/lanchester/reference_190.png',
     differences=['两万模拟结果刻意比普通叙事帧更密集'],suggestions=[],reasoning='自然羽化边缘消除了矩形，四层饱和金蓝光点有深度与视差；20000逐局索引保持完整。独立静帧与新版终片仍需审片人批准。',next_actions=['等待独立静帧复核','全尺寸重渲并重跑QA/stutter'])])
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
