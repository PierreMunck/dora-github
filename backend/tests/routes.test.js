import { describe, it, expect, beforeEach, vi } from 'vitest';
import { app } from '../app.js';

const { mockAxiosGet } = vi.hoisted(() => ({
  mockAxiosGet: vi.fn(),
}));

vi.mock('axios', () => ({
  default: { get: mockAxiosGet },
}));

const postJSON = (path, body) =>
  app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/github/releases', () => {
  beforeEach(() => {
    delete process.env.GITHUB_TOKEN;
    vi.resetAllMocks();
  });

  it('returns 500 when GITHUB_TOKEN is not set', async () => {
    const res = await postJSON('/api/github/releases', { repo: 'test-repo', owner: 'test-owner' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'GITHUB_TOKEN not configured' });
  });

  it('returns releases from GitHub when token is set', async () => {
    process.env.GITHUB_TOKEN = 'fake-token';
    const fakeReleases = [{ id: 1, published_at: '2024-01-01', name: 'v1.0.0' }];
    mockAxiosGet.mockResolvedValueOnce({ data: fakeReleases });

    const res = await postJSON('/api/github/releases', { repo: 'test-repo', owner: 'test-owner' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(fakeReleases);
  });

  it('returns 500 when GitHub API call fails', async () => {
    process.env.GITHUB_TOKEN = 'fake-token';
    mockAxiosGet.mockRejectedValueOnce(new Error('Network error'));

    const res = await postJSON('/api/github/releases', { repo: 'test-repo', owner: 'test-owner' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Network error' });
  });
});

describe('POST /api/github/issues/bugs', () => {
  beforeEach(() => {
    delete process.env.GITHUB_TOKEN;
    vi.resetAllMocks();
  });

  it('returns 500 when GITHUB_TOKEN is not set', async () => {
    const res = await postJSON('/api/github/issues/bugs', { repo: 'test-repo', owner: 'test-owner' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'GITHUB_TOKEN not configured' });
  });

  it('returns issues from GitHub when token is set', async () => {
    process.env.GITHUB_TOKEN = 'fake-token';
    const fakeIssues = [{ id: 1, created_at: '2024-01-01', title: 'Bug #1' }];
    mockAxiosGet.mockResolvedValueOnce({ data: fakeIssues });

    const res = await postJSON('/api/github/issues/bugs', { repo: 'test-repo', owner: 'test-owner' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(fakeIssues);
  });

  it('returns 500 when GitHub API call fails', async () => {
    process.env.GITHUB_TOKEN = 'fake-token';
    mockAxiosGet.mockRejectedValueOnce(new Error('Unauthorized'));

    const res = await postJSON('/api/github/issues/bugs', { repo: 'test-repo', owner: 'test-owner' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });
});
