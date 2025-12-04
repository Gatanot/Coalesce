<script lang="ts">
    import { page } from "$app/stores";
    import ThemeToggle from "./ThemeToggle.svelte";

    let mobileMenuOpen = $state(false);

    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }

    function closeMobileMenu() {
        mobileMenuOpen = false;
    }
</script>

<nav class="navbar">
    <div class="navbar-container">
        <a href="/" class="navbar-brand" onclick={closeMobileMenu}>
            <span class="navbar-brand-icon">P</span>
            <span class="navbar-brand-text">Prompt Manager</span>
        </a>

        <button
            class="mobile-menu-btn"
            onclick={toggleMobileMenu}
            aria-label="菜单"
        >
            <span class="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </span>
        </button>

        <div class="navbar-nav" class:open={mobileMenuOpen}>
            <a
                href="/"
                class="nav-link"
                class:active={$page.url.pathname === "/"}
                onclick={closeMobileMenu}
            >
                提示词
            </a>
            <a
                href="/settings"
                class="nav-link"
                class:active={$page.url.pathname === "/settings"}
                onclick={closeMobileMenu}
            >
                设置
            </a>
            <ThemeToggle />
        </div>
    </div>
</nav>

<style>
    .navbar-brand-text {
        display: block;
    }

    @media (max-width: 480px) {
        .navbar-brand-text {
            display: none;
        }
    }
</style>
