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
            class="snackbar"
            class:success={message.type === "success"}
            class:error={message.type === "error"}
        >
            <span class="snackbar-icon"
                >{message.type === "success" ? "✓" : "!"}</span
            >
            <span class="snackbar-text">{message.text}</span>
        </div>
    {/if}

    <div class="settings-section">
        <h2 class="section-title">数据管理</h2>

        <div class="settings-list">
            <div class="settings-item">
                <div class="settings-item-content">
                    <h3 class="settings-item-title">导出数据</h3>
                    <p class="settings-item-description">
                        将所有提示词、标签导出为 JSON 文件
                    </p>
                </div>
                <button
                    class="btn btn-tonal"
                    onclick={handleExport}
                    disabled={exporting}
                >
                    {exporting ? "导出中..." : "导出"}
                </button>
            </div>

            <div class="settings-item">
                <div class="settings-item-content">
                    <h3 class="settings-item-title">导入数据</h3>
                    <p class="settings-item-description">
                        从 JSON 文件恢复数据（将覆盖现有数据）
                    </p>
                </div>
                <label class="btn btn-tonal" class:disabled={importing}>
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

        <div class="about-card card card-filled">
            <div class="about-header">
                <div class="about-icon">P</div>
                <div>
                    <h3 class="about-title">Prompt Manager</h3>
                    <p class="about-version">轻量级跨平台提示词管理系统</p>
                </div>
            </div>
            <div class="about-features">
                <div class="feature-item">
                    <span class="feature-check">✓</span>
                    创建和管理 AI 提示词
                </div>
                <div class="feature-item">
                    <span class="feature-check">✓</span>
                    使用标签组织提示词
                </div>
                <div class="feature-item">
                    <span class="feature-check">✓</span>
                    支持 AI 智能聚类分组
                </div>
                <div class="feature-item">
                    <span class="feature-check">✓</span>
                    数据导入/导出
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .settings-section {
        margin-bottom: var(--md-space-10);
    }

    .section-title {
        font-size: var(--md-title-medium);
        font-weight: 500;
        color: var(--md-on-surface-variant);
        margin-bottom: var(--md-space-4);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .settings-list {
        background: var(--md-surface-container);
        border-radius: var(--md-shape-lg);
        overflow: hidden;
    }

    .settings-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--md-space-4) var(--md-space-6);
        gap: var(--md-space-4);
    }

    .settings-item + .settings-item {
        border-top: 1px solid var(--md-outline-variant);
    }

    .settings-item-content {
        flex: 1;
        min-width: 0;
    }

    .settings-item-title {
        font-size: var(--md-body-large);
        font-weight: 500;
        color: var(--md-on-surface);
        margin-bottom: var(--md-space-1);
    }

    .settings-item-description {
        font-size: var(--md-body-small);
        color: var(--md-on-surface-variant);
        margin: 0;
    }

    .snackbar {
        display: flex;
        align-items: center;
        gap: var(--md-space-3);
        padding: var(--md-space-4);
        border-radius: var(--md-shape-sm);
        margin-bottom: var(--md-space-6);
        animation: snackbarIn var(--md-motion-duration-medium2)
            var(--md-motion-easing-decelerate);
    }

    @keyframes snackbarIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .snackbar.success {
        background: var(--md-success-container);
        color: var(--md-on-success-container);
    }

    .snackbar.error {
        background: var(--md-error-container);
        color: var(--md-on-error-container);
    }

    .snackbar-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
    }

    .disabled {
        opacity: 0.38;
        cursor: not-allowed;
    }

    .about-card {
        padding: var(--md-space-6);
    }

    .about-header {
        display: flex;
        align-items: center;
        gap: var(--md-space-4);
        margin-bottom: var(--md-space-6);
    }

    .about-icon {
        width: 56px;
        height: 56px;
        background: var(--md-primary);
        color: var(--md-on-primary);
        border-radius: var(--md-shape-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--md-headline-small);
        font-weight: 600;
    }

    .about-title {
        font-size: var(--md-title-large);
        font-weight: 500;
        color: var(--md-on-surface);
        margin-bottom: var(--md-space-1);
    }

    .about-version {
        font-size: var(--md-body-medium);
        color: var(--md-on-surface-variant);
        margin: 0;
    }

    .about-features {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--md-space-3);
    }

    .feature-item {
        display: flex;
        align-items: center;
        gap: var(--md-space-2);
        font-size: var(--md-body-medium);
        color: var(--md-on-surface-variant);
    }

    .feature-check {
        color: var(--md-primary);
        font-weight: 600;
    }

    @media (max-width: 640px) {
        .about-features {
            grid-template-columns: 1fr;
        }

        .settings-item {
            flex-direction: column;
            align-items: flex-start;
        }

        .settings-item button,
        .settings-item label {
            width: 100%;
            justify-content: center;
        }
    }
</style>
