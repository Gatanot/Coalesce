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
        let container = document.querySelector(
            ".toast-container",
        ) as HTMLElement | null;
        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            document.body.appendChild(container);
        }

        const t = document.createElement("div");
        t.className = `toast ${kind === "success" ? "toast-success" : "toast-error"}`;
        t.textContent = message;
        container.appendChild(t);

        setTimeout(() => {
            t.classList.add("hide");
            t.addEventListener("transitionend", () => t.remove());
        }, 2200);
    }

    function copyBlock(content: string) {
        navigator.clipboard
            .writeText(content)
            .then(() => showToast("已复制块到剪贴板"))
            .catch(() => showToast("复制失败", "error"));
    }

    function copyAll() {
        const content = blocks.map((b) => b.content).join("\n\n");
        navigator.clipboard
            .writeText(content)
            .then(() => showToast("已复制全部内容"))
            .catch(() => showToast("复制失败", "error"));
    }

    $effect(() => {
        loadData();
    });
</script>

<div class="container page">
    {#if loading}
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
        </div>
    {:else if error}
        <div class="error-state">
            <div class="error-icon">!</div>
            <p>{error}</p>
            <a href="/" class="btn btn-tonal">返回首页</a>
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
                <button
                    class="btn btn-ghost"
                    onclick={copyAll}
                    title="复制全部内容">复制全部</button
                >
                <a href={`/prompts/${promptId}`} class="btn btn-tonal">编辑</a>
                <a href="/" class="btn btn-secondary">返回</a>
            </div>
        </div>

        <div class="blocks-container">
            {#each blocks as block, i}
                <div class="view-block card card-outlined">
                    <div class="view-block-header">
                        <div class="view-block-meta">
                            <span class="view-block-number">{i + 1}</span>
                            <span class="view-block-type"
                                >{block.type === "code" ? "代码" : "文本"}</span
                            >
                        </div>
                        <button
                            class="btn btn-ghost btn-sm"
                            onclick={() => copyBlock(block.content)}
                            title="复制此块"
                        >
                            复制
                        </button>
                    </div>

                    {#if block.type === "code"}
                        <pre class="view-code-block"><code>{block.content}</code
                            ></pre>
                    {:else}
                        <div class="view-text-block">{block.content}</div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .blocks-container {
        max-width: 800px;
        display: flex;
        flex-direction: column;
        gap: var(--md-space-4);
    }

    .view-block {
        padding: var(--md-space-4);
    }

    .view-block-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--md-space-3);
    }

    .view-block-meta {
        display: flex;
        align-items: center;
        gap: var(--md-space-3);
    }

    .view-block-number {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--md-surface-container-highest);
        color: var(--md-on-surface-variant);
        border-radius: var(--md-shape-full);
        font-size: var(--md-label-small);
        font-weight: 500;
    }

    .view-block-type {
        font-size: var(--md-label-small);
        color: var(--md-on-surface-variant);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .view-code-block {
        background: var(--md-surface-container-highest);
        padding: var(--md-space-4);
        border-radius: var(--md-shape-sm);
        overflow: auto;
        font-family: var(--md-font-mono);
        font-size: var(--md-body-medium);
        margin: 0;
        border: none;
    }

    .view-code-block code {
        background: none;
        padding: 0;
        color: var(--md-on-surface);
    }

    .view-text-block {
        white-space: pre-wrap;
        line-height: 1.6;
        color: var(--md-on-surface);
    }

    .loading-state,
    .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--md-space-16);
        color: var(--md-on-surface-variant);
        gap: var(--md-space-4);
    }

    .loading-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid var(--md-outline-variant);
        border-top-color: var(--md-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-icon {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--md-error-container);
        color: var(--md-on-error-container);
        border-radius: var(--md-shape-full);
        font-size: 24px;
        font-weight: 500;
    }
</style>
