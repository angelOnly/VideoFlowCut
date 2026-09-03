import type { DatabaseSync } from "node:sqlite";

export type PersistenceColumn = {
  /** 数据库中真实使用的字段名。 */
  name: string;
  /** SQLite 中的字段类型；此处只允许项目当前使用的 TEXT 或 INTEGER。 */
  sqlType: "TEXT" | "INTEGER";
  /** true 表示该字段可以不写值；省略或 false 表示必须有值。 */
  nullable?: boolean;
  /** PRIMARY KEY、NOT NULL 等会落实到 DDL 的字段约束。 */
  constraints?: string[];
  /** 给维护者阅读的字段业务含义。 */
  description: string;
};

export type PersistenceRelation = {
  /** 当前表中承担关联职责的字段名。 */
  column: string;
  /** 关联目标的表和字段，用于阅读和应用层验证。 */
  target: string;
  /** foreign_key 为 SQLite 强制约束；application 为仓储代码验证。 */
  enforcement: "foreign_key" | "application";
  /** 为什么需要此关联，以及由谁保证它成立。 */
  description: string;
};

export type PersistenceIndex = {
  /** 索引或约束在 SQLite 中的名称。 */
  name: string;
  /** 索引覆盖的字段，顺序与 DDL 一致。 */
  columns: string[];
  /** 主键、唯一约束或普通查询索引。 */
  kind: "primary_key" | "unique" | "index";
  /** 该索引解决的唯一性或查询需求。 */
  description: string;
};

export type PersistenceTable = {
  /** SQLite 表名。 */
  name: string;
  /** 该表保留什么业务数据。 */
  description: string;
  /** 可读字段目录；测试会与下方真实 DDL 比对。 */
  columns: PersistenceColumn[];
  /** 跨表关系目录；其中部分由应用层而非 SQLite 本身保证。 */
  relations: PersistenceRelation[];
  /** 主键、唯一约束与普通索引目录。 */
  indexes: PersistenceIndex[];
};

/**
 * 项目 SQLite 的可读总览。
 *
 * 这里列出当前仅有的四张表、字段、实际数据库约束和应用层补充关系；
 * 下方 SQL 是唯一会被执行的建表来源，不能在其他位置复制 DDL。
 */
export const PROJECT_DATABASE_TABLES: PersistenceTable[] = [
  // 项目表：只保存项目当前状态的快速入口，完整历史放在 revisions 表。
  {
    name: "projects",
    description: "项目当前指针与项目级摘要。",
    columns: [
      { name: "id", sqlType: "TEXT", constraints: ["PRIMARY KEY"], description: "项目 ID。" },
      { name: "name", sqlType: "TEXT", constraints: ["NOT NULL"], description: "当前项目名称。" },
      { name: "profile", sqlType: "TEXT", constraints: ["NOT NULL"], description: "当前视频类型 Profile。" },
      { name: "root_path", sqlType: "TEXT", constraints: ["NOT NULL"], description: "项目受管目录绝对路径。" },
      { name: "current_revision_id", sqlType: "TEXT", constraints: ["NOT NULL"], description: "当前 Revision ID。" },
      { name: "current_revision_number", sqlType: "INTEGER", constraints: ["NOT NULL"], description: "当前 Revision 编号。" },
      { name: "created_at", sqlType: "TEXT", constraints: ["NOT NULL"], description: "创建时间（ISO 字符串）。" },
      { name: "updated_at", sqlType: "TEXT", constraints: ["NOT NULL"], description: "最近更新时间（ISO 字符串）。" }
    ],
    relations: [
      {
        column: "current_revision_id",
        target: "revisions.id",
        enforcement: "application",
        description: "当前 Revision 在创建与提交事务中写入；SQLite 不设置循环外键。"
      }
    ],
    indexes: [{ name: "projects_pkey", columns: ["id"], kind: "primary_key", description: "项目主键。" }]
  },
  // Revision 表：每次提交保存一份不可变快照，支持追溯、比较和回滚。
  {
    name: "revisions",
    description: "不可变项目快照与影响报告历史。",
    columns: [
      { name: "id", sqlType: "TEXT", constraints: ["PRIMARY KEY"], description: "Revision ID。" },
      { name: "project_id", sqlType: "TEXT", constraints: ["NOT NULL"], description: "所属项目 ID。" },
      { name: "revision_number", sqlType: "INTEGER", constraints: ["NOT NULL"], description: "项目内连续 Revision 编号。" },
      { name: "parent_id", sqlType: "TEXT", nullable: true, description: "父 Revision ID；首个 Revision 为空。" },
      { name: "summary", sqlType: "TEXT", constraints: ["NOT NULL"], description: "本次变更摘要。" },
      { name: "snapshot_json", sqlType: "TEXT", constraints: ["NOT NULL"], description: "完整 ProjectSnapshot JSON。" },
      { name: "impact_json", sqlType: "TEXT", constraints: ["NOT NULL"], description: "ImpactReport JSON。" },
      { name: "created_at", sqlType: "TEXT", constraints: ["NOT NULL"], description: "创建时间（ISO 字符串）。" }
    ],
    relations: [
      { column: "project_id", target: "projects.id", enforcement: "foreign_key", description: "SQLite 外键，删除项目时受约束保护。" },
      { column: "parent_id", target: "revisions.id", enforcement: "application", description: "历史链由提交逻辑生成；现有表结构未设置自引用外键。" }
    ],
    indexes: [
      { name: "revisions_pkey", columns: ["id"], kind: "primary_key", description: "Revision 主键。" },
      { name: "revisions_project_revision_unique", columns: ["project_id", "revision_number"], kind: "unique", description: "同一项目内 Revision 编号唯一。" }
    ]
  },
  // 任务表：保存异步任务输入、状态、租约和结果，避免重复提交。
  {
    name: "jobs",
    description: "异步任务、租约、结果与幂等键。",
    columns: [
      { name: "id", sqlType: "TEXT", constraints: ["PRIMARY KEY"], description: "任务 ID。" },
      { name: "project_id", sqlType: "TEXT", constraints: ["NOT NULL"], description: "所属项目 ID。" },
      { name: "kind", sqlType: "TEXT", constraints: ["NOT NULL"], description: "任务种类。" },
      { name: "status", sqlType: "TEXT", constraints: ["NOT NULL"], description: "queued/running/completed/failed 等任务状态。" },
      { name: "payload_json", sqlType: "TEXT", constraints: ["NOT NULL"], description: "提交时固化的任务输入 JSON。" },
      { name: "result_json", sqlType: "TEXT", nullable: true, description: "任务结果 JSON。" },
      { name: "error", sqlType: "TEXT", nullable: true, description: "失败信息。" },
      { name: "idempotency_key", sqlType: "TEXT", constraints: ["NOT NULL"], description: "项目内幂等键。" },
      { name: "attempt", sqlType: "INTEGER", constraints: ["NOT NULL"], description: "已领取次数。" },
      { name: "lease_until", sqlType: "TEXT", nullable: true, description: "Worker 租约到期时间。" },
      { name: "created_at", sqlType: "TEXT", constraints: ["NOT NULL"], description: "创建时间（ISO 字符串）。" },
      { name: "updated_at", sqlType: "TEXT", constraints: ["NOT NULL"], description: "最近更新时间（ISO 字符串）。" }
    ],
    relations: [{ column: "project_id", target: "projects.id", enforcement: "foreign_key", description: "SQLite 外键。" }],
    indexes: [
      { name: "jobs_pkey", columns: ["id"], kind: "primary_key", description: "任务主键。" },
      { name: "jobs_project_idempotency_unique", columns: ["project_id", "idempotency_key"], kind: "unique", description: "同项目相同请求只创建一个任务。" }
    ]
  },
  // 导出产物表：把已生成的文件与它对应的项目、Revision、导出任务绑定。
  {
    name: "export_artifacts",
    description: "已生成的导出文件及其审核状态；不属于可变 Revision 快照。",
    columns: [
      { name: "id", sqlType: "TEXT", constraints: ["PRIMARY KEY"], description: "导出产物 ID。" },
      { name: "project_id", sqlType: "TEXT", constraints: ["NOT NULL"], description: "所属项目 ID。" },
      { name: "revision_number", sqlType: "INTEGER", constraints: ["NOT NULL"], description: "导出对应的不可变 Revision 编号。" },
      { name: "job_id", sqlType: "TEXT", constraints: ["NOT NULL"], description: "生成此文件的 Export Job ID。" },
      { name: "artifact_json", sqlType: "TEXT", constraints: ["NOT NULL"], description: "ExportArtifact 完整 JSON。" },
      { name: "created_at", sqlType: "TEXT", constraints: ["NOT NULL"], description: "创建时间（ISO 字符串）。" }
    ],
    relations: [
      { column: "project_id", target: "projects.id", enforcement: "foreign_key", description: "SQLite 外键。" },
      { column: "revision_number", target: "revisions.(project_id, revision_number)", enforcement: "application", description: "仓储写入前读取 Revision 验证；旧表结构没有复合外键。" },
      { column: "job_id", target: "jobs.id", enforcement: "application", description: "仓储写入前验证同项目 Export Job 与用途。" }
    ],
    indexes: [
      { name: "export_artifacts_pkey", columns: ["id"], kind: "primary_key", description: "导出产物主键。" },
      { name: "export_artifacts_project_job_unique", columns: ["project_id", "job_id"], kind: "unique", description: "一个导出任务最多登记一个产物。" },
      { name: "export_artifacts_project_created_idx", columns: ["project_id", "created_at DESC"], kind: "index", description: "按项目倒序读取导出历史。" }
    ]
  }
];

/** SQLite 连接层参数；调用方无需在仓储外重复设置。 */
export const PROJECT_DATABASE_PRAGMAS_SQL = `
  PRAGMA journal_mode = WAL; -- 使用 WAL，降低读写并发时互相阻塞的概率。
  PRAGMA foreign_keys = ON; -- 启用 revisions、jobs、export_artifacts 的真实项目外键。
  PRAGMA busy_timeout = 5000; -- 数据库忙时最多等待 5 秒，而不是立即失败。
`;

/**
 * 唯一真实建表 SQL 来源。表字段或索引有变更时，只修改本文件并同步上方可读总览。
 */
export const PROJECT_DATABASE_SCHEMA_SQL = `
  -- projects：每个项目一行，记录当前 Revision 指针和项目级摘要。
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, -- 项目唯一 ID。
    name TEXT NOT NULL, -- 当前项目名称。
    profile TEXT NOT NULL, -- 当前视频类型 Profile。
    root_path TEXT NOT NULL, -- 项目受管目录的绝对路径。
    current_revision_id TEXT NOT NULL, -- 当前生效 Revision 的 ID。
    current_revision_number INTEGER NOT NULL, -- 当前生效 Revision 的连续编号。
    created_at TEXT NOT NULL, -- 项目创建时间，ISO 字符串。
    updated_at TEXT NOT NULL -- 项目最近更新时间，ISO 字符串。
  );
  -- revisions：每次修改后保存的不可变项目快照和影响报告。
  CREATE TABLE IF NOT EXISTS revisions (
    id TEXT PRIMARY KEY, -- Revision 唯一 ID。
    project_id TEXT NOT NULL, -- 所属项目 ID；SQLite 外键指向 projects.id。
    revision_number INTEGER NOT NULL, -- 项目内递增且唯一的 Revision 编号。
    parent_id TEXT, -- 父 Revision ID；首个 Revision 为空。
    summary TEXT NOT NULL, -- 本次变更的可读摘要。
    snapshot_json TEXT NOT NULL, -- 完整 ProjectSnapshot 的 JSON 快照。
    impact_json TEXT NOT NULL, -- 本次变更影响范围的 ImpactReport JSON。
    created_at TEXT NOT NULL, -- 创建时间，ISO 字符串。
    UNIQUE(project_id, revision_number), -- 同一项目内不允许重复 Revision 编号。
    FOREIGN KEY(project_id) REFERENCES projects(id) -- 所属项目必须真实存在。
  );
  -- jobs：可恢复的异步任务，使用项目内幂等键避免重复创建。
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY, -- 异步任务唯一 ID。
    project_id TEXT NOT NULL, -- 所属项目 ID；SQLite 外键指向 projects.id。
    kind TEXT NOT NULL, -- 任务种类，例如转写、生成或导出。
    status TEXT NOT NULL, -- queued、running、completed、failed 等状态。
    payload_json TEXT NOT NULL, -- 提交时冻结的任务输入 JSON。
    result_json TEXT, -- 成功任务的结果 JSON；尚未完成时为空。
    error TEXT, -- 失败原因；成功或未失败时为空。
    idempotency_key TEXT NOT NULL, -- 同项目内识别重复请求的键。
    attempt INTEGER NOT NULL, -- 已被 Worker 领取的次数。
    lease_until TEXT, -- 当前 Worker 租约的到期时间；未领取时为空。
    created_at TEXT NOT NULL, -- 创建时间，ISO 字符串。
    updated_at TEXT NOT NULL, -- 最近状态更新时间，ISO 字符串。
    UNIQUE(project_id, idempotency_key), -- 相同请求在同一项目内最多创建一次任务。
    FOREIGN KEY(project_id) REFERENCES projects(id) -- 所属项目必须真实存在。
  );
  -- export_artifacts：已经生成的最终文件，独立于仍可继续修改的 Revision 快照。
  CREATE TABLE IF NOT EXISTS export_artifacts (
    id TEXT PRIMARY KEY, -- 导出产物唯一 ID。
    project_id TEXT NOT NULL, -- 所属项目 ID；SQLite 外键指向 projects.id。
    revision_number INTEGER NOT NULL, -- 此文件对应的不可变 Revision 编号。
    job_id TEXT NOT NULL, -- 生成此文件的 Export Job ID。
    artifact_json TEXT NOT NULL, -- 完整 ExportArtifact 的 JSON 记录。
    created_at TEXT NOT NULL, -- 产物登记时间，ISO 字符串。
    UNIQUE(project_id, job_id), -- 一个导出任务只能登记一个最终文件。
    FOREIGN KEY(project_id) REFERENCES projects(id) -- 所属项目必须真实存在。
  );
  -- 按项目和创建时间倒序查询导出历史时使用的普通索引。
  CREATE INDEX IF NOT EXISTS export_artifacts_project_created_idx
    ON export_artifacts(project_id, created_at DESC); -- 先按项目筛选，再按最新导出排序。
`;

/** 所有 SQLite 初始化只能从这个函数进入，避免 DDL 分散到业务代码。 */
export function initializeProjectDatabase(database: Pick<DatabaseSync, "exec">): void {
  database.exec(PROJECT_DATABASE_PRAGMAS_SQL);
  database.exec(PROJECT_DATABASE_SCHEMA_SQL);
}
