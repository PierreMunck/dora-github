import { Hono } from 'hono';
import { cors } from 'hono/cors';
import axios from 'axios';

const app = new Hono();
app.use('*', cors());

const GITHUB_API = 'https://api.github.com';

app.post('/api/github/releases', async (c) => {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return c.json({ error: 'GITHUB_TOKEN not configured' }, 500);
  }
  const { repo, owner } = await c.req.json();
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/releases`;
    const allReleases = [];
    let page = 1;
    while (true) {
      const response = await axios.get(url, {
        headers: { Authorization: `token ${githubToken}` },
        params: { per_page: 100, page },
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

app.post('/api/github/issues/bugs', async (c) => {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return c.json({ error: 'GITHUB_TOKEN not configured' }, 500);
  }
  const { repo, owner } = await c.req.json();
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/issues`;
    const allIssues = [];
    let page = 1;
    while (true) {
      const response = await axios.get(url, {
        headers: { Authorization: `token ${githubToken}` },
        params: { type: 'bug', state: 'all', per_page: 100, page },
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

export { app };
