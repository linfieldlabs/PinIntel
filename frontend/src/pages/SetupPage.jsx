import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SetupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    brandUrl: '',
    competitorUrls: [''],
    keywords: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addCompetitor = () => {
    if (formData.competitorUrls.length < 5) {
      setFormData({
        ...formData,
        competitorUrls: [...formData.competitorUrls, '']
      });
    }
  };

  const updateCompetitor = (index, value) => {
    const newUrls = [...formData.competitorUrls];
    newUrls[index] = value;
    setFormData({ ...formData, competitorUrls: newUrls });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const competitorUrls = formData.competitorUrls.filter(url => url.trim().length > 0);

      const response = await axios.post('/api/analysis/start', {
        brandUrl: formData.brandUrl,
        competitorUrls,
        keywords
      });

      navigate(`/analysis/${response.data.analysisId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start analysis');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100">
      <header className="border-b border-surface-border bg-surface-50 h-20 px-8 flex justify-between items-center">
        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/favicon.png" alt="PinIntel Pro Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase italic">PinIntel</h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-2xl">
          <nav className="mb-12">
            <ol className="flex items-center w-full">
              <li className="relative flex-1">
                <div className="flex flex-col items-center group relative z-10">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20">
                    1
                  </span>
                  <span className="mt-3 text-[10px] font-bold text-white uppercase tracking-widest">Project Details</span>
                </div>
                <div className="absolute top-[18px] left-1/2 w-full h-0.5 bg-primary"></div>
              </li>
              <li className="relative flex-1">
                <div className="flex flex-col items-center group relative z-10">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-surface-50 text-primary text-sm font-bold shadow-lg shadow-primary/10">
                    2
                  </span>
                  <span className="mt-3 text-[10px] font-bold text-primary uppercase tracking-widest">Configuration</span>
                </div>
                <div className="absolute top-[18px] left-1/2 w-full h-0.5 bg-surface-border"></div>
              </li>
              <li className="relative">
                <div className="flex flex-col items-center group relative z-10">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface-border bg-surface-50 text-gray-500 text-sm font-bold">
                    3
                  </span>
                  <span className="mt-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Analysis</span>
                </div>
              </li>
            </ol>
          </nav>

          <section className="bg-surface-50 border border-surface-border rounded-custom p-8 shadow-xl">
            <header className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Configure Intelligence Parameters</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Define your brand presence and competitor landscape to begin the deep-scan process. Our AI will analyze board structures and engagement patterns.
              </p>
            </header>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-custom text-red-400 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="brand-url">
                  Your Brand Pinterest URL
                </label>
                <input
                  className="w-full bg-surface-100 border-surface-border rounded-custom py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  id="brand-url"
                  type="url"
                  placeholder="https://pinterest.com/yourbrand"
                  value={formData.brandUrl}
                  onChange={(e) => setFormData({ ...formData, brandUrl: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Competitor URLs
                </label>
                <p className="text-xs text-gray-500 mb-3">Add up to 5 competitor profiles to benchmark against.</p>
                <div className="space-y-3">
                  {formData.competitorUrls.map((url, index) => (
                    <input
                      key={index}
                      className="w-full bg-surface-100 border-surface-border rounded-custom py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      type="url"
                      placeholder={`https://pinterest.com/competitor${index + 1}`}
                      value={url}
                      onChange={(e) => updateCompetitor(index, e.target.value)}
                    />
                  ))}
                  {formData.competitorUrls.length < 5 && (
                    <button
                      type="button"
                      onClick={addCompetitor}
                      className="text-xs font-semibold text-primary hover:text-white transition-colors flex items-center gap-1"
                    >
                      + Add another competitor
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="keywords">
                  Target Keywords
                </label>
                <textarea
                  className="w-full bg-surface-100 border-surface-border rounded-custom py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  id="keywords"
                  rows="3"
                  placeholder="e.g. minimalist interior design, organic skincare, sustainable fashion"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  required
                ></textarea>
                <p className="text-xs text-gray-500 mt-2">Separate keywords with commas for broader scanning coverage.</p>
              </div>

              <div className="pt-6 border-t border-surface-border mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-6 rounded-custom shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin">◌</span> Initializing Scan...
                    </span>
                  ) : (
                    'Start Intelligence Analysis'
                  )}
                </button>
              </div>
            </form>
          </section>

          <footer className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Initial scan takes approximately 2-5 minutes depending on the volume of data.
              <br />
              Results will be saved automatically to your dashboard.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default SetupPage;
