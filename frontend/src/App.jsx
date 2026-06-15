import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, BarChart3, Users, AlertOctagon,
  FileText, Activity, ShieldAlert, Cpu, RefreshCw, Send,
  ArrowUpRight, Award, DollarSign, ShoppingCart, MessageSquare, ExternalLink
} from 'lucide-react';

const API_BASE_URL = 'https://sentiment-analysis-dashboard-wf9k.onrender.com/api';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Data States
  const [overviewData, setOverviewData] = useState(null);
  const [aspectProduct, setAspectProduct] = useState('noise_watch_5');
  const [aspectsData, setAspectsData] = useState(null);
  const [competitorCat, setCompetitorCat] = useState('smartwatch');
  const [competitorsData, setCompetitorsData] = useState(null);
  const [campaignsData, setCampaignsData] = useState([]);
  const [anomaliesData, setAnomaliesData] = useState([]);

  // Interactive Tools States
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [playgroundText, setPlaygroundText] = useState('');
  const [playgroundCat, setPlaygroundCat] = useState('smartwatch');
  const [playgroundResults, setPlaygroundResults] = useState(null);
  const [analyzingPlayground, setAnalyzingPlayground] = useState(false);

  // Fetch initial dashboard overview
  useEffect(() => {
    fetchOverview();
    fetchCampaigns();
    fetchAnomalies();

    // Start a timer for loading/waking up feedback
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    // If still loading after 3 seconds, mark as waking up
    const wakeUpTimeout = setTimeout(() => {
      setIsWakingUp(true);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(wakeUpTimeout);
    };
  }, []);

  // Fetch aspects when selected product changes
  useEffect(() => {
    fetchAspects();
  }, [aspectProduct]);

  // Fetch competitor comparison when category changes
  useEffect(() => {
    fetchCompetitors();
  }, [competitorCat]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/overview`);
      if (!res.ok) throw new Error('Failed to fetch overview metrics');
      const data = await res.json();
      setOverviewData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAspects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/aspects?product_id=${aspectProduct}`);
      if (!res.ok) throw new Error('Failed to fetch aspect sentiment');
      const data = await res.json();
      setAspectsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompetitors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/competitors?category=${competitorCat}`);
      if (!res.ok) throw new Error('Failed to fetch competitor metrics');
      const data = await res.json();
      setCompetitorsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/influencers`);
      if (!res.ok) throw new Error('Failed to fetch campaign metrics');
      const data = await res.json();
      setCampaignsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnomalies = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/anomalies`);
      if (!res.ok) throw new Error('Failed to fetch anomaly data');
      const data = await res.json();
      setAnomaliesData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const generateAIReport = async () => {
    try {
      setGeneratingReport(true);
      const res = await fetch(`${API_BASE_URL}/generate-report`);
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      setReportMarkdown(data.report);
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const runABSA = async (e) => {
    e.preventDefault();
    if (!playgroundText.trim()) return;
    try {
      setAnalyzingPlayground(true);
      const res = await fetch(`${API_BASE_URL}/analyze-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: playgroundText, category: playgroundCat })
      });
      if (!res.ok) throw new Error('Failed to run ABSA analysis');
      const data = await res.json();
      setPlaygroundResults(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setAnalyzingPlayground(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '24px', padding: '40px', textAlign: 'center', backgroundColor: 'var(--color-canvas-soft)' }}>
        <RefreshCw size={40} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p className="caption-mono" style={{ fontWeight: 600 }}>Loading Aura Engine metrics...</p>
          <p className="caption-mono" style={{ fontSize: '11px', color: 'var(--color-mute)' }}>Elapsed time: {elapsedSeconds}s</p>
        </div>
        
        {isWakingUp && (
          <div className="card-soft" style={{ maxWidth: '450px', border: '1px solid var(--color-hairline)', boxShadow: 'var(--shadow-level-2)', backgroundColor: 'var(--color-canvas)' }}>
            <span className="badge-secondary" style={{ marginBottom: '10px', backgroundColor: 'var(--color-warning-soft)', color: 'var(--color-warning-deep)' }}>
              Server Waking Up (Cold Start)
            </span>
            <p className="body-sm-strong" style={{ marginBottom: '8px' }}>
              The backend container is currently booting up.
            </p>
            <p className="body-sm" style={{ color: 'var(--color-body)', fontSize: '13px', lineHeight: 1.5 }}>
              <strong>Reason:</strong> Render's free hosting tier puts servers to sleep after 15 minutes of inactivity to save resources.
            </p>
            <p className="body-sm" style={{ color: 'var(--color-body)', fontSize: '13px', marginTop: '6px' }}>
              <strong>Expected time:</strong> 50 to 90 seconds. Please hold on, the dashboard will load automatically once ready!
            </p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <ShieldAlert size={50} style={{ color: 'var(--color-error)' }} />
        <h2 className="display-sm">Database Sync Failure</h2>
        <p className="body-sm">{error}</p>
        <button onClick={fetchOverview} className="btn-primary-sm flex-gap-sm">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Sticky header navbar */}
      <header className="flex-between" style={{
        height: '64px',
        padding: '0 var(--spacing-lg)',
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div className="flex-gap-md">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 22h4l6-12 6 12h4L12 2z" fill="var(--color-primary)" />
              <circle cx="12" cy="15" r="3" fill="var(--color-canvas)" stroke="var(--color-primary)" strokeWidth="1" />
            </svg>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '18px',
              letterSpacing: '-1px'
            }}>AURA</span>
            <span className="caption-mono" style={{ fontSize: '10px', marginLeft: '4px', border: '1px solid var(--color-hairline)', padding: '2px 6px', borderRadius: '4px' }}>BI-ENGINE v1.0</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'overview', label: 'BI Console', icon: <TrendingUp size={16} /> },
            { id: 'aspects', label: 'ABSA Hub', icon: <BarChart3 size={16} /> },
            { id: 'competitors', label: 'Competitors', icon: <Activity size={16} /> },
            { id: 'campaigns', label: 'Campaign ROI', icon: <Users size={16} /> },
            { id: 'anomalies', label: 'AI Alerts', icon: <AlertOctagon size={16} /> },
            { id: 'report', label: 'Report Generator', icon: <FileText size={16} /> },
            { id: 'playground', label: 'ABSA Playground', icon: <Cpu size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: activeTab === tab.id ? 'var(--color-ink)' : 'var(--color-body)',
                borderBottom: '2px solid',
                borderColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                backgroundColor: 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.icon}
              <span className="tab-label-text">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Hero Backdrop with Mesh Gradient */}
      <div className="hero-glow-container" style={{ padding: '32px 0 16px 0' }}>
        <div className="mesh-glow" />
        <div className="container">
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="caption-mono" style={{ marginBottom: '8px', color: 'var(--color-link-deep)' }}>
                Enablement & Brand Intelligence Dashboard
              </div>
              <h1 className="display-lg" style={{ marginBottom: '8px' }}>
                {activeTab === 'overview' && 'D2C Aspect-Based Sentiment & BI Console.'}
                {activeTab === 'aspects' && 'Aspect-Based Sentiment Hub.'}
                {activeTab === 'competitors' && 'Wearables Competitor Benchmarking Matrix.'}
                {activeTab === 'campaigns' && 'Influencer Campaign ROI Timeline.'}
                {activeTab === 'anomalies' && 'Anomaly & Sentiment Drop Alerts.'}
                {activeTab === 'report' && 'One-Click AI Business Briefing.'}
                {activeTab === 'playground' && 'Dynamic ABSA Playground Console.'}
              </h1>
              <p className="body-md">
                {activeTab === 'overview' && 'Correlate customer sentiment metrics side-by-side with weekly sales records, average pricing, and marketing spend.'}
                {activeTab === 'aspects' && 'Drill-down into product aspect performance. See direct customer review snippets tagged by aspect.'}
                {activeTab === 'competitors' && 'Compare aspect metrics of Noise products against key competitors boAt and Fire-Boltt.'}
                {activeTab === 'campaigns' && 'Evaluate marketing ROI by tracking units sold spikes directly overlapping launch events.'}
                {activeTab === 'anomalies' && 'Automatically scan ratings and aspect drops. Let Gemini formulate diagnostics and root-cause analysis.'}
                {activeTab === 'report' && 'Compile weekly executive briefings formatted in markdown, written autonomously by Gemini using raw BI datasets.'}
                {activeTab === 'playground' && 'Paste any raw customer review paragraph to run live Aspect-Based Sentiment Extraction.'}
              </p>
            </div>
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={fetchOverview} className="btn-secondary-sm flex-gap-sm">
                  <RefreshCw size={14} /> Sync DB
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <main style={{ flex: 1, padding: '32px 0' }}>
        <div className="container">

          {/* TAB 1: BI OVERVIEW CONSOLE */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Metric Cards Row */}
              <div className="grid-3">
                {overviewData?.brand_metrics.map(brand => (
                  <div key={brand.brand} className="card-marketing-large" style={{ position: 'relative' }}>
                    <div className="caption-mono" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{brand.brand.toUpperCase()}</span>
                      <span className="badge-success">{brand.market_share}% Share</span>
                    </div>
                    <h2 className="display-lg" style={{ margin: '12px 0 6px 0', fontSize: '36px' }}>
                      ₹{((brand.total_revenue) / 100000).toFixed(1)}L
                    </h2>
                    <div className="flex-between">
                      <span className="body-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShoppingCart size={14} /> {brand.total_units.toLocaleString()} Units
                      </span>
                      <span className="body-sm" style={{ color: 'var(--color-mute)' }}>
                        Spend: ₹{(brand.total_spend / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                {/* Sales Units Trend Line Chart */}
                <div className="card-marketing" style={{ minHeight: '400px' }}>
                  <h3 className="display-sm" style={{ marginBottom: '20px' }}>Units Sold Over Time</h3>
                  <div style={{ width: '100%', height: '320px' }}>
                    <ResponsiveContainer>
                      <AreaChart data={overviewData?.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="noise_gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#171717" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#171717" stopOpacity={0.01} />
                          </linearGradient>
                          <linearGradient id="boat_gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7928ca" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#7928ca" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-hairline-strong)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="var(--color-hairline-strong)" />
                        <Tooltip contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid var(--color-hairline)' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area type="monotone" name="Noise Watch 5" dataKey="noise_watch_5_units" stroke="#171717" strokeWidth={2} fillOpacity={1} fill="url(#noise_gradient)" />
                        <Area type="monotone" name="boAt Wave Sigma" dataKey="boat_wave_sigma_units" stroke="#7928ca" strokeWidth={2} fillOpacity={1} fill="url(#boat_gradient)" />
                        <Area type="monotone" name="Fire-Boltt Gladiator" dataKey="fireboltt_gladiator_units" stroke="#ff4d4d" strokeWidth={2} fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Market Share Drift Area Chart */}
                <div className="card-marketing" style={{ minHeight: '400px' }}>
                  <h3 className="display-sm" style={{ marginBottom: '20px' }}>Market Share Drift %</h3>
                  <div style={{ width: '100%', height: '320px' }}>
                    <ResponsiveContainer>
                      <AreaChart data={overviewData?.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-hairline-strong)" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--color-hairline-strong)" />
                        <Tooltip contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid var(--color-hairline)' }} />
                        <Legend verticalAlign="top" height={36} iconType="square" />
                        <Area type="monotone" name="Noise Share" dataKey="Noise_share" stackId="1" stroke="#171717" fill="#171717" fillOpacity={0.8} />
                        <Area type="monotone" name="boAt Share" dataKey="boAt_share" stackId="1" stroke="#7928ca" fill="#7928ca" fillOpacity={0.6} />
                        <Area type="monotone" name="Fire-Boltt Share" dataKey="Fire-Boltt_share" stackId="1" stroke="#ff4d4d" fill="#ff4d4d" fillOpacity={0.4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Product Analytics Table */}
              <div className="card-marketing">
                <h3 className="display-sm" style={{ marginBottom: '20px' }}>Product-by-Product BI Breakdown</h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Brand</th>
                        <th>Category</th>
                        <th>Units Sold</th>
                        <th>Gross Revenue</th>
                        <th>Avg Rating</th>
                        <th>Review Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewData?.products.map(p => (
                        <tr key={p.id}>
                          <td className="body-sm-strong">{p.name}</td>
                          <td><span className="badge-secondary">{p.brand}</span></td>
                          <td>{p.category.toUpperCase()}</td>
                          <td>{p.units_sold.toLocaleString()} units</td>
                          <td style={{ fontWeight: 500 }}>₹{p.revenue.toLocaleString()}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: p.avg_rating >= 4.0 ? 'var(--color-success)' : p.avg_rating >= 3.5 ? 'var(--color-warning)' : 'var(--color-error)'
                              }} />
                              {p.avg_rating} / 5.0
                            </div>
                          </td>
                          <td style={{ color: 'var(--color-mute)' }}>{p.review_count} reviews</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASPECT-BASED SENTIMENT ANALYSIS HUB */}
          {activeTab === 'aspects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* Product Filter Row */}
              <div className="flex-between">
                <div style={{ display: 'flex', gap: '8px' }}>
                  {overviewData?.products.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setAspectProduct(p.id)}
                      className={aspectProduct === p.id ? 'btn-primary-sm' : 'btn-secondary-sm'}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="caption-mono">Showing Aspect Analytics</div>
              </div>

              {/* Core metrics breakdown */}
              {aspectsData ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>

                  {/* Aspect Sentiment Ratio Bar Charts */}
                  <div className="card-marketing">
                    <h3 className="display-sm" style={{ marginBottom: '24px' }}>Aspect-Sentiment Profiles</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {aspectsData.aspects.map(asp => (
                        <div key={asp.aspect} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div className="flex-between">
                            <span className="body-sm-strong">{asp.aspect}</span>
                            <span className="caption-mono" style={{ fontSize: '11px' }}>{asp.positive}% Positive ({asp.count} mentions)</span>
                          </div>
                          <div style={{
                            height: '14px',
                            width: '100%',
                            backgroundColor: 'var(--color-canvas-soft-2)',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            display: 'flex'
                          }}>
                            <div style={{ width: `${asp.positive}%`, backgroundColor: '#10b981', height: '100%' }} title="Positive" />
                            <div style={{ width: `${asp.neutral}%`, backgroundColor: '#d1d5db', height: '100%' }} title="Neutral" />
                            <div style={{ width: `${asp.negative}%`, backgroundColor: '#ef4444', height: '100%' }} title="Negative" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Review Snippets Drill-down */}
                  <div className="card-marketing" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <h3 className="display-sm">Aspect Review Snippets</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                      {aspectsData.aspects.map(asp => {
                        const lowAsp = asp.aspect.toLowerCase();
                        const pSnippets = aspectsData.snippets[lowAsp]?.positive || [];
                        const nSnippets = aspectsData.snippets[lowAsp]?.negative || [];

                        return (
                          <div key={asp.aspect} style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: '16px' }}>
                            <div className="caption-mono" style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '10px' }}>
                              {asp.aspect} Tagged Quotes
                            </div>

                            {/* Positives */}
                            {pSnippets.length > 0 && (
                              <div style={{ marginBottom: '10px' }}>
                                <div className="body-sm" style={{ color: '#10b981', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  Positive Snippets
                                </div>
                                {pSnippets.map((s, idx) => (
                                  <div key={idx} style={{
                                    borderLeft: '2px solid #10b981',
                                    paddingLeft: '10px',
                                    margin: '6px 0',
                                    fontStyle: 'italic',
                                    fontSize: '13px',
                                    color: 'var(--color-body)'
                                  }}>
                                    "{s.snippet}" <span style={{ fontSize: '11px', color: 'var(--color-mute)' }}>— {s.author} ({s.date})</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Negatives */}
                            {nSnippets.length > 0 && (
                              <div>
                                <div className="body-sm" style={{ color: '#ef4444', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  Negative Snippets
                                </div>
                                {nSnippets.map((s, idx) => (
                                  <div key={idx} style={{
                                    borderLeft: '2px solid #ef4444',
                                    paddingLeft: '10px',
                                    margin: '6px 0',
                                    fontStyle: 'italic',
                                    fontSize: '13px',
                                    color: 'var(--color-body)'
                                  }}>
                                    "{s.snippet}" <span style={{ fontSize: '11px', color: 'var(--color-mute)' }}>— {s.author} ({s.date})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="caption-mono">Select a product above to load aspect breakdowns.</p>
              )}
            </div>
          )}

          {/* TAB 3: COMPETITOR BENCHMARKING MATRIX */}
          {activeTab === 'competitors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* Category selector */}
              <div className="flex-between">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setCompetitorCat('smartwatch')}
                    className={competitorCat === 'smartwatch' ? 'btn-primary-sm' : 'btn-secondary-sm'}
                  >
                    Smartwatches (Noise vs boAt vs Fire-Boltt)
                  </button>
                  <button
                    onClick={() => setCompetitorCat('audio')}
                    className={competitorCat === 'audio' ? 'btn-primary-sm' : 'btn-secondary-sm'}
                  >
                    Audio / TWS (Noise vs boAt)
                  </button>
                </div>
                <div className="caption-mono">Matrix compares positive aspect sentiments %</div>
              </div>

              {/* Competitor Radar and Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* Recharts Radar Chart */}
                <div className="card-marketing" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '420px' }}>
                  <h3 className="display-sm" style={{ alignSelf: 'flex-start', marginBottom: '20px' }}>Aspect Comparison Radar</h3>
                  <div style={{ width: '100%', height: '320px', display: 'flex', justifyContent: 'center' }}>
                    {competitorsData && (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={competitorsData}>
                          <PolarGrid stroke="var(--color-hairline)" />
                          <PolarAngleAxis dataKey="aspect" tick={{ fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Noise" dataKey="Noise" stroke="#171717" fill="#171717" fillOpacity={0.1} strokeWidth={2} />
                          <Radar name="boAt" dataKey="boAt" stroke="#7928ca" fill="#7928ca" fillOpacity={0.1} strokeWidth={2} />
                          {competitorCat === 'smartwatch' && (
                            <Radar name="Fire-Boltt" dataKey="Fire-Boltt" stroke="#ff4d4d" fill="#ff4d4d" fillOpacity={0.1} strokeWidth={2} />
                          )}
                          <Legend verticalAlign="top" height={36} />
                          <Tooltip contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid var(--color-hairline)' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Head-to-Head Comparison Table Grid */}
                <div className="card-marketing" style={{ minHeight: '420px' }}>
                  <h3 className="display-sm" style={{ marginBottom: '20px' }}>Aspect Grid Scorecard (% Positive Sentiment)</h3>

                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Dimension</th>
                          <th style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Noise Score</th>
                          <th style={{ color: '#7928ca', fontWeight: 600 }}>boAt Score</th>
                          {competitorCat === 'smartwatch' && (
                            <th style={{ color: '#ff4d4d', fontWeight: 600 }}>Fire-Boltt Score</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {competitorsData?.map(row => (
                          <tr key={row.aspect}>
                            <td className="body-sm-strong">{row.aspect}</td>
                            <td style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                              {row.Noise}%
                            </td>
                            <td style={{ color: '#7928ca' }}>
                              {row.boAt}%
                            </td>
                            {competitorCat === 'smartwatch' && (
                              <td style={{ color: '#ff4d4d' }}>
                                {row['Fire-Boltt']}%
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '20px' }} className="card-soft">
                    <span className="caption-mono" style={{ display: 'block', marginBottom: '8px', color: 'var(--color-primary)' }}>
                      AI Competitor Takeaway
                    </span>
                    <p className="body-sm">
                      {competitorCat === 'smartwatch' ? (
                        <>
                          <strong>Noise ColorFit Pro 5</strong> leads significantly in <strong>Strap Quality</strong> (88% positive vs. boAt's 68%) and displays high ratings on <strong>Sensors</strong> accuracy. However, competitor boAt shows highly competitive pricing options.
                        </>
                      ) : (
                        <>
                          <strong>Noise Buds VS104</strong> shows superior scores in <strong>Battery Life</strong> and <strong>Comfort</strong>, while boAt Airdopes 141 leads in <strong>Sound/Bass Profile</strong> positive mentions.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INFLUENCER CAMPAIGN ROI TIMELINE */}
          {activeTab === 'campaigns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="card-marketing">
                <h3 className="display-sm" style={{ marginBottom: '24px' }}>Influencer Campaign ROI Matrix</h3>

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Influencer</th>
                        <th>Product Target</th>
                        <th>Platform</th>
                        <th>Followers Reach</th>
                        <th>Campaign Cost</th>
                        <th>Gross Revenue Bump</th>
                        <th>ROI %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignsData.map(c => {
                        const isHighROI = c.roi >= 100;
                        const isNegROI = c.roi < 0;
                        return (
                          <tr key={c.id}>
                            <td className="caption-mono">{c.date}</td>
                            <td className="body-sm-strong">{c.influencer_name}</td>
                            <td>{c.product_name}</td>
                            <td>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 500,
                                backgroundColor: c.platform === 'YouTube' ? '#fee2e2' : '#f3e8ff',
                                color: c.platform === 'YouTube' ? '#dc2626' : '#7c3aed'
                              }}>
                                {c.platform}
                              </span>
                            </td>
                            <td>{(c.reach / 1000000).toFixed(1)}M</td>
                            <td>₹{c.cost.toLocaleString()}</td>
                            <td style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                              ₹{c.revenue_bump.toLocaleString()}
                            </td>
                            <td>
                              <span className={isHighROI ? 'badge-success' : isNegROI ? 'badge-error' : 'badge-secondary'}>
                                {c.roi}% ROI
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chart mapping Campaign Spend vs Revenue Bump */}
              <div className="card-marketing" style={{ minHeight: '380px' }}>
                <h3 className="display-sm" style={{ marginBottom: '24px' }}>Campaign Cost vs Revenue Impact Correlation</h3>
                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer>
                    <BarChart data={campaignsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                      <XAxis dataKey="influencer_name" tick={{ fontSize: 11 }} stroke="var(--color-hairline-strong)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--color-hairline-strong)" />
                      <Tooltip contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid var(--color-hairline)' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar name="Campaign Spend (INR)" dataKey="cost" fill="#7928ca" radius={[4, 4, 0, 0]} />
                      <Bar name="Revenue Spike generated" dataKey="revenue_bump" fill="#171717" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI ANOMALIES & ALERTS */}
          {activeTab === 'anomalies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* Trigger Notification Alert if active */}
              {anomaliesData.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: 'var(--color-warning-soft)',
                  border: '1px solid var(--color-warning)',
                  padding: '16px var(--spacing-lg)',
                  borderRadius: '8px',
                }}>
                  <AlertOctagon style={{ color: 'var(--color-warning-deep)' }} size={24} />
                  <div>
                    <h4 className="body-md-strong" style={{ color: 'var(--color-warning-deep)' }}>
                      Active Aspect Sentiments Drop Detected
                    </h4>
                    <p className="body-sm" style={{ color: 'var(--color-warning-deep)' }}>
                      There are {anomaliesData.length} flagged weeks where a product aspect sentiment fell below the critical benchmark of 45% positive.
                    </p>
                  </div>
                </div>
              )}

              {/* Loop through detected anomalies */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {anomaliesData.map((a, idx) => (
                  <div key={idx} className="card-marketing-large" style={{ borderLeft: '4px solid var(--color-error)' }}>
                    <div className="flex-between" style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div>
                        <span className="badge-error" style={{ marginRight: '10px' }}>
                          Sentiment Dip: {a.positive_percentage}% Positive
                        </span>
                        <span className="body-sm-strong">{a.product_name}</span>
                        <span className="body-sm" style={{ color: 'var(--color-mute)' }}> — {a.aspect.toUpperCase()} aspect</span>
                      </div>
                      <span className="caption-mono">Week of {a.week}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
                      {/* AI diagnosis */}
                      <div className="card-soft" style={{ backgroundColor: 'var(--color-canvas-soft-2)' }}>
                        <div className="caption-mono" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '12px' }}>
                          <Cpu size={14} /> Gemini Root Cause Analysis
                        </div>

                        <div style={{ fontSize: '14px', lineHeight: 1.6 }} className="markdown-body">
                          {a.diagnostic_report.split('\n').map((line, lidx) => {
                            if (line.startsWith('###')) {
                              return <h4 key={lidx} style={{ margin: '14px 0 6px 0', fontWeight: 600 }}>{line.replace('###', '')}</h4>;
                            }
                            if (line.startsWith('**') || line.includes('**')) {
                              // basic parse bold
                              return <p key={lidx} style={{ margin: '6px 0' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
                            }
                            return <p key={lidx} style={{ margin: '6px 0' }}>{line}</p>;
                          })}
                        </div>
                      </div>

                      {/* Anomaly Metrics */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                        <div style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: '8px' }}>
                          <span className="caption-mono" style={{ display: 'block' }}>Mentions in Week</span>
                          <span className="body-lg" style={{ fontWeight: 600 }}>{a.total_reviews} customer reviews</span>
                        </div>
                        <div>
                          <span className="caption-mono" style={{ display: 'block' }}>Trigger Rule</span>
                          <span className="body-sm">Flagged: Positive Sentiment &lt; 45% during week window</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: AI BUSINESS REPORT GENERATOR */}
          {activeTab === 'report' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card-marketing">
                <div className="flex-between" style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <div>
                    <h3 className="display-sm">Automated BI Executive Summaries</h3>
                    <p className="body-sm">Generates structured business summaries summarizing recent brand performance, competitor alerts, and influencer ROI.</p>
                  </div>
                  <button
                    onClick={generateAIReport}
                    disabled={generatingReport}
                    className="btn-primary flex-gap-sm"
                  >
                    {generatingReport ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Analyzing raw metrics...
                      </>
                    ) : (
                      <>
                        <Cpu size={16} /> Generate BI Report
                      </>
                    )}
                  </button>
                </div>

                {/* Report Viewer */}
                {reportMarkdown ? (
                  <div className="print-report-container" style={{
                    backgroundColor: 'var(--color-canvas-soft-2)',
                    padding: '32px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-hairline)',
                    maxWidth: '900px',
                    margin: '0 auto'
                  }}>
                    <div className="print-exclude" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                      <button onClick={() => window.print()} className="btn-secondary-sm flex-gap-sm">
                        Print / Save PDF
                      </button>
                    </div>

                    {/* Render basic markdown */}
                    <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                      {reportMarkdown.split('\n').map((line, idx) => {
                        if (line.startsWith('# ')) {
                          return <h1 key={idx} className="display-md" style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: '8px', margin: '24px 0 12px 0' }}>{line.replace('# ', '')}</h1>;
                        }
                        if (line.startsWith('## ')) {
                          return <h2 key={idx} className="display-sm" style={{ margin: '20px 0 10px 0' }}>{line.replace('## ', '')}</h2>;
                        }
                        if (line.startsWith('### ')) {
                          return <h3 key={idx} className="body-md-strong" style={{ margin: '14px 0 6px 0' }}>{line.replace('### ', '')}</h3>;
                        }
                        if (line.startsWith('- ')) {
                          return <li key={idx} style={{ marginLeft: '20px', listStyleType: 'disc', margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
                        }
                        return <p key={idx} style={{ margin: '10px 0' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '80px 0',
                    textAlign: 'center',
                    border: '1px dashed var(--color-hairline-strong)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-canvas-soft)'
                  }}>
                    <FileText size={48} style={{ color: 'var(--color-mute)', marginBottom: '16px' }} />
                    <h4 className="body-md-strong">No report generated yet</h4>
                    <p className="body-sm" style={{ marginBottom: '20px' }}>Click the button above to have Gemini compile the latest metrics into an executive PDF-ready briefing.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: INTERACTIVE ABSA PLAYGROUND */}
          {activeTab === 'playground' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

              {/* Play Input */}
              <div className="card-marketing">
                <h3 className="display-sm" style={{ marginBottom: '16px' }}>Input Review Paragraph</h3>
                <form onSubmit={runABSA} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label className="caption-mono">Product Domain</label>
                      <select
                        value={playgroundCat}
                        onChange={(e) => setPlaygroundCat(e.target.value)}
                        className="form-input form-select"
                      >
                        <option value="smartwatch">Smartwatch (Extract: battery, display, strap, connectivity, sensors, price)</option>
                        <option value="audio">Audio / Headphones (Extract: sound, battery, connectivity, mic, comfort, price)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="caption-mono">Review Text</label>
                    <textarea
                      value={playgroundText}
                      onChange={(e) => setPlaygroundText(e.target.value)}
                      placeholder="e.g., The display is really bright and sharp, and battery easily lasts 5 days. However, the strap is highly uncomfortable and broke in the first week."
                      rows={6}
                      className="form-input"
                      style={{ height: 'auto', padding: '12px', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={analyzingPlayground || !playgroundText.trim()}
                    className="btn-primary flex-gap-md"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {analyzingPlayground ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Processing AI tags...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Analyze Review
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* ABSA Results Display */}
              <div className="card-marketing" style={{ minHeight: '380px' }}>
                <h3 className="display-sm" style={{ marginBottom: '20px' }}>Extracted Aspect Sentiments</h3>

                {playgroundResults ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {playgroundResults.length > 0 ? (
                      playgroundResults.map((r, idx) => (
                        <div key={idx} className="card-soft" style={{
                          borderLeft: '4px solid',
                          borderColor: r.sentiment === 'positive' ? '#10b981' : r.sentiment === 'negative' ? '#ef4444' : '#d1d5db'
                        }}>
                          <div className="flex-between" style={{ marginBottom: '8px' }}>
                            <span className="body-sm-strong" style={{ textTransform: 'capitalize' }}>
                              {r.aspect}
                            </span>
                            <span className={r.sentiment === 'positive' ? 'badge-success' : r.sentiment === 'negative' ? 'badge-error' : 'badge-secondary'}>
                              {r.sentiment.toUpperCase()}
                            </span>
                          </div>
                          <p className="body-sm" style={{ fontStyle: 'italic' }}>
                            "{r.snippet}"
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="body-sm">No aspects detected. Try entering descriptive sentences referencing aspects like battery, strap, mic, sound, or display.</p>
                    )}
                  </div>
                ) : (
                  <div style={{
                    padding: '80px 0',
                    textAlign: 'center',
                    border: '1px dashed var(--color-hairline-strong)',
                    borderRadius: '8px',
                    height: 'calc(100% - 60px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Cpu size={40} style={{ color: 'var(--color-mute)', marginBottom: '16px' }} />
                    <p className="body-sm">Submit your review text in the left panel to display ABSA classification.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Simple footer */}
      <footer style={{
        backgroundColor: 'var(--color-canvas)',
        borderTop: '1px solid var(--color-hairline)',
        padding: '24px 0',
        marginTop: 'auto'
      }}>
        <div className="container flex-between">
          <span className="caption-mono">Aura Brand Intelligence Platform</span>
          <span className="caption-mono" style={{ textTransform: 'none' }}>Designed in compliance with Noise JD.</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
