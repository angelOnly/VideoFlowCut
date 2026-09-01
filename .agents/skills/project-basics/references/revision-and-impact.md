# Revision 与影响传播

## Revision 是统一版本

同一 Revision 应同时描述：

- Story；
- Scene；
- Timeline；
- Caption；
- Audio；
- Style；
- ActorPerformance 引用。

禁止 Story、Scene 和 Timeline 独立漂移。

## ImpactReport 应回答

- 什么被直接修改；
- 什么被自动重算；
- 什么跟随移动；
- 什么保持绝对位置；
- 什么锚点失效；
- 哪些区间需要重新预览；
- 哪些问题必须重新审片。

## DirtyRange

脏区间应合并：

- 旧对象范围；
- 新对象范围；
- 转场和音频尾巴；
- 前后安全余量。

## 结果未知

写请求超时但可能已经提交时：

1. 用幂等键查询；
2. 读取当前 Revision；
3. 查找目标对象；
4. 对账后再决定是否重试。

盲目重试可能产生重复 Item 或重复 Job。
