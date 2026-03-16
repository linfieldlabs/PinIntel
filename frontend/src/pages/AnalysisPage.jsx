import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`/api/analysis/${id}/status`);
        setStatus(response.data);

        if (response.data.status === 'completed') {
          navigate(`/dashboard/${id}`);
        } else if (response.data.status === 'failed') {
          setError('Analysis failed. Please try again.');
        }
      } catch (err) {
        setError('Failed to check analysis status');
      }
    };

    const interval = setInterval(checkStatus, 2000);
    checkStatus();

    return () => clearInterval(interval);
  }, [id, navigate]);

  const getProgressPercentage = () => {
    return status?.progress || 0;
  };

  const getCircleProgress = () => {
    const percentage = getProgressPercentage();
    const circumference = 2 * Math.PI * 88;
    return circumference - (percentage / 100) * circumference;
  };

  const getCurrentStep = () => {
    const progress = getProgressPercentage();
    if (progress < 30) return { name: 'Scraping Profile', desc: 'Board metadata and pin counts retrieved', status: 'active' };
    if (progress < 70) return { name: 'Calculating SEO Scores', desc: 'Evaluating keyword density and ranking potential', status: 'active' };
    return { name: 'Analyzing Competitors', desc: 'Benchmarking against top performing niche boards', status: 'active' };
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/setup')}
            className="px-6 py-3 bg-primary text-white rounded-custom font-semibold"
          >
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStep();

  return (
    <div className="bg-[#0a0a0a] text-gray-100 min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-2xl bg-surface-50 border border-surface-100 rounded-custom p-8 md:p-12 shadow-2xl">
        <header className="mb-12 flex flex-col items-center text-center">
          <div className="flex items-center gap-4 cursor-pointer mb-6" onClick={() => navigate('/')}>
            <img src="/favicon.png" alt="PinIntel Pro Logo" className="w-10 h-10 object-contain drop-shadow-md" />
            <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase italic">
              PinIntel
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Our algorithms are currently processing your request to provide deep market insights.
          </p>
        </header>

        <section className="space-y-12">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-surface-100"
                  cx="96"
                  cy="96"
                  fill="transparent"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                ></circle>
                <circle
                  className="text-primary transition-all duration-500 ease-out"
                  cx="96"
                  cy="96"
                  fill="transparent"
                  r="88"
                  stroke="currentColor"
                  strokeDasharray="553"
                  strokeDashoffset={getCircleProgress()}
                  strokeLinecap="round"
                  strokeWidth="8"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{getProgressPercentage()}%</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Overall</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                <div>
                  <p className="text-sm font-medium text-white">{currentStep.name}</p>
                  <p className="text-xs text-gray-500">{currentStep.desc}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary animate-pulse uppercase">Active</span>
            </div>

            <div className="ml-10 h-1.5 w-full bg-surface-100 rounded-full overflow-hidden">
              <div className="h-full w-2/3 rounded-full animate-shimmer"></div>
            </div>
          </div>
        </section>

        <footer className="mt-12 pt-8 border-t border-surface-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>System operational: analyzing data points</span>
            </div>
            <span>Estimated time: 1-2 min remaining</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AnalysisPage;
