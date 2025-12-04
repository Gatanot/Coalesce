<script lang="ts">
    import { browser } from "$app/environment";

    let theme = $state<"dark" | "light">("dark");

    function toggleTheme() {
        theme = theme === "dark" ? "light" : "dark";
        if (browser) {
            document.documentElement.setAttribute("data-theme", theme);
            localStorage.setItem("theme", theme);
        }
    }

    // Initialize theme on mount
    $effect(() => {
        if (browser) {
            const savedTheme = localStorage.getItem("theme") as
                | "dark"
                | "light"
                | null;
            const prefersDark = window.matchMedia(
                "(prefers-color-scheme: dark)",
            ).matches;
            theme = savedTheme || (prefersDark ? "dark" : "light");
            document.documentElement.setAttribute("data-theme", theme);
        }
    });
</script>

<button
    type="button"
    class="theme-toggle"
    onclick={toggleTheme}
    title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
    aria-label="切换主题"
>
    <span class="theme-icon"></span>
</button>
