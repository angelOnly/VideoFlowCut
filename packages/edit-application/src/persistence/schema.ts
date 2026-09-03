import type { DatabaseSync } from "node:sqlite";

export type PersistenceColumn = {
  name: string;
  sqlType: "TEXT" | "INTEGER";
  nullable?: boolean;
  constraints?: string[];
  description: string;
};

export type PersistenceRelation = {
  column: string;
  target: string;
  enforcement: "foreign_key" | "application";
  description: string;
};

export type PersistenceIndex = {
  name: string;
  columns: string[];
  kind: "primary_key" | "unique" | "index";
  description: string;
};

export type PersistenceTable = {
  name: string;
  description: string;
  columns: PersistenceColumn[];
  relations: PersistenceRelation[];
  indexes: PersistenceIndex[];
};

/**
 * 项目 SQLite 的可读总览。
 *
 * 这里列出当前仅有的四张表、字段、实际数据库约束和应用层补充关系；
 * 下方 SQL 是唯一会被执行的建表来源，不能在其他位置复制 DDL。
 */
export const PROJECT_DATABASE_TABLES: PersistenceTable[] = [
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
export const PROJECT_DATABASE_PRAGMAS_SQL = "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;";

/**
 * 唯一真实建表 SQL 来源。表字段或索引有变更时，只修改本文件并同步上方可读总览。
 */
export const PROJECT_DATABASE_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    profile TEXT NOT NULL,
    root_path TEXT NOT NULL,
    current_revision_id TEXT NOT NULL,
    current_revision_number INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS revisions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    revision_number INTEGER NOT NULL,
    parent_id TEXT,
    summary TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    impact_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(project_id, revision_number),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    status TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    result_json TEXT,
    error TEXT,
    idempotency_key TEXT NOT NULL,
    attempt INTEGER NOT NULL,
    lease_until TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(project_id, idempotency_key),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );
  CREATE TABLE IF NOT EXISTS export_artifacts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    revision_number INTEGER NOT NULL,
    job_id TEXT NOT NULL,
    artifact_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(project_id, job_id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );
  CREATE INDEX IF NOT EXISTS export_artifacts_project_created_idx
    ON export_artifacts(project_id, created_at DESC);
`;

/** 所有 SQLite 初始化只能从这个函数进入，避免 DDL 分散到业务代码。 */
export function initializeProjectDatabase(database: Pick<DatabaseSync, "exec">): void {
  database.exec(PROJECT_DATABASE_PRAGMAS_SQL);
  database.exec(PROJECT_DATABASE_SCHEMA_SQL);
}
