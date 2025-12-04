// Prompt Manager - TypeScript Type Definitions

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
    type: 'text' | 'code';
    content: string;
    sort_order: number;
    meta_json: string | null;
}

export interface BlockMeta {
    title?: string;
    description?: string;
    tags?: string[];
}

export interface Tag {
    id: number;
    name: string;
}

export interface PromptWithDetails extends Prompt {
    blocks: PromptBlock[];
    tags: Tag[];
}

// API Request Types
export interface CreatePromptRequest {
    title: string;
    description?: string;
    blocks?: {
        type?: 'text' | 'code';
        content: string;
        meta_json?: string;
    }[];
    tagIds?: number[];
}

export interface UpdatePromptRequest {
    title?: string;
    description?: string;
    blocks?: {
        id?: string;
        type?: 'text' | 'code';
        content: string;
        meta_json?: string;
    }[];
    tagIds?: number[];
}

export interface ClusterUpdateItem {
    id: string;
    cluster_group: string;
    cluster_keywords?: string;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ExportData {
    prompts: PromptWithDetails[];
    tags: Tag[];
    exportedAt: string;
    version: string;
}

export interface ClusteringExportItem {
    id: string;
    title: string;
    content: string;
}

// View Types
export type ViewMode = 'tags' | 'clusters';

export interface GroupedPrompts {
    [key: string]: Prompt[];
}
