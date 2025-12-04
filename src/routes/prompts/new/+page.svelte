<script lang="ts">
    import { goto } from "$app/navigation";
    import BlockEditor from "$lib/components/BlockEditor.svelte";
    import TagSelector from "$lib/components/TagSelector.svelte";
    import type { Tag } from "$lib/types";

    interface BlockItem {
        id: string;
        type: "text" | "code";
        content: string;
        meta_json: string | null;
    }

    let title = $state("");
    let description = $state("");
    let blocks = $state<BlockItem[]>([
        {
            id: crypto.randomUUID(),
            type: "text",
            content: "",
            meta_json: null,
        },
    ]);
    let selectedTagIds = $state<number[]>([]);
    let allTags = $state<Tag[]>([]);
    let saving = $state(false);
    let error = $state<string | null>(null);

    async function loadTags() {
        try {
            const res = await fetch("/api/tags");
            const data = await res.json();
            if (data.success) {
                allTags = data.data;
            }
        } catch (e) {
            console.error("Failed to load tags:", e);
        }
    }

    function handleTagToggle(tagId: number) {
        if (selectedTagIds.includes(tagId)) {
            selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
        } else {
            selectedTagIds = [...selectedTagIds, tagId];
        }
    }

    async function handleCreateTag(name: string) {
        try {
            const res = await fetch("/api/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (data.success) {
                await loadTags();
                selectedTagIds = [...selectedTagIds, data.data.id];
            }
        } catch (e) {
            console.error("Failed to create tag:", e);
        }
    }

    async function handleSubmit() {
        if (!title.trim()) {
            error = "请输入标题";
            return;
        }

        saving = true;
        error = null;

        try {
            const res = await fetch("/api/prompts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    blocks: blocks.filter((b) => b.content.trim()),
                    tagIds:
                        selectedTagIds.length > 0 ? selectedTagIds : undefined,
                }),
            });

            const data = await res.json();
            if (data.success) {
                goto(`/prompts/${data.data.id}`);
            } else {
                error = data.error || "创建失败";
            }
        } catch (e) {
            error = "网络错误";
            console.error(e);
        } finally {
            saving = false;
        }
    }

    $effect(() => {
        loadTags();
    });
</script>

<div class="container page">
    <div class="page-header">
        <div>
            <h1 class="page-title">新建提示词</h1>
        </div>
        <div class="flex gap-3">
            <a href="/" class="btn btn-secondary">取消</a>
            <button
                class="btn btn-primary"
                onclick={handleSubmit}
                disabled={saving}
            >
                {saving ? "保存中..." : "保存"}
            </button>
        </div>
    </div>

    {#if error}
        <div class="error-message">{error}</div>
    {/if}

    <div class="editor-form">
        <div class="form-group">
            <label class="label" for="title">标题 *</label>
            <input
                type="text"
                id="title"
                class="input"
                placeholder="输入提示词标题"
                bind:value={title}
            />
        </div>

        <div class="form-group">
            <label class="label" for="description">描述</label>
            <textarea
                id="description"
                class="textarea"
                placeholder="输入提示词描述（可选）"
                bind:value={description}
                rows="3"
            ></textarea>
        </div>

        <TagSelector
            {allTags}
            {selectedTagIds}
            onTagToggle={handleTagToggle}
            onCreateTag={handleCreateTag}
        />

        <BlockEditor
            {blocks}
            onBlocksChange={(newBlocks) => (blocks = newBlocks)}
        />
    </div>
</div>

<style>
    .editor-form {
        max-width: 800px;
    }

    .error-message {
        padding: var(--space-3) var(--space-4);
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid var(--color-error);
        border-radius: var(--radius-md);
        color: var(--color-error);
        margin-bottom: var(--space-4);
    }
</style>
