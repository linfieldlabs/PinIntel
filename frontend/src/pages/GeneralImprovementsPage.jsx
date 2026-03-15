import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, LayoutTemplate, Search, 
  Image as ImageIcon, Layers, TrendingUp, Heart, 
  RefreshCw, Network, BarChart2, Briefcase, Maximize
} from 'lucide-react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-[#1e293b] border border-slate-700/60 rounded-xl ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="mb-6">
    <div className="flex items-center gap-4 mb-2">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-800 border border-slate-700 text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
    {description && <p className="text-sm text-slate-400 ml-14">{description}</p>}
  </div>
);

const ExampleBlock = ({ children }) => (
  <div className="bg-[#0f172a] rounded-lg p-4 text-sm font-mono text-slate-300 border border-slate-800 whitespace-pre-wrap">
    {children}
  </div>
);

const GeneralImprovementsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`/api/analysis/${id}/results`);
        setResults(response.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-400">
        Failed to load results.
      </div>
    );
  }

  // Extract dynamic data
  const brandName = results.brandProfile?.name || 'Your Brand';
  const kw = results.metadata?.keywords || [];
  const primaryKw = kw[0] || 'your main topic';
  const secondaryKw = kw[1] || 'related topic';
  const tertiaryKw = kw[2] || 'niche inspiration';

  return (
    <div className="bg-[#0f172a] text-slate-200 min-h-screen pb-12">
      
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-[#1e293b]/70 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/dashboard/${id}`)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white border border-slate-700/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Simple Steps to Grow</h1>
              <p className="text-xs text-slate-400">Easy changes for {brandName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Intro Banner */}
        <div className="bg-[#1e293b] border-l-4 border-primary rounded-r-xl p-6">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            How to get more views and followers
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            This page shows you exactly what to do to grow <strong> {brandName}</strong>. If you want more people to see your pins about <strong>"{primaryKw}"</strong>, just follow these easy steps.
          </p>
        </div>

        {/* 1. Profile Authority */}
        <Card className="p-8">
          <SectionHeader 
            icon={Maximize} 
            title="1. Fix Your Profile" 
            description="When people click on your name, they should know exactly what you do right away."
          />
          <div className="grid md:grid-cols-2 gap-8 ml-0 md:ml-14">
            <div>
              <h3 className="font-semibold text-white mb-2 text-sm">Add Words to Your Name</h3>
              <p className="text-sm text-slate-400 mb-3">Put the main thing you talk about next to your name. This helps people find you when they search.</p>
              <ExampleBlock>
                {brandName} | {primaryKw.charAt(0).toUpperCase() + primaryKw.slice(1)} Ideas{'\n'}
                {brandName} | {secondaryKw.charAt(0).toUpperCase() + secondaryKw.slice(1)} Tips{'\n'}
                {brandName} | {tertiaryKw.charAt(0).toUpperCase() + tertiaryKw.slice(1)} Inspiration
              </ExampleBlock>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2 text-sm">Write a Clear Bio</h3>
              <p className="text-sm text-slate-400 mb-3">Write 2 short sentences telling people what they will get if they follow you.</p>
              <ExampleBlock>
                I share the best ideas for {primaryKw}. Follow me for {secondaryKw} tips, simple guides, and daily inspiration to help you!
              </ExampleBlock>
            </div>
          </div>
        </Card>

        {/* 2. Board Structure */}
        <Card className="p-8">
          <SectionHeader 
            icon={LayoutTemplate} 
            title="2. Clean Up Your Boards" 
            description="Pinterest likes when your boards are neat and easy to understand."
          />
          <div className="grid md:grid-cols-2 gap-6 ml-0 md:ml-14">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-5">
              <h3 className="font-semibold text-slate-200 mb-3 text-sm flex items-center gap-2">The Right Way</h3>
              <ul className="space-y-2 text-sm text-slate-400 list-disc ml-4">
                <li>Name the board exactly what it is (like "{primaryKw}")</li>
                <li>Write a sentence saying what is in the board</li>
                <li>Keep adding pins! Try to get at least 30 pins in every board</li>
                <li>Everything in the board must be about the same topic</li>
              </ul>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-5">
              <h3 className="font-semibold text-slate-200 mb-3 text-sm flex items-center gap-2">The Wrong Way</h3>
              <ul className="space-y-2 text-sm text-slate-400 list-disc ml-4">
                <li>Empty boards or very small boards with only 3 pins</li>
                <li>Cute or confusing names like "Stuff I Love" or "My Dreams"</li>
                <li>Mixing a bunch of random things into one board</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 3. Optimize Pin SEO */}
        <Card className="p-8">
          <SectionHeader 
            icon={Search} 
            title="3. Use Search Words on Your Pins" 
            description="Pinterest is like Google. People type words to find pictures. You need to use those words."
          />
          <div className="space-y-6 ml-0 md:ml-14 divide-y divide-slate-800/60">
            <div>
              <h3 className="font-semibold text-white mb-2 text-sm">The Pin Title</h3>
              <p className="text-sm text-slate-400 mb-3">If you want people to find a pin about {primaryKw}, put that word in the title.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <ExampleBlock>[ The Main Word ] + Something Extra</ExampleBlock>
                <div className="bg-slate-800/40 rounded-lg p-4 text-sm text-slate-400">
                  <ul className="list-disc ml-4 space-y-1">
                    <li>How to do <span className="text-white">{primaryKw}</span> easily</li>
                    <li>Simple <span className="text-white">{secondaryKw}</span> ideas for you</li>
                    <li>The best <span className="text-white">{tertiaryKw}</span> to try today</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <h3 className="font-semibold text-white mb-2 text-sm">The Pin Description</h3>
              <p className="text-sm text-slate-400 mb-3">Write a normal paragraph under the pin. Explain what the pin shows and why it is good.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <ExampleBlock>What are they looking at?{'\n'}Why will it help them?{'\n'}"Please Save this to remember!"</ExampleBlock>
                <div className="bg-slate-800/40 rounded-lg p-4 text-sm text-slate-400 border-l-2 border-primary">
                  Look at this cool way to do <span className="text-slate-200">"{primaryKw}"</span>. This will help you get better at <span className="text-slate-200">{secondaryKw}</span> and give you great <span className="text-slate-200">{tertiaryKw}</span> ideas. Save this pin right now so you do not lose it!
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 4. Improve Pin Design Quality */}
        <Card className="p-8">
          <SectionHeader 
            icon={ImageIcon} 
            title="4. Make Nice Pictures" 
            description="People scroll very fast. Your pictures need to look good and be easy to read."
          />
          <div className="grid md:grid-cols-3 gap-6 ml-0 md:ml-14">
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <h3 className="font-semibold text-slate-200 mb-3 text-sm">The Shape</h3>
              <ul className="space-y-2 text-sm text-slate-400 list-disc ml-4">
                <li>Pictures MUST be tall, not wide</li>
                <li>Like the shape of a phone screen</li>
                <li>Size: <span className="text-primary font-mono ml-1">1000 × 1500 pixels</span></li>
              </ul>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <h3 className="font-semibold text-slate-200 mb-3 text-sm">The Colors</h3>
              <ul className="space-y-2 text-sm text-slate-400 list-disc ml-4">
                <li>Make the letters very big</li>
                <li>Use bright colors that pop out</li>
                <li>Make sure you can easily see what the photo is about</li>
              </ul>
            </div>
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <h3 className="font-semibold text-slate-200 mb-3 text-sm">What to Stop Doing</h3>
              <ul className="space-y-2 text-sm text-slate-400 list-disc ml-4">
                <li>No dark, blurry, or ugly photos</li>
                <li>Do not write a whole book on the picture (too many words)</li>
                <li>Putting a square or wide photo (like a TV shape) on Pinterest</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 5 & 6. Formats & Volume */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <SectionHeader 
              icon={Layers} 
              title="5. Try Different Things" 
              description="Do not just post the same exact kind of picture every time."
            />
            <div className="space-y-4 ml-0 md:ml-14">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between items-center text-slate-400"><span>A normal picture</span> <span className="text-slate-200">Post these most days</span></div>
                <div className="w-full bg-slate-800 rounded h-1"><div className="bg-slate-500 h-1 rounded" style={{width: '70%'}}></div></div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between items-center text-slate-400"><span>A short video</span> <span className="text-slate-200">Post these sometimes</span></div>
                <div className="w-full bg-slate-800 rounded h-1"><div className="bg-slate-400 h-1 rounded" style={{width: '20%'}}></div></div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between items-center text-slate-400"><span>A slideshow</span> <span className="text-slate-200">Post these a little bit</span></div>
                <div className="w-full bg-slate-800 rounded h-1"><div className="bg-primary h-1 rounded" style={{width: '10%'}}></div></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader 
              icon={TrendingUp} 
              title="6. Don't Stop Posting" 
              description="Pinterest wants to see you posting regularly, not all at once."
            />
            <div className="space-y-4 text-sm ml-0 md:ml-14">
              <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                <span className="text-slate-400 text-xs block mb-1">A Good Goal</span>
                <span className="text-white font-mono text-lg">10 to 15 pins every week</span>
              </div>
              <div className="text-slate-400 leading-relaxed text-xs">
                It is very bad to post 20 pins in one single day and then disappear for a month! It is much better if you just post 2 pins today, 2 pins tomorrow, and so on. Keep it steady.
              </div>
            </div>
          </Card>
        </div>

        {/* 7 & 8. Engagement & Freshness */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <SectionHeader 
              icon={Heart} 
              title="7. Remind People to Save" 
              description="When someone saves your pin, Pinterest shows it to more people."
            />
            <div className="ml-0 md:ml-14">
              <p className="text-xs text-slate-400 mb-3">Literally write these words on your actual picture to remind them:</p>
              <ul className="space-y-1 text-sm font-mono bg-slate-800/40 p-4 border border-slate-700/50 rounded-lg text-slate-300">
                <li className="border-l-2 border-primary pl-2">"Save this to remember"</li>
                <li className="border-l-2 border-primary pl-2">"Click here for the guide"</li>
                <li className="border-l-2 border-primary pl-2">"Save this {primaryKw.charAt(0).toUpperCase() + primaryKw.slice(1)} idea!"</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader 
              icon={RefreshCw} 
              title="8. Use Good Ideas Twice" 
              description="You can post about the same thing more than once. Just change the picture!"
            />
            <div className="ml-0 md:ml-14 text-sm">
              <p className="text-slate-400 mb-3">
                If you have a great post about "{secondaryKw}", you should make 3 completely different pictures trying to tell people to look at it.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 text-center bg-slate-800 border border-slate-700 text-slate-400 p-2 rounded text-xs">Picture 1 (Red words)</div>
                <div className="flex-1 text-center bg-slate-800 border border-slate-700 text-slate-400 p-2 rounded text-xs">Picture 2 (Blue words)</div>
                <div className="flex-1 text-center bg-slate-800 border border-slate-700 text-slate-400 p-2 rounded text-xs">Picture 3 (A Video!)</div>
              </div>
            </div>
          </Card>
        </div>

        {/* 9 & 10. Clusters & Tracking */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <SectionHeader 
              icon={Network} 
              title="9. Group Things Together" 
              description="Don't put a recipe pin inside a board about shoes."
            />
            <div className="ml-0 md:ml-14">
              <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50 font-mono text-sm text-slate-400 leading-relaxed">
                If you make a new board called "{primaryKw}", only put pins inside that board that are exactly about "{primaryKw}". If you follow this rule, Pinterest is happy.
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader 
              icon={BarChart2} 
              title="10. Check What works" 
              description="Look at what is doing well, and do it again."
            />
            <div className="ml-0 md:ml-14">
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Once a month, check your account. Find out which pin got the most clicks. If your pin about "{tertiaryKw}" did the best, then you should make more pins about "{tertiaryKw}"! It's that simple.
              </p>
            </div>
          </Card>
        </div>

        {/* ONE KEY IMPROVEMENT */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-8 text-center mt-8">
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="text-lg font-bold text-white mb-1">The Most Important Tip: Pick Your Colors and Fonts</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              When {brandName} makes a new pin, you should always try to use the very same handwriting or text font. You should also pick 2 or 3 colors and always use those colors. When people see that font and color, they will start remembering who you are!
            </p>
            <div className="flex justify-center gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded px-4 py-2 text-xs font-semibold text-slate-300">
                Always use the same font
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded px-4 py-2 text-xs font-semibold text-slate-300">
                Always use the same colors
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default GeneralImprovementsPage;
