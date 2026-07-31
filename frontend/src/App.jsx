import { useState, useEffect } from 'react';

const API_URL = 'http://3tier-alb-1818832820.us-east-1.elb.amazonaws.com:5000'

function App() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/entries`);
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      setStatus('Could not load entries');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleClearAll = async () => {
    if (!window.confirm('Delete all entries? This cannot be undone.')) return;
    try {
      await fetch(`${API_URL}/entries`, { method: 'DELETE' });
      setStatus('All entries cleared');
      fetchEntries();
    } catch (err) {
      setStatus('Error: could not clear entries');
    }
  };

  const handleInsert = async () => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`${API_URL}/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setStatus(`Saved at ${data.time}`);
      setText('');
      fetchEntries();
    } catch (err) {
      setStatus('Error: could not connect to backend');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.badge}>AWS 3-TIER</div>
          <h1 style={styles.title}>DataDrop</h1>
          <p style={styles.subtitle}>React frontend · Flask backend · PostgreSQL database</p>
        </div>

        <div style={styles.card}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
            placeholder="Type something..."
            style={styles.input}
          />
          <button onClick={handleInsert} style={styles.button}>
            Insert
          </button>
        </div>

        {status && <p style={styles.status}>{status}</p>}

        <div style={styles.listHeader}>
          <h2 style={styles.listTitle}>Entries ({entries.length})</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchEntries} style={styles.refreshButton}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={handleClearAll} style={styles.clearButton}>
              Clear All
            </button>
          </div>
        </div>

        <div style={styles.list}>
          {entries.length === 0 && !loading && (
            <p style={styles.empty}>No entries yet — add one above.</p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} style={styles.entryCard}>
              <span style={styles.entryId}>#{entry.id}</span>
              <p style={styles.entryText}>{entry.text}</p>
              <span style={styles.entryTime}>{entry.created_at}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f1117',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    color: '#e5e7eb',
    display: 'flex',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  container: { width: '100%', maxWidth: '640px' },
  header: { marginBottom: '32px' },
  badge: {
    display: 'inline-block',
    fontSize: '11px',
    letterSpacing: '1.5px',
    color: '#7dd3fc',
    border: '1px solid #7dd3fc44',
    padding: '4px 10px',
    borderRadius: '999px',
    marginBottom: '14px',
  },
  title: { fontSize: '36px', fontWeight: 700, margin: 0, color: '#fff' },
  subtitle: { color: '#9ca3af', marginTop: '8px', fontSize: '15px' },
  card: {
    display: 'flex',
    gap: '10px',
    background: '#1a1d24',
    padding: '16px',
    borderRadius: '14px',
    border: '1px solid #2a2e38',
  },
  input: {
    flex: 1,
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #2a2e38',
    background: '#12141a',
    color: '#e5e7eb',
    fontSize: '15px',
    outline: 'none',
  },
  button: {
    padding: '12px 22px',
    borderRadius: '10px',
    border: 'none',
    background: '#7dd3fc',
    color: '#0f1117',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '15px',
  },
  status: { marginTop: '12px', color: '#7dd3fc', fontSize: '14px' },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '40px',
    marginBottom: '16px',
  },
  listTitle: { fontSize: '18px', margin: 0, color: '#fff' },
  refreshButton: {
    background: 'transparent',
    border: '1px solid #2a2e38',
    color: '#9ca3af',
    padding: '6px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  clearButton: {
    background: 'transparent',
    border: '1px solid #ef444444',
    color: '#f87171',
    padding: '6px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  empty: { color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '30px 0' },
  entryCard: {
    background: '#1a1d24',
    border: '1px solid #2a2e38',
    borderLeft: '3px solid #7dd3fc',
    borderRadius: '10px',
    padding: '14px 16px',
  },
  entryId: { fontSize: '12px', color: '#7dd3fc', fontWeight: 600 },
  entryText: { margin: '6px 0', fontSize: '15px', color: '#e5e7eb' },
  entryTime: { fontSize: '12px', color: '#6b7280' },
};

export default App;
