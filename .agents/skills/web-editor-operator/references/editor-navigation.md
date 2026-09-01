# 编辑器定位协议

## 深链接优先

链接应尽可能包含：

- project；
- timeline；
- scene；
- object；
- frame；
- revision。

## 选中确认

执行写操作前，通过至少两项确认选中对象：

- Inspector 显示对象 ID；
- Timeline 高亮；
- Preview 选框；
- Scene 卡片高亮；
- URL 参数。

## Canvas Timeline

若 Timeline 使用 Canvas，必须通过辅助 DOM 或对象面板读到：

- 轨道；
- 起止帧；
- 对象 ID；
- 选中状态；
- 锁定状态。

## Revision 对比

对比两个版本时保持相同：

- Playhead；
- 缩放；
- Preview 尺寸；
- 音量；
- 画幅。

否则视觉差异可能来自查看条件。
