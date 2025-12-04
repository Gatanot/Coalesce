<script lang="ts">
    import { page } from "$app/stores";
    import type { PromptWithDetails } from "$lib/types";

    let promptId = $derived($page.params.id);
    let title = $state("");
    let description = $state("");
    let blocks = $state<any[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    async function loadData() {
        loading = true;
        error = null;
        try {
            const promptRes = await fetch(`/api/prompts/${promptId}`);
            const promptData = await promptRes.json();
            if (promptData.success) {
                const prompt: PromptWithDetails = promptData.data;
                title = prompt.title;
                description = prompt.description || "";
                blocks = prompt.blocks.map((b) => ({
                    id: b.id,
                    type: b.type,
                    content: b.content,
                }));
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

    function showToast(message: string, kind: "success" | "error" = "success") {
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

    function copyBlock(content: string) {
        navigator.clipboard
            .writeText(content)
            .then(() => showToast('已复制块到剪贴板'))
            .catch(() => showToast('复制失败', 'error'));
    }

    function copyAll() {
        const content = blocks.map((b) => b.content).join('\n\n');
        navigator.clipboard
            .writeText(content)
            .then(() => showToast('已复制全部内容'))
            .catch(() => showToast('复制失败', 'error'));
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
    {:else if error}
        <div class="error-state">
            <p>{error}</p>
            <a href="/" class="btn btn-secondary">返回首页</a>
        </div>
    {:else}
        <div class="page-header">
            <div>
                <h1 class="page-title">{title}</h1>
                {#if description}
                    <p class="muted">{description}</p>
                {/if}
            </div>
            <div class="flex gap-3 flex-wrap">
                <button class="btn btn-ghost" onclick={copyAll} title="复制全部内容">复制全部</button>
                <a href={`/prompts/${promptId}`} class="btn btn-secondary">编辑</a>
                <a href="/" class="btn btn-outline">返回</a>
            </div>
        </div>

        <div class="blocks-list">
            {#each blocks as block}
                <div class="block read-block">
                    <div class="block-header">
                        <span class="block-type">{block.type}</span>
                        <div class="block-actions">
                            <button class="btn btn-ghost btn-sm" onclick={() => copyBlock(block.content)} title="复制此块">复制</button>
                        </div>
                    </div>

                    {#if block.type === 'code'}
                        <pre class="code-block"><code>{block.content}</code></pre>
                    {:else}
                        <div class="text-block">{block.content}</div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .read-block {
        padding: var(--space-4);
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-4);
    }

    .block-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-3);
    }

    .block-type {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .code-block {
        background: rgba(2,6,23,0.04);
        padding: var(--space-3);
        border-radius: var(--radius-sm);
        overflow: auto;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace;
        font-size: 0.95rem;
    }

    .text-block {
        white-space: pre-wrap;
        line-height: 1.5;
    }
</style>
