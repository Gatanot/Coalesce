<script lang="ts">
    import { dndzone } from "svelte-dnd-action";

    interface BlockItem {
        id: string;
        type: "text" | "code";
        content: string;
        meta_json: string | null;
    }

    interface Props {
        blocks: BlockItem[];
        onBlocksChange: (blocks: BlockItem[]) => void;
    }

    let { blocks, onBlocksChange }: Props = $props();

    const flipDurationMs = 200;

    function handleDndConsider(e: CustomEvent<{ items: BlockItem[] }>) {
        onBlocksChange(e.detail.items);
    }

    function handleDndFinalize(e: CustomEvent<{ items: BlockItem[] }>) {
        onBlocksChange(e.detail.items);
    }

    function addBlock() {
        const newBlock: BlockItem = {
            id: crypto.randomUUID(),
            type: "text",
            content: "",
            meta_json: null,
        };
        onBlocksChange([...blocks, newBlock]);
    }

    function removeBlock(id: string) {
        onBlocksChange(blocks.filter((b) => b.id !== id));
    }

    function updateBlockContent(id: string, content: string) {
        onBlocksChange(
            blocks.map((b) => (b.id === id ? { ...b, content } : b)),
        );
    }

    function updateBlockType(id: string, type: "text" | "code") {
        onBlocksChange(blocks.map((b) => (b.id === id ? { ...b, type } : b)));
    }
</script>

<div class="block-editor">
    <div class="block-header">
        <label class="label">内容块</label>
        <button
            type="button"
            class="btn btn-sm btn-secondary"
            onclick={addBlock}
        >
            + 添加块
        </button>
    </div>

    {#if blocks.length === 0}
        <div class="block-empty">
            <p>点击上方按钮添加第一个内容块</p>
        </div>
    {:else}
        <div
            class="block-list"
            use:dndzone={{ items: blocks, flipDurationMs, dropTargetStyle: {} }}
            onconsider={handleDndConsider}
            onfinalize={handleDndFinalize}
        >
            {#each blocks as block (block.id)}
                <div class="block-item">
                    <div class="drag-handle" title="拖拽排序">⋮⋮</div>
                    <div class="block-content">
                        <div class="block-toolbar">
                            <select
                                class="block-type-select"
                                value={block.type}
                                onchange={(e) =>
                                    updateBlockType(
                                        block.id,
                                        (e.target as HTMLSelectElement)
                                            .value as "text" | "code",
                                    )}
                            >
                                <option value="text">文本</option>
                                <option value="code">代码</option>
                            </select>
                        </div>
                        <textarea
                            class="textarea block-textarea"
                            class:code-block={block.type === "code"}
                            placeholder={block.type === "code"
                                ? "输入代码..."
                                : "输入内容..."}
                            value={block.content}
                            oninput={(e) =>
                                updateBlockContent(
                                    block.id,
                                    (e.target as HTMLTextAreaElement).value,
                                )}
                        ></textarea>
                    </div>
                    <div class="block-actions">
                        <button
                            type="button"
                            class="btn btn-ghost btn-icon"
                            onclick={() => removeBlock(block.id)}
                            title="删除"
                        >
                            <span class="delete-icon">×</span>
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .block-editor {
        margin-bottom: var(--space-4);
    }

    .block-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-3);
    }

    .block-header .label {
        margin-bottom: 0;
    }

    .block-empty {
        padding: var(--space-8);
        text-align: center;
        border: 2px dashed var(--color-border);
        border-radius: var(--radius-lg);
        color: var(--color-text-muted);
    }

    .block-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .block-toolbar {
        margin-bottom: var(--space-2);
    }

    .block-type-select {
        padding: var(--space-1) var(--space-2);
        font-size: var(--text-xs);
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        color: var(--color-text-primary);
        cursor: pointer;
    }

    .block-textarea {
        min-height: 100px;
    }

    .block-textarea.code-block {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
    }

    .drag-handle {
        cursor: grab;
        user-select: none;
        color: var(--color-text-muted);
        font-size: var(--text-lg);
        letter-spacing: -2px;
    }

    .drag-handle:active {
        cursor: grabbing;
    }

    .delete-icon {
        font-size: var(--text-xl);
        font-weight: 300;
        line-height: 1;
    }
</style>
