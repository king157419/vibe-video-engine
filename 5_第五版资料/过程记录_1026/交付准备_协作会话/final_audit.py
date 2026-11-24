"""Read-only delivery verification plus PDF page render; does not alter delivery files."""
from pathlib import Path
import hashlib,json,subprocess,re
from collections import Counter
import fitz

ROOT=Path('D:/desk/claudex/24')
DEL=ROOT/'成片/5_第五版_vibe知识大赏'
REPORTS=Path('D:/desk/claudex/_reports')
OUT=Path('D:/tmp/v4report_independent')
OUT.mkdir(parents=True,exist_ok=True)
PDF=REPORTS/'1027-0248 萤火第五版：三片完成待听音验收.pdf'
EXPECTED={'A_宝宝.mp4':'13cfa367377a2c011b5ff6332a72dc04a4107631a0029042d67d12b21dace79e',
 'B_星空的风.mp4':'5e797687c82928c48dd2dd52900df9b7917ec0241f8e20ad844b2512a8b81cb4',
 'C_五打四.mp4':'af07381b5f5bd9abf0c18ee632344f500ee8cf31e9ce1515534c90aa3e63aebb'}
def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for block in iter(lambda:f.read(4*1024*1024),b''):h.update(block)
    return h.hexdigest()
def probe(p):
    return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate','-show_entries','format=duration','-of','json',str(p)]))
results={'originals':{},'previews':{},'pdf':{},'indexes':{}}
for filename,expected in EXPECTED.items():
    p=DEL/filename
    actual=sha(p);assert actual==expected,(filename,actual)
    info=probe(p);v=next(x for x in info['streams'] if x['codec_type']=='video')
    assert (v['width'],v['height'],v['r_frame_rate'])==(1920,1080,'30/1')
    results['originals'][filename]={'bytes':p.stat().st_size,'sha256':actual,'probe':info}
    stem=p.stem
    for suffix in ['_封面.png','_发布文案.md']:
        assert (DEL/(stem+suffix)).is_file()
    pp=DEL/'手机预览'/(stem+'_手机预览.mp4')
    pi=probe(pp);pv=next(x for x in pi['streams'] if x['codec_type']=='video')
    assert (pv['width'],pv['height'])==(1280,720)
    assert pv['nb_frames']==v['nb_frames'],(filename,pv['nb_frames'],v['nb_frames'])
    results['previews'][pp.name]={'bytes':pp.stat().st_size,'probe':pi}

report=fitz.open(PDF)
sizes=Counter();alltext='';overflows=[]
for i,page in enumerate(report):
    page.get_pixmap(matrix=fitz.Matrix(1.7,1.7)).save(OUT/f'page_{i+1:02}.png')
    alltext+=page.get_text()
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line['spans']:
                sizes[round(span['size'],1)]+=len(span['text'])
                box=span['bbox']
                if box[0]<-1 or box[2]>page.rect.width+1 or box[1]<-1 or box[3]>page.rect.height+1:
                    overflows.append({'page':i+1,'text':span['text'],'bbox':box})
assert sizes and sizes.most_common(1)[0][0]>=10,sizes
assert not overflows,overflows
assert '\ufffd' not in alltext
md=PDF.with_suffix('.md').read_text(encoding='utf-8-sig')
body=md.split('## 附件')[0]
results['pdf']={'path':str(PDF),'pages':len(report),'font_mode':sizes.most_common(1)[0],'body_chars':len(body),'body_han_chars':len(re.findall(r'[\u4e00-\u9fff]',body)),'rendered_pages':str(OUT),'overflow_count':len(overflows),'bytes':PDF.stat().st_size}
report.close()
for name,path in [('README',ROOT/'README.md'),('catalog',DEL.parent/'成片目录.md')]:
    text=path.read_text(encoding='utf-8-sig')
    results['indexes'][name]={'fifth_version_link':'5_第五版_vibe知识大赏' in text,'all_titles':all(x in text for x in ['宝宝','星空的风','五打四'])}
ledger=(ROOT/'4_第四版资料/片单.md').read_text(encoding='utf-8-sig')
results['indexes']['ledger']={'all_three_rows':all(f'| 第五版{x} |' in ledger for x in 'ABC'),'all_concepts':all(x in ledger for x in ['娃娃脸图式','湍流级串','兰彻斯特平方律'])}
unread=(REPORTS/'未读清单.md').read_text(encoding='utf-8-sig')
results['indexes']['unread']={'report_present':PDF.name in unread,'pending_reports':sum(1 for x in unread.splitlines() if x.startswith('- [') and '暂搁' not in x and '已确认查看' not in x)}
log=(ROOT/'5_第五版资料/执行日志_1026.md').read_text(encoding='utf-8-sig')
results['indexes']['log']={'all_done_marker':'全部完成' in log,'report_path_present':PDF.stem in log}
(OUT/'audit.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'original_hashes':'3/3 PASS','previews':'3/3 720p, full frame counts PASS','pdf':results['pdf'],'indexes':results['indexes']},ensure_ascii=False,indent=2))
