import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'energy-dark',
    name: 'Energy Dark',
    mode: 'dark',
    dots: ['#22ff88', '#00f0ff', '#07111f'],
    description: 'High-contrast neo-energy neon with deep void background'
  },
  {
    id: 'ocean-dark',
    name: 'Ocean Deep',
    mode: 'dark',
    dots: ['#00c8ff', '#6366f1', '#071224'],
    description: 'Electric cyan and indigo on deep oceanic blue'
  },
  {
    id: 'nature-green',
    name: 'Forest',
    mode: 'dark',
    dots: ['#10b981', '#84cc16', '#051811'],
    description: 'Emerald and lime on rich dark canopy'
  },
  {
    id: 'solar-light',
    name: 'Solar Light',
    mode: 'light',
    dots: ['#059669', '#0284c7', '#f8fafc'],
    description: 'Crisp daylit interface with solar green and sky blue'
  },
  {
    id: 'minimal-white',
    name: 'Minimal',
    mode: 'light',
    dots: ['#0f172a', '#4f46e5', '#ffffff'],
    description: 'Clean executive clarity with slate and royal indigo'
  }
];

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('theme') || 'energy-dark';
  });

  const [followSystem, setFollowSystemState] = useState(() => {
    return localStorage.getItem('theme_follow_system') === 'true';
  });

  // Determine system theme
  const getSystemTheme = () => {
    if (typeof window === 'undefined') return 'energy-dark';
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'energy-dark' : 'minimal-white';
  };

  const [effectiveTheme, setEffectiveTheme] = useState(() => {
    if (followSystem) {
      return getSystemTheme();
    }
    return theme;
  });

  // Handle system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      if (followSystem) {
        const newSysTheme = e.matches ? 'energy-dark' : 'minimal-white';
        setEffectiveTheme(newSysTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [followSystem]);

  // Apply data-theme and dark class to documentElement
  useEffect(() => {
    const active = followSystem ? getSystemTheme() : theme;
    setEffectiveTheme(active);

    const root = document.documentElement;
    root.setAttribute('data-theme', active);

    const activeThemeObj = THEMES.find(t => t.id === active);
    if (activeThemeObj?.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, followSystem]);

  const setTheme = (newThemeId) => {
    const exists = THEMES.some(t => t.id === newThemeId);
    if (!exists) return;

    // When manually selecting a theme, disable followSystem to respect user's explicit choice
    setFollowSystemState(false);
    localStorage.setItem('theme_follow_system', 'false');

    setThemeState(newThemeId);
    localStorage.setItem('theme', newThemeId);
  };

  const setFollowSystem = (val) => {
    setFollowSystemState(val);
    localStorage.setItem('theme_follow_system', val ? 'true' : 'false');
    if (val) {
      const sysTheme = getSystemTheme();
      setEffectiveTheme(sysTheme);
    } else {
      setEffectiveTheme(theme);
    }
  };

  const currentThemeObj = THEMES.find(t => t.id === effectiveTheme) || THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme: effectiveTheme,
        selectedThemeId: theme,
        currentThemeObj,
        followSystem,
        setTheme,
        setFollowSystem,
        availableThemes: THEMES
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
