import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [platformsList, setPlatformsList] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [title, setTitle] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testedCountries, setTestedCountries] = useState([]);
  const [showType, setShowType] = useState('movie');
  const abortControllerRef = useRef(null);

  useEffect(() => {
    fetch('/src/platforms.json')
      .then(res => res.json())
      .then(data => {
        setPlatformsList(data);
        setPlatforms(data.length > 0 ? [data[0].id] : []);
      });
  }, []);

  const handlePlatformChange = (e) => {
    const { value, checked } = e.target;
    setPlatforms((prev) =>
      checked ? [...prev, value] : prev.filter((p) => p !== value)
    );
  };

  // Helper to check if a show is available via subscription only
  function isSubscriptionOnly(show, country, platform) {
    if (!show.streamingOptions || !show.streamingOptions[country]) return false;
    return show.streamingOptions[country].some(opt =>
      opt.serviceId === platform && opt.type === 'subscription'
    );
  }

  // Vérifie si le film existe dans un pays de référence (ex: US)
  async function checkTitleExists(title, platforms, rapidApiKey, showType, signal) {
    const refCountry = 'us';
    for (const platform of platforms) {
      const url = `https://streaming-availability.p.rapidapi.com/shows/search/title?title=${encodeURIComponent(title)}&country=${refCountry}&output_language=en&provider=${platform}&show_type=${showType}`;
      const res = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
        },
        signal
      });
      if (res.status === 0) throw new Error('aborted');
      const data = await res.json();
      let shows = [];
      if (Array.isArray(data)) shows = data;
      else if (data.result) shows = data.result;
      else if (data.shows) shows = data.shows;
      if (shows.length > 0) return true;
    }
    return false;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setTestedCountries([]);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    try {
      const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY;
      if (!rapidApiKey) throw new Error('Missing RapidAPI key');
      // Vérification préalable de l'existence du titre
      const exists = await checkTitleExists(title, platforms, rapidApiKey, showType, abortController.signal);
      if (!exists) {
        setError('The entered movie/series does not exist or is not found in the database.');
        setLoading(false);
        return;
      }
      const countriesRes = await fetch('/countries.json');
      const countries = await countriesRes.json();
      const countryCodes = Object.keys(countries);
      let found = null;
      for (const country of countryCodes) {
        setTestedCountries(prev => [...prev, country]);
        for (const platform of platforms) {
          const url = `https://streaming-availability.p.rapidapi.com/shows/search/title?title=${encodeURIComponent(title)}&country=${country}&output_language=en&provider=${platform}&show_type=${showType}`;
          const res = await fetch(url, {
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
            },
            signal: abortController.signal
          });
          if (res.status === 0) throw new Error('aborted');
          const data = await res.json();
          let shows = [];
          if (Array.isArray(data)) shows = data;
          else if (data.result) shows = data.result;
          else if (data.shows) shows = data.shows;
          const subOnly = shows.filter(show => isSubscriptionOnly(show, country, platform));
          if (subOnly.length > 0) {
            found = {
              country,
              countryName: countries[country],
              platform,
              data: subOnly
            };
            break;
          }
        }
        if (found) break;
      }
      if (found) {
        setResult(found);
      } else {
        setError('No availability found on the selected platforms (subscription only).');
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'aborted') {
        setError('Search cancelled.');
      } else {
        setError('Error during search or API request.');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ maxWidth: 500, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif', background: '#f6f8fa', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#2d3748', marginBottom: 32 }}>🌍 Where is it available?</h1>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
          {platformsList.map(p => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 500 }}>
              <input
                type="checkbox"
                value={p.id}
                checked={platforms.includes(p.id)}
                onChange={handlePlatformChange}
                style={{ accentColor: '#3182ce' }}
              />
              <span style={{ fontSize: 20 }}>{p.icon}</span> {p.name}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
            <input
              type="radio"
              name="showType"
              value="movie"
              checked={showType === 'movie'}
              onChange={() => setShowType('movie')}
              style={{ accentColor: '#3182ce' }}
            />
            Movie
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
            <input
              type="radio"
              name="showType"
              value="series"
              checked={showType === 'series'}
              onChange={() => setShowType('series')}
              style={{ accentColor: '#3182ce' }}
            />
            Series
          </label>
        </div>
        <input
          type="text"
          placeholder="Movie or series name"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ flex: 1, fontSize: 18, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none' }}
          required
        />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="submit" disabled={loading || !title.trim() || platforms.length === 0} style={{
            background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 18, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px #0001', transition: 'background 0.2s', flex: 1 }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
          {loading && (
            <button type="button" onClick={handleCancel} style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 18px', fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </form>
      {error && <p style={{ color: '#e53e3e', textAlign: 'center', fontWeight: 500 }}>{error}</p>}
      <div>
        {result && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginTop: 16, boxShadow: '0 2px 8px #0001', textAlign: 'center' }}>
            <h2 style={{ color: '#3182ce', marginBottom: 12 }}>🎉 Availability found!</h2>
            <div style={{ fontSize: 22, marginBottom: 8 }}>
              <span>{platformsList.find(p => p.id === result.platform)?.icon}</span> <strong>{platformsList.find(p => p.id === result.platform)?.name}</strong>
            </div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              <span role="img" aria-label="flag">🌐</span> <strong>{result.countryName} ({result.country.toUpperCase()})</strong>
            </div>
            <div style={{ fontSize: 17, marginBottom: 16 }}>
              <span style={{ color: '#2d3748' }}><strong>{title}</strong> is available here (subscription only)!</span>
            </div>
            <details style={{ textAlign: 'left', marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', color: '#3182ce', fontWeight: 500 }}>Show raw API response</summary>
              <pre style={{ background: '#f8f8f8', padding: 8, borderRadius: 4, fontSize: 13, overflowX: 'auto' }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
      {/* Mini console pays testés */}
      <div style={{ marginTop: 32, background: '#222', color: '#fff', borderRadius: 8, padding: 12, fontSize: 13, minHeight: 40, maxHeight: 120, overflowY: 'auto', boxShadow: '0 1px 4px #0003' }}>
        <strong>Tested countries:</strong>
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {testedCountries.length === 0 ? <span style={{ color: '#aaa' }}>None yet</span> :
            testedCountries.map((c, i) => <span key={c + i} style={{ background: '#444', borderRadius: 4, padding: '2px 8px' }}>{c.toUpperCase()}</span>)}
        </div>
      </div>
      <footer style={{ marginTop: 48, textAlign: 'center', color: '#a0aec0', fontSize: 14 }}>
        <span>Made with ❤️ – {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

export default App;
