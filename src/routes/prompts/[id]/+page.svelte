<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import BlockEditor from "$lib/components/BlockEditor.svelte";
    import TagSelector from "$lib/components/TagSelector.svelte";
    import type { Tag, PromptWithDetails } from "$lib/types";

    interface BlockItem {
        id: string;
        type: "text" | "code";
        content: string;
        meta_json: string | null;
    }

    let promptId = $derived($page.params.id);
    let title = $state("");
    let description = $state("");
    let blocks = $state<BlockItem[]>([]);
    let selectedTagIds = $state<number[]>([]);
    let allTags = $state<Tag[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state<string | null>(null);

    async function loadData() {
        loading = true;
        error = null;
        try {
            // Load tags
            const tagsRes = await fetch("/api/tags");
            const tagsData = await tagsRes.json();
            if (tagsData.success) {
                allTags = tagsData.data;
            }

            // Load prompt
            const promptRes = await fetch(`/api/prompts/${promptId}`);
            const promptData = await promptRes.json();

            if (promptData.success) {
                const prompt: PromptWithDetails = promptData.data;
                title = prompt.title;
                description = prompt.description || "";
                blocks = prompt.blocks.map((b) => ({
                    id: b.id,
                    type: b.type as "text" | "code",
                    content: b.content,
                    meta_json: b.meta_json,
                }));
                selectedTagIds = prompt.tags.map((t) => t.id);
            } else {
                error = "提示词不存在";
            }
        } catch (e) {
            error = "加载失败";
            console.error(e);
        } finally {
            loading = false;
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
                const tagsRes = await fetch("/api/tags");
                const tagsData = await tagsRes.json();
                if (tagsData.success) {
                    allTags = tagsData.data;
                }
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
            const res = await fetch(`/api/prompts/${promptId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    blocks: blocks.filter((b) => b.content.trim()),
                    tagIds: selectedTagIds,
                }),
            });

            const data = await res.json();
            if (data.success) {
                goto("/");
            } else {
                error = data.error || "保存失败";
            }
        } catch (e) {
            error = "网络错误";
            console.error(e);
        } finally {
            saving = false;
        }
    }

    async function handleDelete() {
        if (!confirm("确定要删除这个提示词吗？")) return;

        try {
            const res = await fetch(`/api/prompts/${promptId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                goto("/");
            } else {
                showToast('删除失败: ' + (data.error || '未知错误'), 'error');
            }
        } catch (e) {
            showToast('删除失败', 'error');
            console.error(e);
        }
    }

    function copyToClipboard() {
        const content = blocks.map((b) => b.content).join("\n\n");
        navigator.clipboard
            .writeText(content)
            .then(() => {
                showToast('已复制到剪贴板');
            })
            .catch(() => {
                showToast('复制失败', 'error');
            });
    }

    function showToast(message: string, kind: 'success' | 'error' = 'success') {
        let container = document.querySelector('.toast-container') as HTMLElement | null;
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const t = document.createElement('div');
        t.className = `toast ${kind === 'success' ? 'toast-success' : 'toast-error'}`;
        t.textContent = message;
        container.appendChild(t);

        setTimeout(() => {
            t.classList.add('hide');
            t.addEventListener('transitionend', () => t.remove());
        }, 2200);
    }

    $effect(() => {
        loadData();
    });
</script>

<div class="container page">
    {#if loading}
        <div class="loading">
            <p>加载中...</p>
        </div>
    {:else if error && !title}
        <div class="error-state">
            <p>{error}</p>
            <a href="/" class="btn btn-secondary">返回首页</a>
        </div>
    {:else}
        <div class="page-header">
            <div>
                <h1 class="page-title">编辑提示词</h1>
            </div>
            <div class="flex gap-3 flex-wrap">
                <button
                    class="btn btn-ghost"
                    onclick={copyToClipboard}
                    title="复制全部内容"
                >
                    复制
                </button>
                <button class="btn btn-danger" onclick={handleDelete}>
                    删除
                </button>
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
    {/if}
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

    .loading,
    .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-16);
        color: var(--color-text-muted);
        gap: var(--space-4);
    }
</style>
