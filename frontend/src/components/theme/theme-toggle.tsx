"use client";

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function applyMode(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  try {
    localStorage.setItem("zigba-theme", dark ? "dark" : "light");
  } catch {
    /* ignore quota / private mode */
  }
}

export function ThemeToggle() {
  function toggle() {
    applyMode(!isDark());
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <span className="theme-toggle__track">
        <span className="theme-toggle__knob" />
      </span>
      <span className="theme-toggle__copy theme-toggle__copy--paper">Paper</span>
      <span className="theme-toggle__copy theme-toggle__copy--night">Night</span>
    </button>
  );
}
