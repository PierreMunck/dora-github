
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import './App.css';
import { match } from 'assert';

const BACKEND_URL = 'http://localhost:4000/api/github/releases';
const OWNER = 'biogroup-it';
const REPOS = [
  { name: 'business-domain-services', label: 'Backend' },
  { name: 'frontend', label: 'Frontend' },
  { name: 'biogroup-tracker', label: 'tracker' },
];

function getWeek(dateStr: string) {
  const d = new Date(dateStr);
  // Get ISO week number
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function App() {
  const [token, setToken] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    
    Promise.all(
      REPOS.map(async (repo) => {
        console.log(`Fetching releases for ${repo.name}... BACKEND_URL=${BACKEND_URL} OWNER=${OWNER}  token=${token ? '***' : '(none)'} `);
        const res = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo: repo.name, owner: OWNER, token }),
        });
        if (!res.ok) throw new Error(`Failed to fetch ${repo.name}`);
        const releases = await res.json();
        return { repo: repo.label, releases };
      })
    )
      .then((results) => {
        // Filter releases from last 5 months
        const now = new Date();
        const fiveMonthsAgo = new Date(now);
        fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 3);
        const weekly: Record<string, any> = {};
        
        results.forEach(({ repo, releases }) => {
          releases.forEach((rel: any) => {
            const date = new Date(rel.published_at || rel.created_at);
            let AppRepo = repo;
            if(repo === 'Frontend'){
              AppRepo = rel.name.split('@')[0].replace(/-/g, '');
              if(AppRepo === 'mybiogroup') console.log(rel);
            }
            if (date >= fiveMonthsAgo) {
              const week = getWeek(date.toISOString());
              if (!weekly[week]) weekly[week] = { week };
              weekly[week][AppRepo] = (weekly[week][AppRepo] || 0) + 1;
            }
          });
        });
        console.log('Processed weekly data:', weekly);
        // Fill missing weeks
        const weeks = [];
        let current = new Date(fiveMonthsAgo);
        const currentWeek = getWeek(now.toISOString());
        while (true) {
          const week = getWeek(current.toISOString());
          weeks.push({
            week,
            Backend: weekly[week]?.Backend || 0,
            MebBO: weekly[week]?.backoffice || 0,
            PreRegistration: weekly[week]?.preregistration || 0,
            mybiogroup: weekly[week]?.mybiogroup || 0,
            Tracker: weekly[week]?.tracker || 0,
          });
          if (week === currentWeek) break;
          current.setDate(current.getDate() + 7);
        }
        console.log('Processed weekly data:', weeks);
        setData(weeks);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="App">
      <h2>DORA Metrics: Production Releases (Last 5 Months)</h2>
      <div style={{ margin: '1em 0' }}>
        <input
          type="password"
          placeholder="Enter GitHub Token"
          value={token}
          onChange={e => setToken(e.target.value)}
          style={{ width: 300 }}
        />
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && data.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="Backend" fill="#8884d8" />
            <Bar dataKey="MebBO" fill="#82ca9d" />
            <Bar dataKey="PreRegistration" fill="#ffc658" />
            <Bar dataKey="mybiogroup" fill="#ff8042" />
            <Bar dataKey="Tracker" fill="#8dd1e1" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default App;
