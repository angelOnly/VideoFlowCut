"""合并作者分类，与来源清单绑定；不从标题自动猜测专业用途。"""
import json, pathlib

ROOT=pathlib.Path(__file__).resolve().parent.parent
VOCAB={
 'original_form':['固定视频','网页交互演示','游戏演示'],
 'video_types':['口播混合','新闻解读','科普解释','产品介绍','操作教程','品牌展示','影像展示','空间导览'],
 'scenes':['集合聚焦','整体到局部','多来源对照','步骤累积','跨场景接力','前后变化','条件解释','空间关系','重点强调','成果展示'],
 'materials':['人物视频','背景视频','照片','手机界面','桌面界面','文章页面','图表','插画','三维','文字','抽象图形'],
}
def read(path): return json.loads(path.read_text(encoding='utf-8-sig'))
def build():
    sources={c['case_number']:c for c in read(ROOT/'manifest.json')['cases']}
    result=[];seen=set()
    for owner in ['study_mixed','study_explainer','study_spatial']:
        records=read(ROOT/'catalogue-parts'/f'{owner}.json')
        assert len(records)==40,(owner,'必须40条')
        for c in records:
            n=c['case_number'];src=sources[n]
            assert n not in seen and c['slug']==src['slug'],n
            seen.add(n)
            for key,allowed in VOCAB.items():
                values=[c[key]] if key=='original_form' else c[key]
                assert isinstance(values,list) and values and all(v in allowed for v in values),(n,key,values)
            for key in ['scenario','material_requirements','transfer_cost']:
                assert isinstance(c[key],str) and c[key].strip(),(n,key)
            for key in ['methods','art','aliases']:
                assert isinstance(c[key],list) and c[key] and all(isinstance(v,str) and v for v in c[key]),(n,key)
            duration=float(src['media_metadata']['format']['duration'])
            assert c['recommended_segments'],n
            for segment in c['recommended_segments']:
                assert 0<=segment['start']<segment['end']<=duration and segment['reason'],(n,segment,duration)
            directory='cases/'+c['slug']+'-original'
            record=read(ROOT/directory/'observation-record.json')
            assert record['source_sha256']==src['sha256'],n
            ranges=[]
            if 'dense_source_range_seconds' in record: ranges.append(record['dense_source_range_seconds'])
            for r in record.get('dense_ranges',[]):
                ranges.append([r.get('first_source_pts',r.get('start')),r.get('last_source_pts',r.get('end'))])
            for segment in c['recommended_segments']:
                assert any(a is not None and b is not None and a-0.05<=segment['start'] and segment['end']<=b+0.05 for a,b in ranges),(n,'推荐段不在观察范围')
            c.update(title=src['title'],author=src['author'],duration=duration,directory=directory,
                detail=directory+'/index.html',analysis=directory+'/analysis.md',brief=directory+'/replication-brief.md',
                observation=directory+'/observation-record.json',source_sha256=src['sha256'],classification_owner=owner,
                poster=directory+'/fullsize/frame-02.jpg',
                media=directory+'/media/'+('browser-compatible.mp4' if n==1 else 'original.mp4'))
            result.append(c)
    assert seen==set(range(1,121))
    output={'schema_version':1,'count':120,'path_base':'本索引所在目录','scope':'整片源帧概览与关键过程拆解；原速、声音未专业核验；后写复现输入未制作验证','vocabulary':VOCAB,'cases':sorted(result,key=lambda c:c['case_number'])}
    (ROOT/'case-catalogue.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('已生成120条共用分类索引')
if __name__=='__main__': build()
