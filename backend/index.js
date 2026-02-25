// Simple Hono server to proxy GitHub API requests
const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const axios = require('axios');

const app = new Hono();
const GITHUB_API = 'https://api.github.com';

// Proxy endpoint for fetching tags/releases
app.post('/api/github/releases', async (c) => {
  const { repo, owner, token } = await c.req.json();
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/releases`;
    const response = await axios.get(url, {
      headers: { Authorization: `token ${token}` },
      params: { per_page: 100 }
    });
    return c.json(response.data);
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
