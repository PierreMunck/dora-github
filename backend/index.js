import { serve } from '@hono/node-server';
import { app } from './app.js';

const PORT = process.env.PORT || 4000;
serve({ fetch: app.fetch, port: PORT });
console.log(`Backend listening on port ${PORT}`);
