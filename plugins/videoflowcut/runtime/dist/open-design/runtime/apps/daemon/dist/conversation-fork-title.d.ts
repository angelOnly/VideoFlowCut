/**
 * 源会话标题 + 这个项目里已有的全部标题 → 新会话该叫什么。源会话没有标题就返回
 * `null`(无名会话的新会话照旧无名,不硬造一个)。
 *
 * 空档不回填:已有 (1) 和 (3) 时下一个是 (4),不是 (2)。回填会让刚被删掉的那个名字
 * 原地复活,在侧栏里看起来像「删除没生效」;取 max+1 之后编号单调递增,永远指向
 * 「这是第几次从这条会话开新的」。
 */
export declare function nextForkedConversationTitle(sourceTitle: string | null | undefined, existingTitles: Iterable<string | null | undefined>): string | null;
