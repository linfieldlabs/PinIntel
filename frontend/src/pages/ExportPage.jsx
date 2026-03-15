import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SAMPLE_DATA } from '../data/sampleReport';
import { Download, FileText, Table } from 'lucide-react';

const ExportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  const handleCSVExport = async () => {
    try {
      const response = await axios.get(`/api/analysis/${id}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pinterest-analysis-${id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  if (!results) {
    return <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <p className="text-gray-400">No results available</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-100">
      <nav className="border-b border-surface-200 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-custom flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Intelligence Dashboard</span>
            </div>
            <button 
              onClick={() => navigate(`/dashboard/${id}`)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Export Intelligence Report</h1>
              <p className="text-gray-400 max-w-2xl">
                Download your comprehensive board analysis with all insights and recommendations.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCSVExport}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-custom transition-all flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                Download CSV Report
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="space-y-6">
            <div className="bg-surface-50 border border-surface-100 p-6 rounded-custom">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Report Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Total Boards</span>
                  <span className="text-white text-sm font-medium">{results.scores.summary.totalBoards}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Scan Date</span>
                  <span className="text-white text-sm font-medium">{new Date(results.analyzedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Competitors</span>
                  <span className="text-white text-sm font-medium">{results.competitorProfiles.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Recommendations</span>
                  <span className="text-white text-sm font-medium">{results.recommendations.length}</span>
                </div>
                <div className="pt-4 mt-4 border-t border-surface-200">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Processing Complete
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-2">
            <div className="bg-white text-slate-900 rounded-custom p-10 min-h-[600px] shadow-2xl">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">
                    Intelligence Report
                  </p>
                  <h3 className="text-4xl font-bold leading-tight">Pinterest Board Analysis</h3>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-bold uppercase border-b border-slate-200 pb-2 mb-4">Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Avg SEO</p>
                      <p className="text-lg font-bold">{results.scores.summary.avgSEOScore}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Engagement</p>
                      <p className="text-lg font-bold">{results.scores.summary.avgEngagementScore}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Consistency</p>
                      <p className="text-lg font-bold">{results.scores.summary.avgConsistencyScore}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase border-b border-slate-200 pb-2 mb-4">Top Recommendations</h4>
                  <ul className="space-y-2">
                    {results.recommendations.slice(0, 5).map((rec, index) => (
                      <li key={index} className="text-sm flex gap-2">
                        <span className="font-bold text-primary">{index + 1}.</span>
                        <span>{rec.recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase border-b border-slate-200 pb-2 mb-4">Competitive Position</h4>
                  <div className="space-y-2">
                    {results.leaderboard.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className={item.isBrand ? 'font-bold text-primary' : ''}>{item.name}</span>
                        <span className="text-gray-500">Rank #{item.rank}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ExportPage;
