import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// GitLab project pages live under /<project-name>/ by default.
// Set SITE_BASE_PATH=/ in GitLab CI/CD variables when using a custom domain.
const base = process.env.SITE_BASE_PATH ?? (process.env.CI ? `/${process.env.CI_PROJECT_NAME}/` : '/');

export default defineConfig({
  site: process.env.SITE_URL || 'https://example.gitlab.io',
  base,
  vite: { plugins: [tailwindcss()] },
  output: 'static',
});
