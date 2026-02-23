// Simple Express server to proxy GitHub API requests
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GITHUB_API = 'https://api.github.com';

// Proxy endpoint for fetching tags/releases
app.post('/api/github/releases', async (req, res) => {
  const { repo, owner, token } = req.body;
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/releases`;
    const response = await axios.get(url, {
      headers: { Authorization: `token ${token}` },
      params: { per_page: 100 } // Fetch up to 100 releases
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
