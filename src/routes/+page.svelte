<script lang="ts">
    import type { ViewMode, GroupedPrompts } from "$lib/types";
    import PromptList from "$lib/components/PromptList.svelte";

    let groupedPrompts = $state<GroupedPrompts>({});
    let viewMode = $state<ViewMode>("clusters");
    let loading = $state(true);
    let error = $state<string | null>(null);

    async function loadData() {
        loading = true;
        error = null;
        try {
            const groupBy = viewMode === "clusters" ? "cluster" : "tag";
            const promptsRes = await fetch(`/api/prompts?groupBy=${groupBy}`);
            const promptsData = await promptsRes.json();

            if (promptsData.success) {
                groupedPrompts = promptsData.data;
            }
        } catch (e) {
            error = "加载数据失败";
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function handleDelete(id: string) {
        try {
            const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                await loadData();
            } else {
                showToast("删除失败: " + (data.error || "未知错误"), "error");
            }
        } catch (e) {
            showToast("删除失败", "error");
            console.error(e);
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

    function switchView(mode: ViewMode) {
        viewMode = mode;
        loadData();
    }

    $effect(() => {
        loadData();
    });

    function getSortedGroups(): string[] {
        const keys = Object.keys(groupedPrompts);
        return keys.sort((a, b) => {
            if (a === "未分类" || a === "未标记") return 1;
            if (b === "未分类" || b === "未标记") return -1;
            return a.localeCompare(b, "zh-CN");
        });
    }
</script>

<div class="container page">
    <div class="page-header">
        <div>
            <h1 class="page-title">提示词管理</h1>
            <p class="page-subtitle">管理你的 AI 提示词库</p>
        </div>
        <a href="/prompts/new" class="btn btn-primary btn-lg">+ 新建</a>
    </div>

    <div class="controls">
        <div class="tabs">
            <button
                class="tab"
                class:active={viewMode === "clusters"}
                onclick={() => switchView("clusters")}
            >
                智能分组
            </button>
            <button
                class="tab"
                class:active={viewMode === "tags"}
                onclick={() => switchView("tags")}
            >
                标签分组
            </button>
        </div>
    </div>

    {#if loading}
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
        </div>
    {:else if error}
        <div class="error-state">
            <div class="error-icon">!</div>
            <p>{error}</p>
            <button class="btn btn-tonal" onclick={loadData}>重试</button>
        </div>
    {:else}
        {#each getSortedGroups() as groupKey (groupKey)}
            <div class="group">
                <div class="group-header">
                    <h2 class="group-title">{groupKey}</h2>
                    <span class="group-count"
                        >{groupedPrompts[groupKey].length}</span
                    >
                </div>
                <PromptList
                    prompts={groupedPrompts[groupKey]}
                    onDelete={handleDelete}
                />
            </div>
        {:else}
            <div class="empty-state">
                <div class="empty-state-icon">
                    <span>+</span>
                </div>
                <h3 class="empty-state-title">暂无提示词</h3>
                <p class="empty-state-message">
                    点击右上角的"新建"按钮创建你的第一个提示词
                </p>
                <a href="/prompts/new" class="btn btn-primary">创建提示词</a>
            </div>
        {/each}
    {/if}
</div>

<style>
    .controls {
        margin-bottom: var(--md-space-8);
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
