<script lang="ts">
    import type { Tag } from "$lib/types";

    interface Props {
        allTags: Tag[];
        selectedTagIds: number[];
        onTagToggle: (tagId: number) => void;
        onCreateTag: (name: string) => void;
    }

    let { allTags, selectedTagIds, onTagToggle, onCreateTag }: Props = $props();
    let newTagName = $state("");
    let isAdding = $state(false);

    function handleSubmit() {
        if (newTagName.trim()) {
            onCreateTag(newTagName.trim());
            newTagName = "";
            isAdding = false;
        }
    }

    function isSelected(tagId: number): boolean {
        return selectedTagIds.includes(tagId);
    }
</script>

<div class="tag-selector">
    <label class="label">标签</label>

    <div class="tag-group">
        {#each allTags as tag (tag.id)}
            <button
                type="button"
                class="tag tag-selectable"
                class:selected={isSelected(tag.id)}
                onclick={() => onTagToggle(tag.id)}
            >
                {tag.name}
            </button>
        {/each}

        {#if isAdding}
            <form
                class="tag-form"
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <input
                    type="text"
                    class="tag-input"
                    placeholder="标签名称"
                    bind:value={newTagName}
                    autofocus
                />
                <button type="submit" class="btn btn-sm btn-primary"
                    >添加</button
                >
                <button
                    type="button"
                    class="btn btn-sm btn-ghost"
                    onclick={() => {
                        isAdding = false;
                        newTagName = "";
                    }}>取消</button
                >
            </form>
        {:else}
            <button
                type="button"
                class="tag tag-add"
                onclick={() => (isAdding = true)}
            >
                + 新建标签
            </button>
        {/if}
    </div>
</div>

<style>
    .tag-selector {
        margin-bottom: var(--space-4);
    }

    .tag-selectable {
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .tag-selectable:hover {
        background: rgba(99, 102, 241, 0.25);
    }

    .tag-selectable.selected {
        background: var(--color-accent);
        color: white;
    }

    .tag-add {
        background: var(--color-bg-tertiary);
        color: var(--color-text-muted);
        border: 1px dashed var(--color-border);
        cursor: pointer;
    }

    .tag-add:hover {
        border-color: var(--color-accent);
        color: var(--color-accent);
    }

    .tag-form {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    .tag-input {
        padding: var(--space-1) var(--space-2);
        font-size: var(--text-xs);
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        color: var(--color-text-primary);
        width: 100px;
    }

    .tag-input:focus {
        outline: none;
        border-color: var(--color-accent);
    }
</style>
