"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <button
      className="btn-ghost"
      aria-label="Toggle theme"
      onClick={() => {
        const root = document.documentElement;
        const toDark = !root.classList.contains("dark");
        root.classList.toggle("dark", toDark);
        localStorage.setItem("theme", toDark ? "dark" : "light");
      }}
    >
      {isDark ? "🌙 Dark" : "🌞 Light"}
    </button>
  );
}