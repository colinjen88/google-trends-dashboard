/**
 * Google Trends Dashboard - Theme Manager Module
 * 
 * @description 管理深色/淺色模式切換與持久化
 * @version 2.0
 */

const ThemeManager = (function() {
    'use strict';

    const STORAGE_KEY = 'trends-dashboard-theme';
    const THEMES = {
        DARK: 'dark',
        LIGHT: 'light'
    };

    let currentTheme = THEMES.DARK;

    /**
     * 初始化主題
     */
    function init() {
        // 優先讀取儲存的偏好
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
            currentTheme = savedTheme;
        } else {
            // 檢查系統偏好
            if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
                currentTheme = THEMES.LIGHT;
            }
        }
        
        applyTheme(currentTheme);
        
        // 監聽系統主題變化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                setTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
            }
        });
    }

    /**
     * 應用主題
     * @param {string} theme - 主題名稱
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        currentTheme = theme;
        
        // 更新 meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === THEMES.DARK ? '#0f0f23' : '#f8fafc');
        }
    }

    /**
     * 設定主題並儲存
     * @param {string} theme - 主題名稱
     */
    function setTheme(theme) {
        applyTheme(theme);
        localStorage.setItem(STORAGE_KEY, theme);
        
        // 發送主題變更事件
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    /**
     * 切換主題
     */
    function toggle() {
        const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
        setTheme(newTheme);
        return newTheme;
    }

    /**
     * 獲取當前主題
     */
    function getCurrent() {
        return currentTheme;
    }

    /**
     * 是否為深色模式
     */
    function isDark() {
        return currentTheme === THEMES.DARK;
    }

    // 公開 API
    return {
        init,
        setTheme,
        toggle,
        getCurrent,
        isDark,
        THEMES
    };
})();

// 掛載到全域
window.ThemeManager = ThemeManager;
