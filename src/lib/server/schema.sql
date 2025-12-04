-- Prompt Manager Database Schema
-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- 1. 提示词主表
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,            -- UUID v4
    title TEXT NOT NULL,            -- 提示词标题
    description TEXT,               -- 提示词备注
    
    -- AI 聚类域 (由本地脚本计算后回填)
    cluster_group TEXT,             -- 聚类名称 (如 "代码-Python")
    cluster_keywords TEXT,          -- 聚类关键词 (逗号分隔)
    
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- 2. 提示词块表 (强绑定,级联删除)
CREATE TABLE IF NOT EXISTS prompt_blocks (
    id TEXT PRIMARY KEY,            -- UUID v4
    prompt_id TEXT NOT NULL,
    type TEXT DEFAULT 'text',       -- 预留字段 (text/code)
    content TEXT NOT NULL,          -- 核心内容 (用户输入的 Prompt 片段)
    sort_order INTEGER NOT NULL,    -- 排序索引 (0, 1, 2...)
    
    -- 元数据存储 (JSON 字符串)
    -- 结构: { "title": "...", "description": "...", "tags": ["..."] }
    meta_json TEXT,                 
    
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

-- 3. 手动标签表
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- 4. 提示词-标签关联表
CREATE TABLE IF NOT EXISTS prompt_tags (
    prompt_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (prompt_id, tag_id),
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_prompt_blocks_prompt_id ON prompt_blocks(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON prompt_tags(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompts_cluster_group ON prompts(cluster_group);
