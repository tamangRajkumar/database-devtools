import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Database DevTools',
  description: 'Chrome DevTools-like experience for databases in React Native applications',
  base: '/database-devtools/',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'GitHub', link: 'https://github.com/yellowbooking/database-devtools' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Architecture', link: '/architecture' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Expo SQLite', link: '/guides/expo-sqlite' },
          { text: 'Editing data', link: '/guides/editing' },
          { text: 'Custom adapters', link: '/guides/custom-adapter' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yellowbooking/database-devtools' },
    ],
  },
});
