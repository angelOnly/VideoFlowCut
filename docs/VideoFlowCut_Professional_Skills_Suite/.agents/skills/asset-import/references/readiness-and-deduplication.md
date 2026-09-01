# 就绪与去重

## 去重层级

- 文件哈希完全相同；
- 代理或转码版本相同；
- 视觉内容近似；
- 同一来源不同下载尺寸；
- 同一镜头不同裁切。

不应因为文件名不同就重复导入。

## 状态拆分

上传成功不等于可剪：

```text
registered
→ transferred
→ probed
→ proxy_ready
→ thumbnail_ready
→ optional_asr_ready
→ optional_visual_analysis_ready
→ rights_ready
→ ready
```

Scene 只要求它实际依赖的状态，但必须显式说明。

## 失败恢复

单个派生任务失败时保留原 Asset，不重复上传原文件。只重跑失败派生任务。
