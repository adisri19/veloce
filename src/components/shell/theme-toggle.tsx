"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { IconButton } from "../ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const hasDarkClass = document.documentElement.classList.contains("dark");
    setIsDark(hasDarkClass);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("veloce_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("veloce_theme", "light");
    }
  };

  if (!mounted) {
    return <IconButton icon={<Moon className="w-4 h-4" />} />;
  }

  return (
    <IconButton
      icon={isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    />
  );
}
