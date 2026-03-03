
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import './App.css';

const BACKEND_URL = 'http://localhost:4000/api/github/releases';
const BUGS_URL = 'http://localhost:4000/api/github/issues/bugs';
const OWNER = 'biogroup-it';
const REPOS = [
  { name: 'business-domain-services', label: 'Backend' },
  { name: 'frontend', label: 'Frontend' },
  { name: 'biogroup-tracker', label: 'Tracker' },
  { name: 'projects', label: 'MEB' },
];

// GitHub API shapes
interface Release {
  published_at: string | null;
  created_at: string;
  name: string;
}

interface Issue {
  created_at: string;
  repository_url: string;
}

// Chart data shapes
interface WeeklyEntry {
  week: string;
  Backend: number;
  MebBO: number;
  PreRegistration: number;
  mybiogroup: number;
  Tracker: number;
}

interface BugWeekEntry {
  week: string;
  Backend: number;
  Frontend: number;
  Tracker: number;
  MEB: number;
}


function getWeek(dateStr: string) {
  const d = new Date(dateStr);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function App() {
  const [releaseData, setReleaseData] = useState<WeeklyEntry[]>([]);
  const [bugData, setBugData] = useState<BugWeekEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function fetchData() {
    setLoading(true);
    setError('');

    const fetchReleases = Promise.all(
      REPOS.map(async (repo) => {
        const res = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo: repo.name, owner: OWNER }),
        });
        if (!res.ok) throw new Error(`Failed to fetch releases for ${repo.name}`);
        const releases = await res.json() as Release[];
        return { repo: repo.label, releases };
      })
    );

    const fetchBugs = Promise.all(
      REPOS.map(async (repo) => {
        const res = await fetch(BUGS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo: repo.name, owner: OWNER }),
        });
        if (!res.ok) throw new Error(`Failed to fetch bugs for ${repo.name}`);
        const issues = await res.json() as Issue[];
        return { repo: repo.label, issues: Array.isArray(issues) ? issues : [] };
      })
    );

    Promise.all([fetchReleases, fetchBugs])
      .then(([releaseResults, bugResults]) => {
        // Process releases
        const now = new Date();
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const weekly: Record<string, Record<string, number>> = {};

        releaseResults.forEach(({ repo, releases }) => {
          releases.forEach((rel: Release) => {
            const date = new Date(rel.published_at || rel.created_at);
            let AppRepo = repo;
            if (repo === 'Frontend') {
              AppRepo = rel.name.split('@')[0].replace(/-/g, '');
            }
            if (date >= threeMonthsAgo) {
              const week = getWeek(date.toISOString());
              if (!weekly[week]) weekly[week] = {};
              weekly[week][AppRepo] = (weekly[week][AppRepo] || 0) + 1;
            }
          });
        });

        const weeks: WeeklyEntry[] = [];
        let current = new Date(threeMonthsAgo);
        const currentWeek = getWeek(now.toISOString());
        while (true) {
          const week = getWeek(current.toISOString());
          weeks.push({
            week,
            Backend: weekly[week]?.Backend || 0,
            MebBO: weekly[week]?.backoffice || 0,
            PreRegistration: weekly[week]?.preregistration || 0,
            mybiogroup: weekly[week]?.mybiogroup || 0,
            Tracker: weekly[week]?.Tracker || 0,
          });
          if (week === currentWeek) break;
          current.setDate(current.getDate() + 7);
        }
        setReleaseData(weeks);

        const bugWeekly: Record<string, Record<string, number>> = {};
        bugResults.forEach(({ repo, issues }) => {
          issues.forEach((issue: Issue) => {
            console.log(issue);
            const date = new Date(issue.created_at);
            if (date >= threeMonthsAgo) {
              let AppRepo = repo;
              if (repo === 'MEB') {
                if(issue.repository_url.includes('biogroup-tracker')) {
                  AppRepo = 'Tracker';
                } else {
                  AppRepo = 'MEB';
                }
              }
              const week = getWeek(date.toISOString());
              if (!bugWeekly[week]) bugWeekly[week] = {};
              bugWeekly[week][repo] = (bugWeekly[week][repo] || 0) + 1;
            }
          });
        });

        const bugWeeks: BugWeekEntry[] = [];
        let bugCurrent = new Date(threeMonthsAgo);
        while (true) {
          const week = getWeek(bugCurrent.toISOString());
          bugWeeks.push({
            week,
            Backend: bugWeekly[week]?.Backend || 0,
            Frontend: bugWeekly[week]?.Frontend || 0,
            Tracker: bugWeekly[week]?.Tracker || 0,
            MEB: bugWeekly[week]?.MEB || 0,
          });
          if (week === currentWeek) break;
          bugCurrent.setDate(bugCurrent.getDate() + 7);
        }
        setBugData(bugWeeks);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }

  return (
    <div className="App">
      <div style={{ margin: '1em 0' }}>
        <button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Run'}
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && releaseData.length > 0 && (
        <>
          <h2>Production Releases — Last 3 Months</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={releaseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Backend" fill="#8884d8" />
              <Bar dataKey="MebBO" fill="#82ca9d" />
              <Bar dataKey="PreRegistration" fill="#ffc658" />
              <Bar dataKey="mybiogroup" fill="#ff8042" />
              <Bar dataKey="Tracker" fill="#8dd1e1" />
            </BarChart>
          </ResponsiveContainer>

          <h2>Production Releases — Last 2 Weeks</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={releaseData.slice(-2)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Backend" fill="#8884d8" />
              <Bar dataKey="MebBO" fill="#82ca9d" />
              <Bar dataKey="PreRegistration" fill="#ffc658" />
              <Bar dataKey="mybiogroup" fill="#ff8042" />
              <Bar dataKey="Tracker" fill="#8dd1e1" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {!loading && bugData.length > 0 && (
        <>
          <h2>Open Bugs by Project</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bugData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Backend" fill="#8884d8" />
              <Bar dataKey="Frontend" fill="#ff8042" />
              <Bar dataKey="Tracker" fill="#8dd1e1" />
              <Bar dataKey="MEB" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

export default App;
