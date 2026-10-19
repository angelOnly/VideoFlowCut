# 物件资源准备与正式使用

本页供主任务执行视觉作者已经确定的资源加工。
先调用 `read_object_resource_capabilities`；`read_motion_capabilities.objectResources` 也公开相同能力。
宿主未列出 `prepare_object_resources` 时先核对实际发行版本，不把文档接口名当成已经部署。

输入使用当前项目内的真实源 Asset、明确的裁切区域、可选遮罩、部件局部坐标和打包要求。
工具负责可重复的裁切、透明处理、图集与清单，不自动推断语义分层、不补画隐藏结构。
缺少源文件或遮罩时先取得，不使用虚构路径或资产 ID。

主任务沿原 Revision 和正式写入规则调用，等待 Job 并读取真实结果。
成功后把派生 Asset、布局清单、输入哈希及必要限制返回原视觉作者，
不是只通知“图片已生成”。资源错误保持失败原因，不用纯色代替后写完成。

图集布局描述各部件原局部框、透明裁切偏移、图集中位置和像素尺寸。
视觉用同一局部坐标组装部件，先恢复原框，再围绕规定轴心运动。
图片通过 imageBindings 和 props.assets 使用；图集清单不是新的视频对象类型。
现有正式作品的源码、Props 和槽位限制照常检查，不绕过生产合同。

加工成功只证明文件可用。主体结构与美术由视觉作者在当前场面检查；
实际材料或处理参数改变时重算依赖，只有说明文字改变不重做图片或视频。

## 正式参数与结果

`prepare_object_resources` 接收 `project_id`、整数 `base_revision_id` 和 `idempotency_key`，
沿既有 Job 合同调用 `track_job` 等待。`sources` 每项为 `{id, asset_id}`；
`parts` 每项为 `{id, source_id, source_rect?, alpha_mask_source_id?, mask_mode?, trim_transparent?, local_rect}`。
所有框为 `{x,y,width,height}`；`source_rect` 是规范化方向后的整数源像素，省略取整图；
`local_rect` 是本片主体坐标中的完整占位，可用负坐标及小数，不是裁边后的包围框。
`mask_mode` 与遮罩源同时明确提供：`alpha` 乘源透明度；`luminance` 用 sRGB 灰度亮度乘遮罩透明度，
再乘源透明度。遮罩与规范化源必须同尺寸，不自动缩放。

`atlas` 为 `{enabled,max_side,max_pages}`；禁用时每部件单页，仍检查页数及边长。
按当前能力与作品剩余图片槽确定页数，其他绑定也占用八个槽位。
排列按高度、宽度、部件 ID，保留两像素边缘扩展，不旋转、不缩小。
超页数时从 Job 的 `objectResourceFailure` 读取 `requiredPages` 与 `largestParts`，交原作者决定。
版本冲突、源变更或文件损坏明确失败；不覆盖已登记资源，不换键重放未知任务。
加工期间避免其他正式写入；完成登记仍核对提交时的 Revision。

成功 Job 返回 `revision`、`assetIds`、`inputHash`、`layoutPath` 和可读 `layout`。
每页是既有 `image` Asset，通过 provenance 保存派生来源、源哈希和配套布局，不新增物件对象类型。
资源由源字节、规范化方式、部件区域、裁边和打包输入确定；修改项目显示名不重做图片。

## 图集部件显示与轴心

对一个部件令 `sx = localRect.width/sourceSize.width`、`sy = localRect.height/sourceSize.height`。
可见容器位置为 `localRect.xy + trimOffset * (sx,sy)`，尺寸为 `atlasRect.wh * (sx,sy)`；
内部 `Img` 尺寸为整页尺寸乘 `(sx,sy)`，偏移为 `-atlasRect.xy * (sx,sy)`。
容器使用 `overflow:hidden`；原局部完整框和轴心不因透明裁边改变。
是否允许非等比缩放由作者决定。多个部件独立控制，共用一页的真实图片绑定。
`Img` 与 SVG 放在同一局部父层的兄弟层，不使用 SVG `image href`、外链或 `foreignObject`。
