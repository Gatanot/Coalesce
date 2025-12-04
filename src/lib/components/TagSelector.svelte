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

    <div class="chip-group">
        {#each allTags as tag (tag.id)}
            <button
                type="button"
                class="chip chip-filter"
                class:selected={isSelected(tag.id)}
                onclick={() => onTagToggle(tag.id)}
            >
                {#if isSelected(tag.id)}
                    <span class="chip-checkmark">✓</span>
                {/if}
                {tag.name}
            </button>
        {/each}

        {#if isAdding}
            <form
                class="chip-form"
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <input
                    type="text"
                    class="chip-input"
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
                class="chip chip-add"
                onclick={() => (isAdding = true)}
            >
                <span class="chip-add-icon">+</span>
                新建标签
            </button>
        {/if}
    </div>
</div>

<style>
    .tag-selector {
        margin-bottom: var(--md-space-6);
    }

    .chip-filter {
        cursor: pointer;
        transition: all var(--md-motion-duration-short3)
            var(--md-motion-easing-standard);
    }

    .chip-filter:hover {
        background: var(--md-surface-container-highest);
    }

    .chip-filter.selected {
        background: var(--md-secondary-container);
        color: var(--md-on-secondary-container);
        border-color: transparent;
    }

    .chip-checkmark {
        font-size: 12px;
        margin-right: var(--md-space-1);
    }

    .chip-add {
        background: transparent;
        border: 1px dashed var(--md-outline);
        color: var(--md-on-surface-variant);
        cursor: pointer;
        gap: var(--md-space-1);
    }

    .chip-add:hover {
        border-color: var(--md-primary);
        color: var(--md-primary);
        background: rgba(103, 80, 164, 0.08);
    }

    .chip-add-icon {
        font-size: 16px;
        font-weight: 300;
    }

    .chip-form {
        display: flex;
        align-items: center;
        gap: var(--md-space-2);
    }

    .chip-input {
        padding: var(--md-space-2) var(--md-space-3);
        font-size: var(--md-body-small);
        background: var(--md-surface-container);
        border: 1px solid var(--md-outline);
        border-radius: var(--md-shape-xs);
        color: var(--md-on-surface);
        width: 120px;
    }

    .chip-input:focus {
        outline: none;
        border-color: var(--md-primary);
        border-width: 2px;
        padding: calc(var(--md-space-2) - 1px) calc(var(--md-space-3) - 1px);
    }
</style>
