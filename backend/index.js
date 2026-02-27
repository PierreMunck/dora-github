// Simple Hono server to proxy GitHub API requests
const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { serve } = require('@hono/node-server');
const axios = require('axios');

const app = new Hono();
app.use('*', cors());
const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Proxy endpoint for fetching tags/releases
app.post('/api/github/releases', async (c) => {
  const { repo, owner } = await c.req.json();
  if (!GITHUB_TOKEN) {
    return c.json({ error: 'GITHUB_TOKEN not configured' }, 500);
  }
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/releases`;
    const allReleases = [];
    let page = 1;
    while (true) {
      const response = await axios.get(url, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
        params: { per_page: 100, page }
      });
      allReleases.push(...response.data);
      if (response.data.length < 100) break;
      page++;
    }
    return c.json(allReleases);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Proxy endpoint for fetching bug issues (all pages)
app.post('/api/github/issues/bugs', async (c) => {
  const { repo, owner } = await c.req.json();
  if (!GITHUB_TOKEN) {
    return c.json({ error: 'GITHUB_TOKEN not configured' }, 500);
  }
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/issues`;
    const allIssues = [];
    let page = 1;
    while (true) {
      const response = await axios.get(url, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
        params: { type: 'bug', state: 'all', per_page: 100, page }
      });
      allIssues.push(...response.data);
      if (response.data.length < 100) break;
      page++;
    }
    return c.json(allIssues);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

const PORT = process.env.PORT || 4000;
serve({
  fetch: app.fetch,
  port: PORT,
});
console.log(`Backend listening on port ${PORT}`);
