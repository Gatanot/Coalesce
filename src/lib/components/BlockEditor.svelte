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
        <button type="button" class="btn btn-sm btn-tonal" onclick={addBlock}>
            + 添加块
        </button>
    </div>

    {#if blocks.length === 0}
        <div class="block-empty">
            <div class="block-empty-icon">+</div>
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
                            <div class="block-type-chips">
                                <button
                                    type="button"
                                    class="block-type-chip"
                                    class:active={block.type === "text"}
                                    onclick={() =>
                                        updateBlockType(block.id, "text")}
                                >
                                    文本
                                </button>
                                <button
                                    type="button"
                                    class="block-type-chip"
                                    class:active={block.type === "code"}
                                    onclick={() =>
                                        updateBlockType(block.id, "code")}
                                >
                                    代码
                                </button>
                            </div>
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
                            class="btn btn-ghost btn-icon btn-sm"
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
        margin-bottom: var(--md-space-6);
    }

    .block-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--md-space-4);
    }

    .block-header .label {
        margin-bottom: 0;
    }

    .block-empty {
        padding: var(--md-space-12) var(--md-space-8);
        text-align: center;
        border: 2px dashed var(--md-outline-variant);
        border-radius: var(--md-shape-lg);
        color: var(--md-on-surface-variant);
    }

    .block-empty-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto var(--md-space-3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        border: 2px dashed var(--md-outline);
        border-radius: var(--md-shape-md);
        color: var(--md-outline);
    }

    .block-empty p {
        margin: 0;
        font-size: var(--md-body-medium);
    }

    .block-list {
        display: flex;
        flex-direction: column;
        gap: var(--md-space-3);
    }

    .block-toolbar {
        margin-bottom: var(--md-space-3);
    }

    .block-type-chips {
        display: inline-flex;
        background: var(--md-surface-container);
        border: 1px solid var(--md-outline-variant);
        border-radius: var(--md-shape-full);
        padding: 2px;
        gap: 2px;
    }

    .block-type-chip {
        padding: var(--md-space-1) var(--md-space-3);
        font-size: var(--md-label-medium);
        font-weight: 500;
        background: transparent;
        border: none;
        border-radius: var(--md-shape-full);
        color: var(--md-on-surface-variant);
        cursor: pointer;
        transition: all var(--md-motion-duration-short3);
    }

    .block-type-chip:hover {
        background: rgba(var(--md-on-surface), 0.08);
    }

    .block-type-chip.active {
        background: var(--md-secondary-container);
        color: var(--md-on-secondary-container);
    }

    .block-textarea {
        min-height: 100px;
    }

    .block-textarea.code-block {
        font-family: var(--md-font-mono);
        font-size: var(--md-body-medium);
    }

    .drag-handle {
        cursor: grab;
        user-select: none;
        color: var(--md-on-surface-variant);
        font-size: 18px;
        letter-spacing: -3px;
        opacity: 0.5;
        transition: opacity var(--md-motion-duration-short3);
        padding: var(--md-space-1);
    }

    .drag-handle:hover {
        opacity: 1;
    }

    .drag-handle:active {
        cursor: grabbing;
    }

    .delete-icon {
        font-size: 20px;
        font-weight: 300;
        line-height: 1;
    }
</style>
