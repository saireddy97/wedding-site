import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Project sites are served under /<repository-name>/ on GitHub Pages and
// /<project-name>/ on GitLab Pages. Override these defaults for a custom domain.
const githubOwner = process.env.GITHUB_REPOSITORY_OWNER;
const githubRepository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const defaultBase = process.env.GITHUB_ACTIONS === 'true' && githubRepository
  ? `/${githubRepository}/`
  : process.env.CI_PROJECT_NAME
    ? `/${process.env.CI_PROJECT_NAME}/`
    : '/';
const base = process.env.SITE_BASE_PATH ?? defaultBase;
const defaultSite = process.env.GITHUB_ACTIONS === 'true' && githubOwner
  ? `https://${githubOwner}.github.io`
  : 'https://example.gitlab.io';

export default defineConfig({
  site: process.env.SITE_URL || defaultSite,
  base,
  vite: { plugins: [tailwindcss()] },
  output: 'static',
});
