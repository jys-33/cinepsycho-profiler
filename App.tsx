// --- START OF FILE App.tsx ---

import React, { useState } from 'react';
import { AppState, FullProfile, ReviewItem } from './types';
import { MOCK_REVIEWS } from './constants';
import { analyzeProfile } from './services/geminiService';
import { crawlUserReviews } from './services/doubanCrawler';
import CrawlerTerminal from './components/CrawlerTerminal';
import AnalysisReport from './components/AnalysisReport';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [dataSource, setDataSource] = useState<'url' | 'json'>('url');
  const [analysisMode, setAnalysisMode] = useState<'normal' | 'roast'>('normal');
  // URL Mode Inputs
  const [inputVal, setInputVal] = useState('');
  const [cookieVal, setCookieVal] = useState(''); 
  
  // JSON Mode Inputs
  const [jsonInput, setJsonInput] = useState('');

  // Analysis Options
  const [enableImageGen, setEnableImageGen] = useState(false);
  
  const [uid, setUid] = useState('');
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [analyzedCount, setAnalyzedCount] = useState(0);
  
  // Crawler State
  const [logs, setLogs] = useState<string[]>([]);

  const parseUid = (input: string): string | null => {
    const urlMatch = input.match(/\/people\/([^\/]+)\/?/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    if (/^[\w\d]+$/.test(input)) {
      return input;
    }
    return null;
  };

  const handleStartAnalysis = async () => {
    setErrorMsg('');
    setLogs([]);

    if (dataSource === 'url') {
        const extractedUid = parseUid(inputVal);
        if (!extractedUid) {
          setErrorMsg("无效的豆瓣链接或UID格式 (Invalid Format)");
          return;
        }
        setUid(extractedUid);
        setState(AppState.CRAWLING);

        try {
            // Real Crawling Logic
            const reviews = await crawlUserReviews(extractedUid, cookieVal, (log) => {
                setLogs(prev => [...prev, log]);
            });
            handleCrawlingComplete(reviews);
        } catch (err: any) {
             setLogs(prev => [...prev, `❌ 错误: ${err.message}`]);
             setTimeout(() => {
                 setErrorMsg(err.message);
                 setState(AppState.ERROR);
             }, 2000);
        }

    } else {
        // JSON Mode Validation
        if (!jsonInput.trim()) {
            setErrorMsg("请输入 JSON 数据 (Please input JSON)");
            return;
        }
        try {
            const parsed = JSON.parse(jsonInput);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                setErrorMsg("JSON 必须是包含评论的数组 (Array of reviews)");
                return;
            }
            // Basic validation
            if (!parsed[0].title) {
                 setErrorMsg("JSON 格式错误: 缺少 title 字段");
                 return;
            }
            
            // Auto-tag category if missing, assume movie
            const sanitized = parsed.map((item: any) => ({
                ...item,
                category: item.category || 'movie'
            }));

            setUid(`Imported_User`);
            
            // Fake logs for JSON parsing
            setState(AppState.CRAWLING);
            setLogs(["System: JSON 模式已启动", "Parsing data...", "Verification successful."]);
            setTimeout(() => {
                handleCrawlingComplete(sanitized);
            }, 1000);

        } catch (e) {
            setErrorMsg("JSON 解析失败，请检查语法 (Invalid JSON)");
        }
    }
  };

  const handleDemo = () => {
    setDataSource('url');
    setUid('demo_artist_001');
    setInputVal('https://www.douban.com/people/demo_artist_001/');
    // 演示模式默认开启绘图体验更好，或者你可以让它服从当前开关
    // setEnableImageGen(true); 
    setState(AppState.CRAWLING);
    
    // Simulate logs for demo
    const demoLogs = [
        "Connecting to Demo Database...",
        "Fetching Movies...",
        "Fetching Books...",
        "Fetching Music...",
        "Found combined records...",
        "Preparing analysis..."
    ];
    let i = 0;
    const interval = setInterval(() => {
        setLogs(prev => [...prev, demoLogs[i]]);
        i++;
        if (i >= demoLogs.length) {
            clearInterval(interval);
            setTimeout(() => {
                handleCrawlingComplete(MOCK_REVIEWS);
            }, 500);
        }
    }, 500);
  };

  const handleCrawlingComplete = async (reviews: ReviewItem[]) => {
    setState(AppState.ANALYZING);
    try {
      setAnalyzedCount(reviews.length);
      // Pass the enableImageGen flag to the service
      const result = await analyzeProfile(reviews, enableImageGen, analysisMode);
      setProfile(result);
      setState(AppState.COMPLETE);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed');
      setState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setState(AppState.IDLE);
    setProfile(null);
    setErrorMsg('');
    setAnalyzedCount(0);
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-[#110e1b] text-gray-100 font-sans selection:bg-pink-300 selection:text-purple-900 relative overflow-hidden">
      
      {/* Dreamy Particle Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-purple-400/20 blur-[100px] rounded-full mix-blend-screen animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-blue-300/20 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[45rem] h-[45rem] bg-pink-300/20 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-white/5 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
             <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(244,114,182,0.4)] transition-all duration-300 group-hover:scale-110">
                   <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
                  Cine<span className="text-pink-300 font-light">Psycho</span>
                </span>
             </div>
             {state === AppState.COMPLETE && (
               <button 
                 onClick={handleReset}
                 className="text-sm px-5 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 transition-all text-gray-200 shadow-sm"
               >
                 🔄 新分析
               </button>
             )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        
        {/* State: IDLE */}
        {state === AppState.IDLE && (
          <div className="max-w-3xl mx-auto space-y-12 animate-[fadeIn_0.8s_ease-out]">
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200">
                  灵魂显影
                </span>
              </h1>
              <p className="text-lg md:text-xl text-purple-200/70 max-w-lg mx-auto leading-relaxed font-light">
                基于 Gemini AI 的全维文化侧写 (书/影/音)。
                <br/>从你的精神食粮中解析潜意识符号与人格原型。
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/20 p-2 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
               <div className="bg-[#181524]/60 rounded-[2rem] p-8 md:p-10 relative overflow-hidden backdrop-blur-md">
                   
                   {/* Data Source Tabs */}
                   <div className="flex justify-center mb-8 bg-black/20 p-1 rounded-xl max-w-sm mx-auto">
                      <button 
                        onClick={() => setDataSource('url')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${dataSource === 'url' ? 'bg-white/10 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                      >
                        🌐 豆瓣爬虫 (Auto)
                      </button>
                      <button 
                        onClick={() => setDataSource('json')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${dataSource === 'json' ? 'bg-gradient-to-r from-purple-500/50 to-pink-500/50 text-white shadow-md border border-white/10' : 'text-gray-400 hover:text-white'}`}
                      >
                        📂 导入数据 (JSON)
                      </button>
                   </div>

                   <div className="space-y-6 relative z-10">
                      
                      {/* URL MODE UI */}
                      {dataSource === 'url' && (
                        <div className="animate-[fadeIn_0.3s_ease-out] space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-purple-200/60 mb-2 pl-1">
                                  豆瓣主页链接 / User ID
                                </label>
                                <input 
                                  type="text" 
                                  value={inputVal}
                                  onChange={(e) => setInputVal(e.target.value)}
                                  placeholder="https://www.douban.com/people/xxxxxx/"
                                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/50 outline-none transition-all placeholder-white/20 shadow-inner text-lg"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-purple-200/60 mb-2 pl-1 flex justify-between">
                                  <span>Cookie (可选)</span>
                                </label>
                                <input 
                                  type="text" 
                                  value={cookieVal}
                                  onChange={(e) => setCookieVal(e.target.value)}
                                  placeholder="粘贴你的 Cookie (可选，用于抓取受限数据)"
                                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-3 text-white/80 focus:ring-2 focus:ring-blue-400/50 outline-none transition-all placeholder-white/10 text-xs font-mono"
                                />
                            </div>

                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200/80 leading-relaxed">
                              ℹ️ <strong>自动抓取范围：</strong> 电影、图书、音乐。AI 将基于您历史数据的综合统计（标签流派）和精选评论进行深度侧写。
                            </div>
                        </div>
                      )}

                      {/* JSON MODE UI */}
                      {dataSource === 'json' && (
                        <div className="animate-[fadeIn_0.3s_ease-out]">
                            <label className="block text-sm font-medium text-purple-200/60 mb-3 pl-1 flex justify-between">
                              <span>粘贴 JSON 数据</span>
                              <span className="text-xs opacity-50">支持 Movie/Book/Music</span>
                            </label>
                            <textarea 
                              value={jsonInput}
                              onChange={(e) => setJsonInput(e.target.value)}
                              placeholder={`[\n  {\n    "title": "奥本海默",\n    "rating": 5,\n    "comment": "...",\n    "category": "movie"\n  }\n]`}
                              className="w-full h-48 bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white/90 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 outline-none transition-all placeholder-white/20 shadow-inner text-sm font-mono scrollbar-hide"
                            />
                        </div>
                      )}

                      {/* --- 功能开关区域 --- */}
                      {/*  <div className="bg-white/5 border border-white/5 rounded-2xl p-2 mt-4">
                        <label className="flex items-center space-x-3 cursor-pointer group p-3 rounded-xl hover:bg-white/5 transition-all">
                            <div className="relative">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={enableImageGen}
                                onChange={(e) => setEnableImageGen(e.target.checked)}
                              />
                              <div className="w-10 h-6 bg-gray-700/50 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-300/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-200 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500"></div>
                            </div>
                            <div className="flex flex-col select-none">
                                <span className={`text-sm font-semibold transition-colors ${enableImageGen ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                  🎨 启用 AI 灵体画像 (Beta)
                                </span>
                                <span className="text-xs text-gray-500">
                                  {enableImageGen ? '已开启：AI 将为您绘制吉卜力风格灵魂肖像' : '已关闭：分析速度更快 (省流模式)'}
                                </span>
                            </div>
                        </label>
                      </div>*/}
                      {/* 🌶️ 模式选择开关 */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-2 flex relative">
                              <div className="flex w-full bg-black/40 rounded-xl p-1 relative z-0">
                                  {/* 滑块动画背景 */}
                                  <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out z-0 shadow-lg ${
                                      analysisMode === 'normal' 
                                      ? 'left-1 bg-gradient-to-r from-blue-500/80 to-purple-500/80' 
                                      : 'left-[calc(50%+2px)] bg-gradient-to-r from-orange-500 to-red-600'
                                  }`}></div>

                                  {/* 😇 普通模式按钮 */}
                                  <button 
                                      onClick={() => setAnalysisMode('normal')}
                                      className="flex-1 relative z-10 text-sm font-bold flex items-center justify-center gap-2 py-3 rounded-lg transition-colors text-white"
                                  >
                                      <span>😇</span> 
                                      <span className={analysisMode==='normal'?'':'text-gray-400'}>心灵导师</span>
                                  </button>

                                  {/* 😈 锐评模式按钮 */}
                                  <button 
                                      onClick={() => setAnalysisMode('roast')}
                                      className="flex-1 relative z-10 text-sm font-bold flex items-center justify-center gap-2 py-3 rounded-lg transition-colors text-white"
                                  >
                                      <span>😈</span>
                                      <span className={analysisMode==='roast'?'':'text-gray-400'}>毒舌锐评</span>
                                  </button>
                              </div>
                          </div>
                      {/* </div> */}
                      

                      // 提示语根据模式变化
                      <p className="text-purple-200/60 font-light text-lg">
                        {analysisMode === 'roast' 
                          ? 'AI 正在准备它的吐槽稿子 (成分复杂)...' 
                          : `正在分析 ${analyzedCount} 条记录...`}
                      </p>

                      {errorMsg && <p className="text-red-300 text-xs mt-3 pl-2 animate-pulse font-bold">⚠️ {errorMsg}</p>}

                      <div className="pt-2 flex flex-col gap-4">
                        <button 
                          onClick={handleStartAnalysis}
                          disabled={dataSource === 'url' && !inputVal}
                          className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold py-4 rounded-2xl hover:from-pink-300 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(236,72,153,0.3)] hover:shadow-[0_20px_40px_rgba(236,72,153,0.4)] transform hover:-translate-y-1 active:translate-y-0"
                        >
                          {dataSource === 'url' ? '启动全网抓取 & 分析' : '解析数据 & 生成报告'}
                        </button>

                        {dataSource === 'url' && (
                           <button 
                              onClick={handleDemo}
                              className="w-full bg-white/5 border border-white/10 text-purple-200 font-medium py-3 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 group"
                            >
                              <span>🔮 使用演示数据 (Demo)</span>
                            </button>
                        )}
                      </div>
                   </div>
               </div>
            </div>
          </div>
        )}

        {/* State: CRAWLING */}
        {state === AppState.CRAWLING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-2xl font-mono text-pink-300 animate-pulse drop-shadow-[0_0_15px_rgba(249,168,212,0.5)]">
              {dataSource === 'url' ? '多维数据提取中...' : '正在解析数据矩阵...'}
            </h2>
            <CrawlerTerminal logs={logs} />
          </div>
        )}

        {/* State: ANALYZING */}
        {state === AppState.ANALYZING && (
           <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 text-center animate-[fadeIn_0.5s_ease-out]">
             <div className="relative">
               <div className="w-40 h-40 rounded-full border-4 border-transparent border-t-pink-300 border-r-purple-300 animate-spin blur-md absolute inset-0"></div>
               <div className="w-40 h-40 rounded-full border-4 border-transparent border-t-pink-300 border-r-purple-300 animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-5xl animate-pulse grayscale-0">🧠</span>
               </div>
             </div>
             <div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-200 to-purple-200 mb-3">AI 正在深度解构</h2>
                <p className="text-purple-200/60 font-light text-lg">
                  正在基于 {analyzedCount} 条记录...
                  <br/>
                  <span className="text-sm mt-2 block text-purple-300/50">
                    {enableImageGen 
                      ? "正在绘制宫崎骏风格灵体画像 (可能需要 10s)..." 
                      : "快速文本分析模式..."}
                  </span>
                </p>
             </div>
             
             <div className="max-w-md w-full bg-white/5 backdrop-blur rounded-full h-2 overflow-hidden border border-white/10 shadow-inner">
               <div className="h-full bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 animate-[loading_2s_ease-in-out_infinite] w-[50%] blur-[1px]"></div>
             </div>
           </div>
        )}

        {/* State: ERROR */}
        {state === AppState.ERROR && (
           <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-[fadeIn_0.5s_ease-out]">
             <div className="text-6xl mb-4">💔</div>
             <h2 className="text-3xl font-bold text-red-300 drop-shadow-lg">连接中断</h2>
             <p className="text-purple-200/60 max-w-md bg-white/5 p-6 rounded-2xl border border-white/10 break-all">{errorMsg}</p>
             <button 
                onClick={handleReset}
                className="px-8 py-3 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-all text-white shadow-lg"
             >
               返回安全区
             </button>
           </div>
        )}

        {/* State: COMPLETE */}
        {state === AppState.COMPLETE && profile && (
          <AnalysisReport data={profile} username={uid} />
        )}

      </main>
    </div>
  );
};

export default App;