# 跨平台提示词管理系统 - 项目需求与开发规格说明书

## 1. 项目概述
本项目旨在构建一个轻量级、跨平台的提示词（Prompt）管理系统。核心理念是将数据存储与管理托管于低配置云服务器,而将高算力的AI聚类与分析下放至本地高性能PC

- 技术栈: SvelteKit (全栈) + SQLite (数据存储) + TailwindCSS (UI)
- 部署环境: Ubuntu Server (2核 CPU / 2GB RAM / 40GB ESSD)
- 核心架构: 
    - 云端: 负责 CRUD、数据持久化、Web 界面展示、API 接口暴露
    - 本地 (Client): Python 脚本 + Ollama + GPU,负责数据拉取、向量计算、聚类分析、回填分类结果

## 2. 核心概念与数据模型

### 2.1 实体关系定义
1.  提示词 (Prompt): 核心管理单元
    - 包含手动维护的标签 (Tags)（硬分类）
    - 包含 AI 计算的聚类类别 (Cluster)（软分类）
2.  提示词块 (Block): 构成提示词的最小单元
    - 强绑定关系: 属于特定 Prompt,不跨 Prompt 复用
    - 有序性: 在 Prompt 内部有严格的顺序 (Index)
    - 原子性: 包含实际文本内容及该块的元信息（标题/描述/块标签）

### 2.2 数据库设计 (SQLite Schema)

建议开启 `WAL` 模式以支持更高并发：`PRAGMA journal_mode = WAL;`

```sql
-- 1. 提示词主表
CREATE TABLE prompts (
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
CREATE TABLE prompt_blocks (
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
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- 4. 提示词-标签关联表
CREATE TABLE prompt_tags (
    prompt_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (prompt_id, tag_id),
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

---

## 3. 功能需求说明

### 3.1 提示词管理 (CRUD)
- 创建/编辑: 
    - 支持填写 Prompt 标题与描述
    - 支持添加/删除/编辑 Block
    - 拖拽排序: 在编辑界面,支持对 Blocks 进行拖拽排序（前端库推荐 `svelte-dnd-action`）
    - 事务保证: 保存时,Prompt 信息及其下属所有 Blocks 应作为一个事务提交
- 查看视图 (双重视图):
    1.  手动视图: 按用户打的 `Tags` 过滤/分组展示
    2.  智能视图: 按 `cluster_group` 字段分组展示。未聚类项显示在“未分类”组

### 3.2 数据导入/导出
- 导出: 生成标准 JSON 文件,包含所有 Prompts、Blocks、Tags 和 Cluster 信息
- 导入: 
    - 策略: 全量覆盖 (Overwrite)
    - 安全机制: 导入操作触发前,服务器必须自动将当前 SQLite 数据库文件复制备份（如 `db.sqlite.bak.timestamp`）,防止误操作导致数据丢失

### 3.3 本地-云端协作 (AI 聚类流程)
此功能不消耗云端 CPU/内存,由本地 Python 脚本完成

1.  API 鉴权: 请求头需携带简单密钥 `X-API-Key: <ENV_SECRET>`
2.  API 协议:
    - `GET /api/sync/export-for-clustering`: 返回精简 JSON (ID, Title, Blocks Content 拼接文本)
    - `POST /api/sync/update-clusters`: 接收 JSON `[{ "id": "uuid", "cluster_group": "name" }, ...]` 并批量更新数据库
3.  本地脚本逻辑 (Python):
    - Step 1: 调用 GET 接口拉取数据
    - Step 2: 调用本地 Ollama (模型: `nomic-embed-text` 或 `qwen2.5`) 生成 Embedding 向量
    - Step 3: 使用 HDBSCAN 算法聚类 (不指定类别数 `min_cluster_size=2~5`)
    - Step 4: 对每个 Cluster 抽取样本,调用本地 LLM 生成 5 字以内的短名称
    - Step 5: 调用 POST 接口回传 ID 与类名的映射

---

## 4. 开发与部署约束

### 4.1 云服务器环境配置 (Ubuntu 22.04/24.04)
由于只有 2GB 内存,需严格控制内存占用：

- Node.js: 运行 SvelteKit SSR 服务
- Process Manager: 使用 `PM2` 或 `Systemd` 守护进程
    - *约束*: 设置 Node 进程 `max_memory_restart` 为 1.5G,防止 OOM 导致死机
- Database: SQLite 单文件,无需安装独立服务
    - *路径*: 建议放在 `/var/data/prompt-manager/db.sqlite` 并挂载持久化卷（如果使用 Docker）
- Web Server: Nginx 作为反向代理
    - 配置 Gzip 压缩以加快 JSON 数据传输
    - 配置 HTTPS (Let's Encrypt)

### 4.2 开发技术细节
- ORM: 推荐 Drizzle ORM (轻量、类型安全、SQL-like) 或 Better-SQLite3 (原生、极快)。不要使用 Prisma (内存占用过高)
- API 性能: 
    - 在 `/api/sync/export-for-clustering` 接口中,避免一次性加载所有 Blocks 对象。如果数据量大,使用 Stream Response 或分页。但考虑到个人用途（即使 10000 条 Prompt 纯文本也仅几 MB）,一次性返回 JSON 是可行的
- 安全性:
    - 虽然是个人项目,建议在 Web 界面增加简单的 HTTP Basic Auth 或硬编码的密码登录页（Session Based）,防止公网裸奔

## 5. 开发阶段规划

1.  Phase 1 - 基础架构 (Mvp)
    - 搭建 SvelteKit + SQLite 环境
    - 实现 Prompt 和 Block 的 增删改查 (CRUD)
    - 实现 Block 的拖拽排序
2.  Phase 2 - 数据流转
    - 实现手动 Tags 管理
    - 实现 JSON 导出与覆盖式导入（含自动备份）
3.  Phase 3 - 智能增强
    - 开发云端 Sync API
    - 开发本地 Python 脚本 (Embedding -> HDBSCAN -> LLM)
    - 联调测试：本地运行脚本,观察云端“智能视图”变化
