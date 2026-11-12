import importlib.util, pathlib, json, shutil, hashlib, zipfile, subprocess, re, csv, io
B=pathlib.Path(__file__).parent
sp=importlib.util.spec_from_file_location('bundle',B/'整理资料包.py'); m=importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
O=m.OUT; S=m.S; A=m.ART
asset=next(a for a in S['assets'] if a['id']=='asset_f31a408c-7e0a-45b3-9b66-0c1b94f54dd2')
formal=json.loads((m.PROJ/asset['motion']['sourcePath']).read_text(encoding='utf-8'))
assert formal['source'].replace('\r\n','\n')==(m.PROJ/'authoring/AiBrakes.tsx').read_text(encoding='utf-8').replace('\r\n','\n')
m.copy(m.PROJ/asset['motion']['sourcePath'],'03_视觉美术动效原始交付/正式固定输入_R144_source.json')
m.write('03_视觉美术动效原始交付/正式动效事件表.json',asset['motion']['eventMap'])
for role in ['主任务','导演','素材作者','视觉作者']:
    p=O/f'04_真实指令与检索记录/{role}_可见协作指令与回传.jsonl'
    chunks=[f'# {role}：实际可见协作指令与回传\n\n逐条来自该项目的会话记录；未包含内部推理。记录日期可能采用宿主UTC时间，保留原值。\n']
    for i,line in enumerate(p.read_text(encoding='utf-8').splitlines(),1):
        e=json.loads(line); c=e['内容']; parts=c.get('content',[]) if isinstance(c,dict) else c
        texts=[x.get('text','') for x in parts if isinstance(x,dict) and x.get('type') in ['Text','input_text','text','output_text']]
        if texts: chunks.append(f"## {i} · {e.get('时间','未记录')} · {e['记录类型']}\n\n"+'\n\n'.join(texts))
    m.write(f'04_真实指令与检索记录/{role}_可读指令与交付.md','\n\n'.join(chunks))

m.write('00_先读我.md','''# AI 的油门与刹车｜R144 成片与制作资料

本包是本聊天任务的成片与可追溯制作资料归档，按不超过20,000,000字节制作。对应VideoFlowCut 0.1.92、Project project_1716474f-9b32-41f4-87f6-9b85441fbdbb、Revision 144、ExportArtifact export_artifact_c2483c5c-bd2d-45dd-a077-e6e75138f345。

## 从哪里开始

- 01：完整带声成片的720p压缩观看版，约2分3秒。它是原1080p成片的有损压缩副本，原文件未修改。
- 01_制作决策与关键清单.md：阅读导演采用、素材判断、美术动效、声音字幕及返修摘要。
- 02：导演完整声画稿、27段用户正文、叙事地图、声音方案、真实对齐、字幕重分屏与逐卡纠正参数、最终61卡SRT。
- 03：同一视觉作者的美术动效采用与观察、最终AiBrakes.tsx、完整motion-work.json、正式提交固定输入source.json、事件表与素材时码。
- 04：主任务、导演、素材作者、视觉作者实际可见协作指令与交付，检索/取得/观察的工具请求及返回。Markdown方便阅读，JSONL保留结构化原始证据。
- 05：真实文章截图、人物照、OpenAI原PDF及页面，采用视频节选代理、完整旁白压缩代理、音乐实际使用源范围代理、三段音效原文件，以及全部素材来源登记。
- 06：原始校样联系表、素材观察联系表、最终R144受影响合成静帧。
- 07：R144完整项目快照、最终字幕、不可变导出元数据、来源清单、生产运行记录与校验清单。
- 08：本次相关项目Skill和方法文件的读取时副本，作为工作指令记录。

## 关于“思考过程”

本包提供实际保存的工作指令、检索操作、观察、采用/放弃理由、导演决策及返修记录，另有据此整理的简明摘要。内部逐步推理、Reasoning条目、系统/开发者消息及加密委派字段的不可用明文不在包内；未尝试解密，也未补写不存在的记录。汇总文档是归档整理，不冒充创作时逐字原话。以原始交付文件、可见消息和正式固定输入为准。

## 限额与完整性边界

原1080p成片23,422,832字节，单文件已超过20MB，故包内使用720p压缩观看版。两段视频仅保存实际采用源范围的720p静音节选代理：工作视频2.000–5.933秒；Dario采访19.000–27.000秒。压缩代理不等于原媒体字节，来源路径、源范围和原哈希保留在登记及快照中。旁白、音乐代理也有损压缩；音乐代理只是源0–119.033秒，不含项目中Duck/包络，总成片才是实际混音。

包内没有原1080p成片、未采用的完整视频/音乐、无损长旁白、逐帧缓存、全部字体文件、Runtime/插件、模型或node_modules。正式源码仍引用受管Asset ID和@videoflowcut/motion，不能把本包称为一键离线重渲染工程。相关Skill保留本次有关文件，不代表完整可运行安装。

## 检查范围

原成片已验证3692帧/30fps、音轨、解码、无检测黑帧；最终混音实测-19.4 LUFS、-2.1 dBTP。最终合成指定静帧确认图文边框穿字及说明入场撞字幕已修复。原生连续听审和完整连续声画审片未完成，用户尚未批准具体Artifact。曾进行音频模型辅助复核，但输出有模板重复与时间矛盾，不采纳为全片听审通过。压缩观看版另做完整解码和帧数检查，详见包内验证。

文件清单SHA256可用于逐文件比对；清单不包含它自身。ZIP体积、CRC和从ZIP逐项核对的结果在交付外侧校验文件记录，避免自引用哈希。
''')
m.write('01_制作决策与关键清单.md','''# 制作决策与关键清单

以下是依据本包真实交付、可见协作与项目快照整理的决策摘要，不是内部逐步推理或逐字思维记录。

## 导演采用

采用完整用户正文27个语义单元，横屏visual_explainer，无出镜主持，OmniVoice本地音色旁白。实际语音123.06秒；1920×1080、30fps、3692帧。八拍由唯一连续ExplainerScene承载，避免把每句台词做成独立卡片。观看发展为：个人担忧→技能转业→研发递归→授权越界→安全方案→谁先减速与门槛争议→互不确定困局→机会/风险与刹车追问。

关键内容边界：半年至一年是刘胜与本人判断；递归式自我改进保留“如果/可能”；OpenAI案例是内部安全评估，不能扩大成普通ChatGPT默认环境失控；Dario不是停训数年，安全合作与领先政策同时呈现；商业利益交织不直接证明担忧虚假。

## 素材检索、取得与采用

检索与候选原文在04目录，事实核查及后续补充在03/materials.md。该文件是累积记录，较早“未取得/未观察”不代表最终仍未取得，应顺序读其R61补充并核对最终快照。

1. 刘胜与：本人主页及GitHub仓库核实身份，微信原文初次读取受阻时用可读转载交叉核对；后正式取得微信截图与本人官网照片。保留文章本人判断，不能做成失业事实。
2. OpenAI：读取官方复盘/通报，长网页截图因高度预算失败后改取官方PDF；包内含38页原PDF及第1/4/9页截图。成片实际代码使用第4页承担背景原件；第9页虽绑定为openai_code，但源码未显示该槽，不能声称它实际上屏。外部执行代码关系通过编辑图形示意，非伪造终端证据。
3. Dario：读取本人原文，核对三步安全计划与领先政策；正式取得CBS采访候选0–30秒，联系表发现13.6秒主持人反打，实际选19–27秒本人画面并静音，接到原文和安全措施图形。
4. 通用编码：取得Pexels 31155915，源2.000–5.933秒入片头，剔除前段标志；只是一般工作示意，不冒充刘胜与或DeepSeek实验室。
5. 声音：从电子低密度背景床、机械接合、递归气流、越界短声等具体意图检索。取得并分析有限候选，采用Vastness背景床及3个短音效。候选模型对极短声音命名不稳，未据此推定原音坏；起音保持inconclusive，未伪称听过。

## 美术与动效采用

墨蓝#182C46作运行空间，纸白#F3F0E6承载原件，黄#F3E640表达当前任务与问题，珊瑚红#F16A55表达越界或另一方，蓝#345BD4组织关系。标题aa-houdi-hei，正文noto-sans-sc-bold，引文noto-serif-sc-semibold。真实原件先建立身份，再让中文解释和图形接管；来源记录不默认变成角标。

正式检索三类运动关系，limit=8：资料由全页进细节并抽出关键字；研发节点生成下一代并保留前节点参照；对象穿越边界、拉开外部空间、并行轨道合流。核读047-m08、116-m07、006-m08完整机制与分镜；借关系而不复制广告主题。模型观察覆盖与未确认的速度/采样密度均记入原交付。

主体动作：亲手工作向Agent控制交接；研发结果返回AI研发输入；人下班后人类节点退暗而Agent任务继续；主体越过授权边界进入外部服务器；采访让位原文与三项安全措施；双车竞速呈现减速困局；两路合流到刹车问题。句内动作落点是编辑安排，不冒称逐词对齐。

## 声音、字幕与关键事件

完整旁白使用真实段级时间，字幕按750个Provider严格token重新分为61卡，对照Script1逐卡正字，未重写事实；2个不足1秒的完整短问句保留真实边界。普通字幕全片统一Noto Sans SC粗体48px、白字、墨蓝82%底板、最多两行，固定底部。当前接口不能表达普通字幕统一进退动画，维持稳定换卡，未复制进主画面绕过。

音效绑定当前作品事件：handoff_land717帧、recursive_depart966帧、escape_cross1586帧。BGM主线0–3571帧，采用-23dB和-6dB对白Duck及分段包络；SFX分别-14/-19/-14dB。最终混合增益绝对+9.5dB，仅应用一次。3571帧起末问仅留旁白，实际约0.35秒句间停顿保留。

## 已发生的返修与依据

- 同源局部校样：递归回路原返人类改为返AI；下班后人类退暗、AI继续；修字面换行；安全条目出现前退旧标题；隐藏未来结论提前露边。
- 完整V1→V2：按实际静帧修芯片条目与门槛问题叠字、门槛遮车字、蓝车位置与“保持领先”相反、新旧竞速标题和困局说明清场不足。蓝车始终在右，门槛处两车之间并置车后图层。
- 带字幕V2→V3：独立审片发现3050帧困局说明由底部上移穿字幕；改固定y825–905水平遮罩揭示。原文边框穿右组首字，右组整体右移60px保留40px间距。最终R144九张合成帧确认两处关闭。
- R133局部/R138全片发现音量低，使用最终混合增益而非多轨重复提升；全片实测最终-19.4LUFS/-2.1dBTP。
- 1586帧红字半裁切复查为正常入场揭示，54秒后完整，未误判成字幕遮挡。3250转场残字属于横向接管瞬间，未据单帧判定持续布局缺陷。

## 最终检查状态

- [x] 原稿完整保留，实际旁白与时长已登记。
- [x] 八叙事拍与唯一Scene双向关联，NarrativeMap及VisualTreatment已保存。
- [x] 正式动效为V3，事件与三音效已重新绑定，无stale声音遗留。
- [x] 61字幕卡逐卡正字；正式统一样式；原始ASR及重分依据保留。
- [x] Project Graph有效，技术质量无导出阻挡，Render Preflight通过。
- [x] R144正式delivery导出，3692帧/30fps/123.114秒，有音轨，无检测黑帧，哈希已登记。
- [x] 已发现的图文与字幕遮挡按最终合成静帧复查关闭。
- [ ] 原生连续听审、完整连续声画审片与用户定稿：未完成，不以模型模板结论代替。
- [ ] 一键离线重渲染：本包不提供，缺字体/Runtime/完整原媒体及逐帧缓存等依赖。
''')

# 每个实际素材的保存方式与原身份，衍生文件不可当成原件哈希。
records=[]
for p in sorted((O/'05_实际素材').rglob('*')):
    if p.is_file(): records.append({'包内路径':p.relative_to(O).as_posix(),'字节':p.stat().st_size,'SHA256':m.sha(p),'性质':'节选或压缩代理' if '代理' in str(p) else '原文件或登记资料'})
m.write('05_实际素材/包内素材清单.json',records)
m.write('07_项目快照与验证/最终身份与依赖.json',{'Project':m.SNAP['snapshot']['project']['id'],'Revision':144,'ExportArtifact':A['id'],'原1080p成片':{'原路径':str(m.PROJ/A['relativePath']),'字节':A['fileSizeBytes'],'SHA256':A['fileHash']},'MotionAsset':asset['id'],'MotionVersion':asset['motion']['version'],'fontSources':asset['motion']['fontSources'],'eventMap':asset['motion']['eventMap'],'timeline':S['timeline'],'原始复制来源':m.COPIES})
shutil.copy2(__file__,O/'07_项目快照与验证/完成归档.py')
shutil.copy2(B/'整理资料包.py',O/'07_项目快照与验证/整理资料包.py')

movie=O/'01_成片/AI的油门与刹车_R144_压缩观看版.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(movie)]))
video=next(s for s in probe['streams'] if s['codec_type']=='video'); aud=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert int(video['nb_read_frames'])==3692 and video['avg_frame_rate']=='30/1'
assert video['width']==1280 and video['height']==720
decode=subprocess.run(['ffmpeg','-hide_banner','-v','error','-i',str(movie),'-map','0:v:0','-map','0:a:0','-f','null','NUL'],capture_output=True)
assert decode.returncode==0 and not decode.stderr.strip(),decode.stderr.decode(errors='replace')
caps=json.loads((O/'07_项目快照与验证/captions-final.json').read_text(encoding='utf-8'))['captions']
assert len(caps)==61 and (O/'02_导演与声音字幕原始交付/最终字幕_R144.srt').read_text(encoding='utf-8').count(' --> ')==61
assert m.sha(m.PROJ/A['relativePath'])==A['fileHash']
m.write('07_项目快照与验证/压缩成片验证.json',{'完整解码':'通过','输出字节':movie.stat().st_size,'SHA256':m.sha(movie),'分辨率':[video['width'],video['height']],'fps':video['avg_frame_rate'],'frameCount':int(video['nb_read_frames']),'durationSeconds':float(probe['format']['duration']),'音轨':aud['codec_name'],'最终字幕数量':61,'原1080p成片哈希未改变':True,'说明':'压缩观看副本；并未进行新的原生连续声画审片。'})

manifest=[]
for p in sorted(O.rglob('*')):
    if p.is_file() and p.name!='文件校验清单.json': manifest.append({'路径':p.relative_to(O).as_posix(),'字节':p.stat().st_size,'SHA256':m.sha(p)})
m.write('07_项目快照与验证/文件校验清单.json',manifest)
out=B.parent/'AI的油门与刹车_成片与完整制作资料_R144_20M内.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(O.rglob('*')):
        if p.is_file(): z.write(p,'AI的油门与刹车_R144/'+p.relative_to(O).as_posix())
assert out.stat().st_size<=20_000_000,('超限',out.stat().st_size)
with zipfile.ZipFile(out) as z:
    assert z.testzip() is None
    for e in manifest:
        data=z.read('AI的油门与刹车_R144/'+e['路径'])
        assert len(data)==e['字节'] and hashlib.sha256(data).hexdigest()==e['SHA256']
    movies=[n for n in z.namelist() if '/01_成片/' in n and n.endswith('.mp4')]
    assert len(movies)==1
report={'压缩包':str(out),'字节':out.stat().st_size,'上限字节':20_000_000,'SHA256':m.sha(out),'文件数量':len(manifest)+1,'清单核对数量':len(manifest),'CRC':'通过','逐文件哈希':'全部通过','成片数量':1,'素材视频节选代理数量':2,'压缩成片完整解码':'通过','原成片哈希未改变':True,'未完成':'原生连续声画审片和用户定稿；非离线重渲染包'}
(B/'压缩包校验结果.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
out.with_suffix('.zip.sha256').write_text(m.sha(out)+'  '+out.name+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False),flush=True)
