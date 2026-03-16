import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-surface-200/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/favicon.png" alt="PinIntel Pro Logo" className="w-10 h-10 object-contain drop-shadow-md" />
              <span className="text-2xl font-extrabold tracking-tight text-white uppercase italic">PinIntel</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a className="text-sm font-medium text-gray-400 hover:text-white transition-colors" href="#features">Features</a>
              <a className="text-sm font-medium text-gray-400 hover:text-white transition-colors" href="#analysis">How It Works</a>
              <button 
                onClick={() => navigate('/setup')}
                className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-custom text-sm font-semibold transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Ambient Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/10 blur-[100px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary-light text-xs font-bold tracking-widest uppercase mb-6">
              Data-Driven Strategy
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Master the Science of <span className="gradient-text">Pinterest Board SEO</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Go beyond pinning. Unlock competitive insights, optimize for the Pinterest algorithm, and rank your boards above the competition with precision analytics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/setup')}
                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-custom font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-primary/20"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Hero Visual - Creative Floating Intelligence Grid */}
          <div className="mt-24 relative max-w-5xl mx-auto px-4">
            <div className="relative h-[500px] md:h-[600px] w-full">
              
              {/* Central Major Dashboard Card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] md:w-[70%] z-20 group">
                <div className="glass-card rounded-3xl p-6 md:p-10 shadow-[0_0_50px_rgba(17,82,212,0.3)] border border-primary/30 transform transition-all duration-700 group-hover:scale-[1.02]">
                  <div className="flex justify-between items-center mb-10">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                    </div>
                    <div className="text-[10px] font-bold tracking-[0.2em] text-primary-light uppercase">Core Intelligence Engine</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                          <span>Visibility Score</span>
                          <span className="text-primary-light">92%</span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-gradient-to-r from-primary to-blue-400 w-[92%]"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                          <span>SEO Optimization</span>
                          <span className="text-emerald-400">88%</span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-emerald-500 w-[88%]"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative flex justify-center">
                      <div className="w-40 h-40 rounded-full border-[10px] border-white/5 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border-[10px] border-primary border-t-transparent animate-[spin_3s_linear_infinite]"></div>
                        <div className="text-center">
                          <div className="text-4xl font-black italic">A+</div>
                          <div className="text-[10px] font-bold text-primary-light uppercase tracking-tighter">Pin Health</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card: Keyword Gap */}
              <div className="absolute top-[10%] right-[0%] md:right-[5%] z-30 animate-float-slow hidden sm:block">
                <div className="glass-card rounded-2xl p-4 border border-white/10 shadow-2xl backdrop-blur-xl hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Top Keyword Gap</div>
                      <div className="text-sm font-bold text-white">"Minimalist Decor"</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold whitespace-nowrap">Missing in 8 Boards</div>
                    <div className="text-[10px] text-emerald-400 font-bold">+24% Lift Potential</div>
                  </div>
                </div>
              </div>

              {/* Floating Card: Content Format */}
              <div className="absolute bottom-[15%] left-[-5%] md:left-[5%] z-30 animate-float-delayed hidden sm:block">
                <div className="glass-card rounded-2xl p-5 border border-white/10 shadow-2xl backdrop-blur-xl">
                  <div className="text-xs font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-primary" /> Content Format Mix
                  </div>
                  <div className="flex gap-1.5 h-16 items-end">
                    <div className="w-3 bg-primary/40 rounded-t h-[30%]"></div>
                    <div className="w-3 bg-primary/60 rounded-t h-[50%]"></div>
                    <div className="w-3 bg-primary rounded-t h-[80%]"></div>
                    <div className="w-3 bg-primary/20 rounded-t h-[20%]"></div>
                    <div className="w-3 bg-primary/80 rounded-t h-[65%]"></div>
                  </div>
                  <div className="mt-3 text-[10px] text-gray-500 font-medium">Idea Pins trending up (+18%)</div>
                </div>
              </div>

              {/* Decorative "Pin" Elements */}
              <div className="absolute top-[20%] left-[10%] w-24 h-32 bg-white/5 rounded-2xl border border-white/5 blur-[1px] rotate-[-12deg] z-10 hidden md:block"></div>
              <div className="absolute bottom-[30%] right-[15%] w-20 h-28 bg-primary/5 rounded-2xl border border-primary/10 blur-[2px] rotate-[15deg] z-10 hidden md:block"></div>
              
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface-100" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4">Core Intelligence Modules</h2>
            <p className="text-gray-400 max-w-xl">
              Everything you need to dominate Pinterest search results and understand your competitive landscape.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 glass-card rounded-custom hover:border-primary/50 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-custom flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">SEO Scoring</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Proprietary algorithms analyze your board titles, descriptions, and pin metadata to provide a real-time SEO health score and actionable improvement steps.
              </p>
            </div>

            <div className="p-8 glass-card rounded-custom hover:border-primary/50 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-custom flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Competitive Benchmarking</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Compare your performance directly against niche leaders. Understand why they rank and how you can bridge the gap using data-driven insights.
              </p>
            </div>

            <div className="p-8 glass-card rounded-custom hover:border-primary/50 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-custom flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Content Consistency</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Monitor semantic relevance across your boards. Ensure your content narrative remains consistent for maximum algorithmic authority.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Analysis Section */}
      <section className="py-24" id="analysis">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-bold mb-6">Ranking Intelligence That Works</h2>
              <p className="text-gray-400 text-lg mb-8">
                We analyze board interactions to identify the exact variables that trigger Pinterest's recommendation engine.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <span className="text-gray-300">Identify high-converting keywords before they saturate.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <span className="text-gray-300">Audit board descriptions for semantic relevance and intent.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <span className="text-gray-300">Track ranking velocity over time for your most important assets.</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2 w-full">
              <div className="relative aspect-square md:aspect-video glass-card rounded-custom flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-6 bg-surface-200/90 border border-white/10 rounded-custom shadow-xl">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                      <span className="font-bold text-lg">Crunching Live Data...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-custom p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0 100 L100 0" stroke="white" strokeWidth="0.5"></path>
                <path d="M0 80 L80 0" stroke="white" strokeWidth="0.5"></path>
                <path d="M20 100 L100 20" stroke="white" strokeWidth="0.5"></path>
              </svg>
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Ready to outrank the competition?</h2>
              <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
                Join elite Pinterest marketers using data to scale their reach and organic traffic. Start analyzing today.
              </p>
              <button 
                onClick={() => navigate('/setup')}
                className="px-10 py-5 bg-white text-primary hover:bg-gray-100 rounded-custom font-bold text-xl transition-all shadow-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-200 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-6 h-6 bg-primary rounded-custom flex items-center justify-center">
                  <div className="w-3 h-3 border border-white rounded-full"></div>
                </div>
                <span className="text-xl font-extrabold tracking-tight text-white italic uppercase">PinIntel</span>
              </div>
              <p className="text-gray-500 text-sm max-w-sm">
                Professional SEO and ranking intelligence for Pinterest board management. Built for agencies, creators, and brands focused on organic growth.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button className="hover:text-primary transition-colors text-left" onClick={() => navigate('/setup')}>Pricing</button></li>
                <li><button className="hover:text-primary transition-colors text-left" onClick={() => navigate('/setup')}>Roadmap</button></li>
                <li><button className="hover:text-primary transition-colors text-left" onClick={() => navigate('/setup')}>API Access</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button className="hover:text-primary transition-colors text-left" onClick={() => navigate('/setup')}>SEO Guide</button></li>
                <li><button className="hover:text-primary transition-colors text-left" onClick={() => navigate('/setup')}>Case Studies</button></li>
                <li><button className="hover:text-primary transition-colors text-left" onClick={() => navigate('/setup')}>Support</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs">© 2026 PinIntel Analytics. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-gray-500">
              <button className="hover:text-white" onClick={() => navigate('/setup')}>Privacy Policy</button>
              <button className="hover:text-white" onClick={() => navigate('/setup')}>Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
