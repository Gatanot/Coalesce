<script lang="ts">
    import type { Prompt } from "$lib/types";

    interface Props {
        prompt: Prompt;
        onDelete?: (id: string) => void;
    }

    let { prompt, onDelete }: Props = $props();

    function formatDate(timestamp: number): string {
        return new Date(timestamp * 1000).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function handleDelete(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`确定要删除 "${prompt.title}" 吗？`)) {
            onDelete?.(prompt.id);
        }
    }
</script>

<a
    href={`/prompts/${prompt.id}/view`}
    class="prompt-card card card-elevated card-hover"
>
    <div class="card-header">
        <h3 class="card-title truncate">{prompt.title}</h3>
        <button
            class="btn btn-ghost btn-icon delete-btn"
            onclick={handleDelete}
            title="删除"
        >
            <span class="delete-icon">×</span>
        </button>
    </div>

    {#if prompt.description}
        <p class="card-body truncate-2">{prompt.description}</p>
    {/if}

    <div class="card-footer">
        <span class="card-meta">
            {formatDate(prompt.updated_at)}
        </span>
        {#if prompt.cluster_group}
            <span class="tag">{prompt.cluster_group}</span>
        {/if}
    </div>
</a>

<style>
    .prompt-card {
        display: flex;
        flex-direction: column;
        text-decoration: none;
        color: inherit;
        min-height: 140px;
    }

    .prompt-card:hover {
        text-decoration: none;
    }

    .prompt-card:hover .delete-btn {
        opacity: 1;
    }

    .delete-btn {
        opacity: 0;
        transition: opacity var(--md-motion-duration-short3);
        flex-shrink: 0;
    }

    .delete-icon {
        font-size: 22px;
        font-weight: 300;
        line-height: 1;
    }

    .truncate-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        flex: 1;
        margin-bottom: 0;
    }

    .card-meta {
        font-size: var(--md-label-small);
        color: var(--md-on-surface-variant);
    }

    .card-footer {
        margin-top: auto;
    }
</style>
