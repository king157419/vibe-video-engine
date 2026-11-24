from pathlib import Path
p=Path(__file__).resolve().parent
s=(p/'final_checks.py').read_text(encoding='utf-8')
for a,b in [('final_render.mp4','final_cloud_render.mp4'),('final.mp4','final_cloud.mp4'),('qa_final','qa_cloud'),('stutter_final','stutter_cloud'),('audio_final','audio_cloud'),('probe_final','probe_cloud'),('hit_frames','hit_frames_cloud'),('cover.png','cover_cloud.png'),('bell_contact.jpg','bell_contact_cloud.jpg'),('最终验证.json','最终验证_cloud.json')]:
    s=s.replace(a,b)
(p/'final_cloud_checks.py').write_text(s,encoding='utf-8')
