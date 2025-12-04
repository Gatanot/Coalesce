<script lang="ts">
    import type { Prompt } from "$lib/types";
    import PromptCard from "./PromptCard.svelte";

    interface Props {
        prompts: Prompt[];
        onDelete?: (id: string) => void;
    }

    let { prompts, onDelete }: Props = $props();
</script>

{#if prompts.length === 0}
    <div class="empty-state">
        <div class="empty-state-icon"></div>
        <h3 class="empty-state-title">暂无提示词</h3>
        <p class="empty-state-message">
            点击右上角的"新建"按钮创建你的第一个提示词
        </p>
    </div>
{:else}
    <div class="grid grid-3">
        {#each prompts as prompt (prompt.id)}
            <PromptCard {prompt} {onDelete} />
        {/each}
    </div>
{/if}
