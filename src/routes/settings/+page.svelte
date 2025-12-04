<script lang="ts">
    let exporting = $state(false);
    let importing = $state(false);
    let message = $state<{ type: "success" | "error"; text: string } | null>(
        null,
    );

    async function handleExport() {
        exporting = true;
        message = null;
        try {
            const res = await fetch("/api/data/export");
            const data = await res.json();

            if (data.success) {
                // Download JSON file
                const blob = new Blob([JSON.stringify(data.data, null, 2)], {
                    type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `prompt-manager-backup-${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                message = { type: "success", text: "导出成功!" };
            } else {
                message = { type: "error", text: data.error || "导出失败" };
            }
        } catch (e) {
            message = { type: "error", text: "导出失败" };
            console.error(e);
        } finally {
            exporting = false;
        }
    }

    async function handleImport(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        if (
            !confirm(
                "导入将覆盖所有现有数据。系统会自动备份当前数据。确定要继续吗？",
            )
        ) {
            input.value = "";
            return;
        }

        importing = true;
        message = null;

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            const res = await fetch("/api/data/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jsonData),
            });

            const data = await res.json();
            if (data.success) {
                message = {
                    type: "success",
                    text: `导入成功! 已导入 ${data.data.imported.prompts} 个提示词和 ${data.data.imported.tags} 个标签`,
                };
            } else {
                message = { type: "error", text: data.error || "导入失败" };
            }
        } catch (e) {
            message = { type: "error", text: "文件格式错误" };
            console.error(e);
        } finally {
            importing = false;
            input.value = "";
        }
    }
</script>

<div class="container page">
    <div class="page-header">
        <div>
            <h1 class="page-title">设置</h1>
            <p class="page-subtitle">数据管理与系统配置</p>
        </div>
    </div>

    {#if message}
        <div
            class="message"
            class:success={message.type === "success"}
            class:error={message.type === "error"}
        >
            {message.text}
        </div>
    {/if}

    <div class="settings-section">
        <h2 class="section-title">数据管理</h2>

        <div class="card">
            <div class="card-header">
                <div>
                    <h3 class="card-title">导出数据</h3>
                    <p class="card-description">
                        将所有提示词、标签导出为 JSON 文件
                    </p>
                </div>
                <button
                    class="btn btn-secondary"
                    onclick={handleExport}
                    disabled={exporting}
                >
                    {exporting ? "导出中..." : "导出"}
                </button>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div>
                    <h3 class="card-title">导入数据</h3>
                    <p class="card-description">
                        从 JSON 文件恢复数据（将覆盖现有数据，自动备份）
                    </p>
                </div>
                <label class="btn btn-secondary" class:disabled={importing}>
                    {importing ? "导入中..." : "导入"}
                    <input
                        type="file"
                        accept=".json"
                        onchange={handleImport}
                        disabled={importing}
                        hidden
                    />
                </label>
            </div>
        </div>
    </div>

    <div class="settings-section">
        <h2 class="section-title">关于</h2>

        <div class="card">
            <div class="about-content">
                <h3>Prompt Manager</h3>
                <p>轻量级跨平台提示词管理系统</p>
                <ul class="feature-list">
                    <li>创建和管理 AI 提示词</li>
                    <li>使用标签组织提示词</li>
                    <li>支持 AI 智能聚类分组</li>
                    <li>数据导入/导出</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<style>
    .settings-section {
        margin-bottom: var(--space-8);
    }

    .section-title {
        font-size: var(--text-lg);
        margin-bottom: var(--space-4);
    }

    .card + .card {
        margin-top: var(--space-4);
    }

    .card-description {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        margin-top: var(--space-1);
    }

    .message {
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-4);
    }

    .message.success {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid var(--color-success);
        color: var(--color-success);
    }

    .message.error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid var(--color-error);
        color: var(--color-error);
    }

    .disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .about-content h3 {
        font-size: var(--text-xl);
        margin-bottom: var(--space-2);
    }

    .about-content p {
        margin-bottom: var(--space-4);
    }

    .feature-list {
        list-style: none;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-2);
    }

    .feature-list li {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        padding-left: var(--space-4);
        position: relative;
    }

    .feature-list li::before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--color-accent);
    }

    @media (max-width: 640px) {
        .feature-list {
            grid-template-columns: 1fr;
        }
    }
</style>
