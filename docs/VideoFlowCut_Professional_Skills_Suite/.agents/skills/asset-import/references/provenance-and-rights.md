# 来源与权利

每个外部 Asset 至少保存：

- source_provider；
- source_page；
- original_asset_id；
- creator；
- license；
- attribution_text；
- downloaded_at；
- content_hash；
- generated / captured / stock / user-owned；
- rights_status。

## 权利状态

- cleared：已确认允许当前用途；
- attribution_required：允许但必须署名；
- restricted：仅限特定用途；
- unknown：禁止进入正式导出；
- rejected：不可使用。

## 证据与生成内容

生成画面可以表达：

- 抽象情绪；
- 概念隐喻；
- 非特定生活空镜；
- 风格化说明。

生成画面不得冒充：

- 真实历史事件；
- 新闻现场；
- 某个人物真实行为；
- 官方文件；
- 真实数据证据。

## 导出

需要署名的素材应进入 AttributionManifest。任何 rights_status=unknown 的正式使用素材应阻断导出。
