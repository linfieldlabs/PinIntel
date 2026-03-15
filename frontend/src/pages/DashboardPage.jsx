import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SAMPLE_DATA } from '../data/sampleReport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import {
  Download, AlertTriangle, TrendingUp, Target, Zap, Search,
  CheckCircle, Clock, BarChart2, Star, ArrowRight, ChevronDown,
  ChevronUp, Info, Award, Lightbulb, Brain, BookOpen
} from 'lucide-react';

// ─── Color helpers ─────────────────────────────────────────────────────────────
const scoreColor = (score) => {
  if (score >= 70) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', ring: '#10b981' };
  if (score >= 45) return { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   ring: '#f59e0b' };
  return               { text: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   ring: '#f43f5e' };
};

const levelIcon = (color) => {
  if (color === 'green')  return <span className="text-emerald-400">🟢</span>;
  if (color === 'yellow') return <span className="text-amber-400">🟡</span>;
  return                         <span className="text-rose-400">🔴</span>;
};

const impactBadge = (impact) => {
  const styles = {
    High:   'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    Medium: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    Low:    'bg-slate-700 text-slate-300 border border-slate-600'
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[impact] || styles.Low}`}>{impact}</span>;
};

const effortBadge = (effort) => {
  const styles = {
    High:   'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    Medium: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    Low:    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[effort] || styles.Low}`}>{effort}</span>;
};

// ─── Card wrapper ──────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-[#1e293b] border border-slate-700/60 rounded-2xl ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, iconColor = 'text-primary', title, subtitle }) => (
  <div className="p-6 pb-0">
    <div className="flex items-center gap-3 mb-1">
      {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      <h2 className="text-lg font-bold text-white">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-400 ml-8">{subtitle}</p>}
  </div>
);

// ─── Score Ring ──────────────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 96 }) => {
  const c = scoreColor(score);
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#334155" strokeWidth="8"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c.ring} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${size >= 100 ? 'text-2xl' : 'text-lg'} ${c.text}`}>{score}</span>
      </div>
    </div>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ value, color }) => (
  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
    <div className={`h-full rounded-full transition-all duration-1000`}
      style={{ width: `${value}%`, backgroundColor: color }} />
  </div>
);

// ─── Expandable row for fixes ─────────────────────────────────────────────────
const FixRow = ({ fix, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 hover:bg-slate-700/30 transition-colors text-left"
      >
        <span className="w-7 h-7 rounded-lg bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
          #{fix.rank}
        </span>
        <span className="flex-1 text-sm text-slate-200">{fix.fix}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {impactBadge(fix.impact)}
          {effortBadge(fix.effort)}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 ml-11 space-y-2 text-sm">
          {fix.rationale && (
            <p className="text-slate-400 text-xs leading-relaxed">
              <span className="text-slate-300 font-medium">Why: </span>{fix.rationale}
            </p>
          )}
          {fix.example && (
            <div className="bg-slate-800/60 rounded-lg p-3 text-xs text-slate-300 font-mono whitespace-pre-line border border-slate-700/40">
              {fix.example}
            </div>
          )}
          {fix.boardName && (
            <p className="text-xs text-slate-500">Board: <span className="text-slate-300">{fix.boardName}</span></p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id === 'sample') {
      setResults(SAMPLE_DATA);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      try {
        const response = await axios.get(`/api/analysis/${id}/results`);
        setResults(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load results');
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  const handleExport = async () => {
    try {
      const response = await axios.get(`/api/analysis/${id}/export/csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pinterest-analysis-${id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"/>
          <p className="text-slate-400 text-sm">Loading your intelligence report…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-rose-400 text-lg">{error}</p>
          <button onClick={() => navigate('/setup')}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors">
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  const { intelligence, scores, leaderboard, brandProfile, competitorProfiles, keywords } = results;
  const {
    weaknessSummary, priorityFixes, keywordGap, boardQuality,
    contentFormatGap, postingConsistency, engagementBenchmark,
    metadataQuality, opportunityTopics, brandScore
  } = intelligence;

  const brandRank = leaderboard.find(item => item.isBrand);

  // Chart colors
  const FORMAT_COLORS = ['#1152d4', '#10b981', '#f59e0b'];
  const formatDataBrand = [
    { name: 'Image Pins', value: contentFormatGap?.brand?.imagePins || 0 },
    { name: 'Idea Pins', value: contentFormatGap?.brand?.ideaPins || 0 },
    { name: 'Video Pins', value: contentFormatGap?.brand?.videoPins || 0 }
  ];
  const formatDataComp = [
    { name: 'Image Pins', value: contentFormatGap?.competitors?.imagePins || 0 },
    { name: 'Idea Pins', value: contentFormatGap?.competitors?.ideaPins || 0 },
    { name: 'Video Pins', value: contentFormatGap?.competitors?.videoPins || 0 }
  ];

  const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-3 text-sm shadow-xl">
          <p className="text-slate-300 font-semibold mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.fill || p.color }} className="font-bold">
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0f172a] text-slate-200 min-h-screen">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-[#1e293b]/70 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <div className="w-5 h-5 border-[3px] border-white rounded-full"/>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white italic">
              PinIntel <span className="text-primary italic">Pro</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
              Analyzed: {new Date(results.analyzedAt).toLocaleDateString()}
            </div>
            <button onClick={handleExport}
              className="bg-primary hover:bg-blue-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
              <Download className="w-4 h-4"/>
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ══════════════════════════════════════════════════════════
            FEATURE 10 — Brand Score Dashboard (Hero)
        ══════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-primary"/>
            <h2 className="text-xl font-bold">Pinterest Health Score</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Main health score */}
            <Card className="p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#1e293b] to-[#162032]">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Overall Health</p>
              <ScoreRing score={brandScore.healthScore} size={110} />
              <div className="mt-3 text-center">
                <div className="flex items-center justify-center gap-2 mt-2">
                  {levelIcon(brandScore.level.color)}
                  <span className={`text-sm font-bold ${scoreColor(brandScore.healthScore).text}`}>
                    {brandScore.level.label}
                  </span>
                </div>
              </div>
            </Card>

            {/* 5 breakdown scores */}
            {Object.values(brandScore.breakdown).map((metric) => {
              const c = scoreColor(metric.score);
              return (
                <Card key={metric.label} className={`p-5 border transition-all hover:scale-[1.02] ${c.border} ${c.bg}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest truncate">{metric.label}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">{metric.description}</p>
                    </div>
                    <span className={`text-2xl font-black ${c.text} ml-2`}>{metric.score}</span>
                  </div>
                  <ProgressBar value={metric.score} color={c.ring} />
                </Card>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            FEATURE 1 — Smart Weakness Summary
        ══════════════════════════════════════════════════════════ */}
        <Card className="p-6 border-l-4 border-amber-500 bg-amber-500/5">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0"/>
            <h2 className="text-lg font-bold">AI Diagnosis — Core Weaknesses</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Based on your board data, here's what's holding back your Pinterest visibility for Generative Engines:
          </p>
          <ul className="space-y-3">
            {(weaknessSummary || []).map((w, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0"/>
                {w}
              </li>
            ))}
          </ul>
        </Card>

        {/* ══════════════════════════════════════════════════════════
            FEATURE 2 — Priority Fix Ranking
        ══════════════════════════════════════════════════════════ */}
        <section>
          <CardHeader icon={Zap} iconColor="text-primary" title="Priority-Based Fix Ranking"
            subtitle="Sorted by Impact × Effort — tackle these in order for fastest results"/>
          <div className="mt-4 space-y-2">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-1">Rank</div>
              <div className="col-span-7">Fix</div>
              <div className="col-span-2 text-center">Impact</div>
              <div className="col-span-2 text-center">Effort</div>
            </div>
            {priorityFixes?.slice(0, 8).map((fix) => (
              <FixRow key={fix.rank} fix={fix} index={fix.rank} />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-3 h-3"/>
            Click any row to see the detailed rationale and example fix
          </p>
        </section>

        {/* ══════════════════════════════════════════════════════════
            FEATURE 7 — Engagement Benchmark
        ══════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader icon={BarChart2} title="Engagement Benchmark"
            subtitle="Calculated average saves per pin — brand vs market strategy standards"/>
          <div className="p-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="col-span-2">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={engagementBenchmark?.chartData || []} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CUSTOM_TOOLTIP />}/>
                    <Bar dataKey="avgSaves" name="Avg Saves/Pin" radius={[6,6,0,0]}>
                      {(engagementBenchmark?.chartData || []).map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Your Brand</p>
                  <p className="text-4xl font-black text-primary">{engagementBenchmark?.brandAvgSaves || 0}</p>
                  <p className="text-xs text-slate-500">avg saves per pin</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Competitor Avg</p>
                  <p className="text-4xl font-black text-slate-300">{engagementBenchmark?.competitorAvgSaves || 0}</p>
                  <p className="text-xs text-slate-500">avg saves per pin</p>
                </div>
                {(engagementBenchmark?.gap || 0) > 0 ? (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                    <p className="text-xs text-rose-400 font-semibold">Gap: {engagementBenchmark?.gapPercentage}% below average</p>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-xs text-emerald-400 font-semibold">You're outperforming competitors!</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4 text-sm text-slate-300 border border-slate-700/40 flex items-start gap-3">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5"/>
              {engagementBenchmark?.insight}
            </div>
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════════════
            ROW: Keyword Gap + Content Format Gap
        ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Feature 3 — Keyword Gap */}
          <Card>
            <CardHeader icon={Search} title="GEO Keyword Gap Analysis"
              subtitle="Keywords competitors use that your brand is missing for Generative Search"/>
            <div className="p-6 pt-4 space-y-3">
              {keywordGap.missingKeywords.length === 0 ? (
                <div className="flex items-center gap-3 text-emerald-400 text-sm">
                  <CheckCircle className="w-5 h-5"/>
                  No major keyword gaps detected! Great coverage.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Target keywords covered: <span className="text-slate-300 font-semibold">{keywordGap.brandKeywordCount}/{keywordGap.totalTargetKeywords}</span></span>
                  </div>
                  {keywordGap.missingKeywords.map((kw, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/40 hover:border-rose-500/30 transition-colors group">
                      <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">"{kw.keyword}"</p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-snug">{kw.recommendation}</p>
                        {kw.competitorUsage && (
                          <span className="text-[10px] text-rose-400/70 mt-1 inline-block">
                            Used {kw.competitorUsage}× by competitors
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>

          {/* Feature 5 — Content Format Gap */}
          <Card>
            <CardHeader icon={TrendingUp} title="Strategic Format Mix"
              subtitle="AI-Predicted pin format distribution — based on market strategy & authority"/>
            <div className="p-6 pt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Brand */}
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Predicted Mix (You)</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={formatDataBrand} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                        dataKey="value" stroke="none">
                        {formatDataBrand.map((_, i) => <Cell key={i} fill={FORMAT_COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<CUSTOM_TOOLTIP />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-1">
                    {formatDataBrand.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: FORMAT_COLORS[i] }}/>
                          <span className="text-slate-400">{d.name}</span>
                        </div>
                        <span className="text-slate-300 font-semibold">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Competitors */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Strategic Target (Comps)</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={formatDataComp} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                        dataKey="value" stroke="none">
                        {formatDataComp.map((_, i) => <Cell key={i} fill={FORMAT_COLORS[i]} opacity={0.7} />)}
                      </Pie>
                      <Tooltip content={<CUSTOM_TOOLTIP />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-1">
                    {formatDataComp.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: FORMAT_COLORS[i] }}/>
                          <span className="text-slate-400">{d.name}</span>
                        </div>
                        <span className="text-slate-300 font-semibold">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-700/40">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Recommendations</p>
                {(contentFormatGap?.recommendations || []).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 leading-snug">
                    <ArrowRight className="w-3 h-3 text-primary flex-shrink-0 mt-0.5"/>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ROW: Posting Consistency + Competitive Leaderboard
        ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Feature 6 — Posting Consistency */}
          <Card>
            <CardHeader icon={Clock} title="Posting Consistency"
              subtitle="AI-Predicted posting frequency and strategic gap analysis"/>
            <div className="p-6 pt-4">
              <div className="flex items-center gap-6 mb-6">
                <ScoreRing score={postingConsistency.consistencyScore} size={88} />
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Status</p>
                    <p className={`text-lg font-bold ${scoreColor(postingConsistency.consistencyScore).text}`}>
                      {postingConsistency.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Estimated frequency</p>
                    <p className="text-base font-semibold text-white">
                      ~{postingConsistency.estimatedWeeklyPins} pins/week
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Total Pins</p>
                    <p className="text-xl font-bold text-white">{postingConsistency?.totalPins || 0}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Recommended</p>
                    <p className="text-xl font-bold text-emerald-400">{postingConsistency?.recommendedWeeklyPins || 15}/week</p>
                  </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0"/>
                    <p className="text-sm text-slate-300 leading-relaxed">{postingConsistency?.recommendation}</p>
                  </div>
                </div>

                {(postingConsistency?.schedule || []).length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Suggested posting days:</p>
                    <div className="flex gap-2">
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => {
                        const active = postingConsistency.schedule.some(s => s.startsWith(day.slice(0, 3)));
                        return (
                          <div key={day} className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            active ? 'bg-primary text-white' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Competitive Leaderboard (existing feature, enhanced) */}
          <Card>
            <CardHeader icon={Award} title="Competitive Leaderboard"
              subtitle="Monthly engagement ranking vs competitors"/>
            <div className="p-6 pt-4">
              <div className="space-y-3">
                {leaderboard.map((item, index) => {
                  const isFirst = index === 0;
                  return (
                    <div key={index}
                      onClick={() => item.url && window.open(item.url, '_blank')}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer ${
                        item.isBrand ? 'bg-primary/10 border border-primary/30' : 'bg-slate-800/40 hover:bg-slate-800/60'
                      }`}>
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isFirst ? 'bg-amber-500 text-black' :
                        index === 1 ? 'bg-slate-400 text-black' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        #{item.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${item.isBrand ? 'text-primary' : 'text-slate-200'}`}>
                          {item.name} {item.isBrand && <span className="text-xs font-normal text-primary/70">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-400">{item.followers?.toLocaleString()} followers · {item.boardCount} boards</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{item.engagementMetric?.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">engagement</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════════════════════════════
            FEATURE 4 — Board Quality Analyzer
        ══════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader icon={Target} title="Board Quality Analyzer"
            subtitle="Automated quality audit for each of your boards"/>
          <div className="p-6 pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700/60">
                    <th className="pb-3 pr-4 font-semibold">Board</th>
                    <th className="pb-3 px-3 text-center font-semibold">Quality</th>
                    <th className="pb-3 px-3 text-center font-semibold">Pins</th>
                    <th className="pb-3 px-3 font-semibold">Issues Detected</th>
                    <th className="pb-3 pl-3 font-semibold">Top Suggestion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {boardQuality.map((board, i) => {
                    const c = scoreColor(board.qualityScore);
                    return (
                      <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-4 pr-4">
                          <button 
                            onClick={() => board.url && window.open(board.url, '_blank')}
                            className="text-sm font-medium text-white truncate max-w-[160px] hover:text-primary transition-colors text-left"
                          >
                            {board.name}
                          </button>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${c.bg} ${c.text} ${c.border}`}>
                            {board.qualityScore}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center text-sm text-slate-300">
                          {board.pinCount}
                        </td>
                        <td className="py-4 px-3">
                          <ul className="space-y-1">
                            {board.issues.slice(0, 2).map((issue, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0"/>
                                {issue}
                              </li>
                            ))}
                            {board.issues.length > 2 && (
                              <li className="text-xs text-slate-600">+{board.issues.length - 2} more</li>
                            )}
                          </ul>
                        </td>
                        <td className="py-4 pl-3">
                          {board.suggestions[0] ? (
                            <div className="text-xs text-emerald-400 leading-snug max-w-[200px]">
                              <ArrowRight className="w-3 h-3 inline mr-1 flex-shrink-0"/>
                              {board.suggestions[0]}
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3"/> Looks good!
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════════════
            ROW: Metadata Quality + Opportunity Topics
        ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Feature 8 — Metadata Quality Check */}
          <Card>
            <CardHeader icon={CheckCircle} iconColor="text-emerald-400" title="Metadata Quality Check"
              subtitle="Title, description, and hashtag audit per board"/>
            <div className="p-6 pt-4 space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Avg Metadata Score</span>
                    <span className={`font-bold ${scoreColor(metadataQuality.avgMetadataScore).text}`}>
                      {metadataQuality.avgMetadataScore}/100
                    </span>
                  </div>
                  <ProgressBar value={metadataQuality.avgMetadataScore} color={scoreColor(metadataQuality.avgMetadataScore).ring}/>
                </div>
              </div>

              {(metadataQuality?.boardAudits || []).map((audit, i) => (
                <div key={i} className="border border-slate-700/40 rounded-xl p-4 hover:border-slate-600/60 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white truncate flex-1">{audit.name}</p>
                    <span className={`text-sm font-bold ml-3 ${scoreColor(audit.metadataScore).text}`}>
                      {audit.metadataScore}/100
                    </span>
                  </div>
                  {audit.issues.length === 0 ? (
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3"/> Metadata looks great!
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {audit.issues.slice(0, 3).map((iss, j) => (
                        <div key={j} className={`flex items-start gap-2 text-xs ${
                          iss.severity === 'high' ? 'text-rose-400' :
                          iss.severity === 'medium' ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          <span className="mt-1 flex-shrink-0">
                            {iss.severity === 'high' ? '🔴' : iss.severity === 'medium' ? '🟡' : '🟢'}
                          </span>
                          <div>
                            <p>{iss.issue}</p>
                            <p className="text-slate-500 mt-0.5">Fix: {iss.fix}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {(audit.improvedTitle || audit.improvedDesc) && (
                    <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-1">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Suggested rewrite:</p>
                      {audit.improvedTitle && (
                        <p className="text-xs text-primary font-medium">Title: {audit.improvedTitle}</p>
                      )}
                      <p className="text-xs text-slate-300 leading-snug">{audit.improvedDesc}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Feature 9 — Opportunity Topics */}
          <Card>
            <CardHeader icon={Lightbulb} iconColor="text-amber-400" title="Opportunity Topic Suggestions"
              subtitle="New content areas where competitors are winning that you haven't tapped yet"/>
            <div className="p-6 pt-4 space-y-3">
              {opportunityTopics.opportunities.length === 0 ? (
                <p className="text-sm text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4"/> Great coverage — no major topic gaps detected.
                </p>
              ) : (
                <>
                  <div className="text-xs text-slate-500 mb-3">
                    Analyzed {opportunityTopics?.totalCompetitorTopicsAnalyzed || 0} competitor topics
                  </div>
                  {(opportunityTopics?.opportunities || []).map((opp, i) => (
                    <div key={i}
                      className="p-4 bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 rounded-xl hover:border-amber-500/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white mb-1">"{opp.topic}"</p>
                          <p className="text-xs text-slate-400 leading-snug">{opp.reason || opp.recommendation}</p>
                          {opp.action && (
                            <p className="text-xs text-amber-400/80 mt-1.5 flex items-center gap-1">
                              <ArrowRight className="w-3 h-3"/>
                              {opp.action}
                            </p>
                          )}
                          {opp.pinCount && (
                            <span className="text-[10px] text-slate-500 mt-1 inline-block">
                              {opp.pinCount} pins by {opp.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════════════════════════════
            Bottom: Export CTA
        ══════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-primary/10 to-blue-600/5 border border-primary/20 rounded-2xl p-8 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Ready to take action?</h3>
          <p className="text-slate-400 text-sm mb-5">Export the full intelligence report to share with your team or start a new analysis.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate(`/improvements/${id}`)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 justify-center text-white">
              <BookOpen className="w-4 h-4 text-primary"/>
              Growth Playbook
            </button>
            <button onClick={handleExport}
              className="bg-primary hover:bg-blue-600 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 justify-center shadow-lg shadow-primary/20 text-white">
              <Download className="w-4 h-4"/>
              Export Full Report (CSV)
            </button>
            <button onClick={() => navigate('/setup')}
              className="border border-slate-600 hover:border-slate-400 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 justify-center text-slate-300 hover:text-white">
              Run New Analysis
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;
