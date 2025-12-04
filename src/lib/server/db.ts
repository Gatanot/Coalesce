import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Database path - use environment variable or default
const DB_PATH = process.env.DATABASE_PATH || './data/prompt-manager.sqlite';

// Ensure data directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema inline
const schema = `
-- 1. 提示词主表
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cluster_group TEXT,
    cluster_keywords TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- 2. 提示词块表
CREATE TABLE IF NOT EXISTS prompt_blocks (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    content TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
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
`;
db.exec(schema);

// Types
export interface Prompt {
    id: string;
    title: string;
    description: string | null;
    cluster_group: string | null;
    cluster_keywords: string | null;
    created_at: number;
    updated_at: number;
}

export interface PromptBlock {
    id: string;
    prompt_id: string;
    type: string;
    content: string;
    sort_order: number;
    meta_json: string | null;
}

export interface Tag {
    id: number;
    name: string;
}

export interface PromptWithDetails extends Prompt {
    blocks: PromptBlock[];
    tags: Tag[];
}

// Prompt CRUD
export function getAllPrompts(): Prompt[] {
    return db.prepare('SELECT * FROM prompts ORDER BY updated_at DESC').all() as Prompt[];
}

export function getPromptById(id: string): PromptWithDetails | null {
    const prompt = db.prepare('SELECT * FROM prompts WHERE id = ?').get(id) as Prompt | undefined;
    if (!prompt) return null;

    const blocks = db.prepare(
        'SELECT * FROM prompt_blocks WHERE prompt_id = ? ORDER BY sort_order'
    ).all(id) as PromptBlock[];

    const tags = db.prepare(`
        SELECT t.* FROM tags t
        JOIN prompt_tags pt ON t.id = pt.tag_id
        WHERE pt.prompt_id = ?
    `).all(id) as Tag[];

    return { ...prompt, blocks, tags };
}

export function createPrompt(data: {
    title: string;
    description?: string;
    blocks?: { type?: string; content: string; meta_json?: string }[];
    tagIds?: number[];
}): string {
    const id = uuidv4();

    const transaction = db.transaction(() => {
        // Insert prompt
        db.prepare(`
            INSERT INTO prompts (id, title, description)
            VALUES (?, ?, ?)
        `).run(id, data.title, data.description || null);

        // Insert blocks
        if (data.blocks && data.blocks.length > 0) {
            const insertBlock = db.prepare(`
                INSERT INTO prompt_blocks (id, prompt_id, type, content, sort_order, meta_json)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            data.blocks.forEach((block, index) => {
                insertBlock.run(
                    uuidv4(),
                    id,
                    block.type || 'text',
                    block.content,
                    index,
                    block.meta_json || null
                );
            });
        }

        // Insert tag associations
        if (data.tagIds && data.tagIds.length > 0) {
            const insertTag = db.prepare('INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)');
            data.tagIds.forEach(tagId => insertTag.run(id, tagId));
        }
    });

    transaction();
    return id;
}

export function updatePrompt(
    id: string,
    data: {
        title?: string;
        description?: string;
        blocks?: { id?: string; type?: string; content: string; meta_json?: string }[];
        tagIds?: number[];
    }
): boolean {
    const existing = db.prepare('SELECT id FROM prompts WHERE id = ?').get(id);
    if (!existing) return false;

    const transaction = db.transaction(() => {
        // Update prompt
        if (data.title !== undefined || data.description !== undefined) {
            const updates: string[] = [];
            const values: (string | number)[] = [];

            if (data.title !== undefined) {
                updates.push('title = ?');
                values.push(data.title);
            }
            if (data.description !== undefined) {
                updates.push('description = ?');
                values.push(data.description);
            }
            updates.push('updated_at = unixepoch()');
            values.push(id);

            db.prepare(`UPDATE prompts SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }

        // Replace blocks
        if (data.blocks !== undefined) {
            db.prepare('DELETE FROM prompt_blocks WHERE prompt_id = ?').run(id);

            const insertBlock = db.prepare(`
                INSERT INTO prompt_blocks (id, prompt_id, type, content, sort_order, meta_json)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            data.blocks.forEach((block, index) => {
                insertBlock.run(
                    block.id || uuidv4(),
                    id,
                    block.type || 'text',
                    block.content,
                    index,
                    block.meta_json || null
                );
            });
        }

        // Replace tags
        if (data.tagIds !== undefined) {
            db.prepare('DELETE FROM prompt_tags WHERE prompt_id = ?').run(id);
            const insertTag = db.prepare('INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)');
            data.tagIds.forEach(tagId => insertTag.run(id, tagId));
        }
    });

    transaction();
    return true;
}

export function deletePrompt(id: string): boolean {
    const result = db.prepare('DELETE FROM prompts WHERE id = ?').run(id);
    return result.changes > 0;
}

// Tag CRUD
export function getAllTags(): Tag[] {
    return db.prepare('SELECT * FROM tags ORDER BY name').all() as Tag[];
}

export function createTag(name: string): number {
    const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(name);
    return result.lastInsertRowid as number;
}

export function deleteTag(id: number): boolean {
    const result = db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    return result.changes > 0;
}

// Export/Import
export function exportAll(): {
    prompts: PromptWithDetails[];
    tags: Tag[];
} {
    const prompts = getAllPrompts().map(p => getPromptById(p.id)!);
    const tags = getAllTags();
    return { prompts, tags };
}

export function importAll(data: {
    prompts: PromptWithDetails[];
    tags: Tag[];
}): void {
    const transaction = db.transaction(() => {
        // Clear all existing data
        db.prepare('DELETE FROM prompt_tags').run();
        db.prepare('DELETE FROM prompt_blocks').run();
        db.prepare('DELETE FROM prompts').run();
        db.prepare('DELETE FROM tags').run();

        // Import tags
        const insertTag = db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)');
        data.tags.forEach(tag => insertTag.run(tag.id, tag.name));

        // Import prompts with blocks and tags
        const insertPrompt = db.prepare(`
            INSERT INTO prompts (id, title, description, cluster_group, cluster_keywords, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const insertBlock = db.prepare(`
            INSERT INTO prompt_blocks (id, prompt_id, type, content, sort_order, meta_json)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const insertPromptTag = db.prepare('INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)');

        data.prompts.forEach(prompt => {
            insertPrompt.run(
                prompt.id,
                prompt.title,
                prompt.description,
                prompt.cluster_group,
                prompt.cluster_keywords,
                prompt.created_at,
                prompt.updated_at
            );

            prompt.blocks.forEach(block => {
                insertBlock.run(
                    block.id,
                    block.prompt_id,
                    block.type,
                    block.content,
                    block.sort_order,
                    block.meta_json
                );
            });

            prompt.tags.forEach(tag => {
                insertPromptTag.run(prompt.id, tag.id);
            });
        });
    });

    transaction();
}

// Backup database
export function backupDatabase(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${DB_PATH}.bak.${timestamp}`;
    fs.copyFileSync(DB_PATH, backupPath);
    return backupPath;
}

// Clustering API helpers
export function getPromptsForClustering(): { id: string; title: string; content: string }[] {
    const prompts = getAllPrompts();
    return prompts.map(p => {
        const blocks = db.prepare(
            'SELECT content FROM prompt_blocks WHERE prompt_id = ? ORDER BY sort_order'
        ).all(p.id) as { content: string }[];

        return {
            id: p.id,
            title: p.title,
            content: blocks.map(b => b.content).join('\n\n')
        };
    });
}

export function updateClusters(updates: { id: string; cluster_group: string; cluster_keywords?: string }[]): void {
    const updateStmt = db.prepare(`
        UPDATE prompts 
        SET cluster_group = ?, cluster_keywords = ?, updated_at = unixepoch()
        WHERE id = ?
    `);

    const transaction = db.transaction(() => {
        updates.forEach(u => {
            updateStmt.run(u.cluster_group, u.cluster_keywords || null, u.id);
        });
    });

    transaction();
}

// Group prompts by cluster
export function getPromptsByCluster(): Map<string, Prompt[]> {
    const prompts = getAllPrompts();
    const groups = new Map<string, Prompt[]>();

    prompts.forEach(p => {
        const key = p.cluster_group || '未分类';
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(p);
    });

    return groups;
}

// Group prompts by tag
export function getPromptsByTag(): Map<string, Prompt[]> {
    const result = db.prepare(`
        SELECT p.*, t.name as tag_name
        FROM prompts p
        LEFT JOIN prompt_tags pt ON p.id = pt.prompt_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        ORDER BY t.name, p.updated_at DESC
    `).all() as (Prompt & { tag_name: string | null })[];

    const groups = new Map<string, Prompt[]>();

    result.forEach(row => {
        const key = row.tag_name || '未标记';
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        // Avoid duplicates
        const existing = groups.get(key)!;
        if (!existing.find(p => p.id === row.id)) {
            existing.push(row);
        }
    });

    return groups;
}

export default db;
