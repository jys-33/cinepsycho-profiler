
import React, { useRef, useState } from 'react';
import { FullProfile } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, Tooltip, Cell
} from 'recharts';
import html2canvas from 'html2canvas';

interface AnalysisReportProps {
  data: FullProfile;
  username: string;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ data, username }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fix Logic: Sometimes Gemini returns 0-1 instead of 0-100. Normalize it.
  const normalizeScore = (val: number) => (val <= 1 && val > 0) ? val * 100 : val;

  const radarData = [
    { subject: '开放性', A: normalizeScore(data.layer3.openness), fullMark: 100 },
    { subject: '尽责性', A: normalizeScore(data.layer3.conscientiousness), fullMark: 100 },
    { subject: '外向性', A: normalizeScore(data.layer3.extraversion), fullMark: 100 },
    { subject: '宜人性', A: normalizeScore(data.layer3.agreeableness), fullMark: 100 },
    { subject: '神经质', A: normalizeScore(data.layer3.neuroticism), fullMark: 100 },
  ];

  const macaronColors = ['#F9A8D4', '#93C5FD', '#6EE7B7', '#C4B5FD', '#FCD34D'];

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    
    setIsDownloading(true);
    try {
        const canvas = await html2canvas(reportRef.current, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#110e1b', 
            scale: 2, 
            logging: false
        });

        const link = document.createElement('a');
        link.download = `${username}_psycho_profile.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error("Screenshot failed", err);
        alert("生成图片失败，请稍后重试");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20">
      
      {/* Controls */}
      <div className="flex justify-end mb-4 animate-[fadeIn_1s_ease-out]">
         <button 
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold rounded-full transition-all shadow-lg transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
         >
            {isDownloading ? '📷 生成长图中...' : '📸 下载完整画像 (长图)'}
         </button>
      </div>

      {/* Main Report Container to Capture */}
      <div 
        ref={reportRef} 
        className="space-y-12 animate-[fadeIn_1s_ease-out] text-gray-800 p-8 md:p-12 rounded-[3rem] bg-[#110e1b] relative overflow-hidden"
      >
        {/* Decorative background for the screenshot */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
             <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-purple-400/10 blur-[100px] rounded-full"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-blue-300/10 blur-[100px] rounded-full"></div>
        </div>
      
        {/* Header Profile Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 md:p-12 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(255,255,255,0.1)] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden z-10">
          
          <div className="flex-shrink-0 relative z-10">
            <div className="w-56 h-56 rounded-[2rem] overflow-hidden bg-gradient-to-tr from-purple-200 to-pink-200 border-4 border-white/30 shadow-[0_10px_40px_rgba(244,114,182,0.3)] flex items-center justify-center relative">
               {data.avatarBase64 ? (
                 <img src={`data:image/png;base64,${data.avatarBase64}`} alt="Soul Avatar" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-6xl drop-shadow-md">🔮</span>
               )}
               <div className="absolute bottom-2 right-2 text-[10px] text-white/50 px-2 py-1 bg-black/20 rounded-full backdrop-blur-sm">Ghibli Style</div>
            </div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur text-purple-600 font-bold px-4 py-1.5 rounded-full text-xs shadow-lg whitespace-nowrap border border-white/40">
              {data.layer3.archetype}
            </div>
          </div>

          <div className="flex-grow text-center md:text-left z-10 space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-4 justify-center md:justify-start">
               <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 drop-shadow-sm pb-1">
                {username}
              </h1>
              {data.layer3.mbti && (
                <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-teal-200 to-emerald-200 text-teal-800 text-sm font-bold shadow-md border border-white/50">
                  {data.layer3.mbti}
                </span>
              )}
            </div>
            
            <p className="text-gray-100/90 leading-relaxed text-lg font-light tracking-wide max-w-2xl">
              {data.overallSummary}
            </p>
          </div>
        </div>

        {/* Golden Quotes Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="md:col-span-3 mb-2">
             <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-200 text-center md:text-left flex items-center gap-2">
               <span>✨</span> 灵光一现 (Golden Highlights)
             </h3>
          </div>
          {data.highlightReviews?.map((item, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl relative">
               <div className="absolute -top-3 -right-3 text-4xl opacity-20 text-white">❝</div>
               <p className="text-gray-200 italic font-serif text-lg mb-4 leading-relaxed">"{item.quote}"</p>
               <div className="flex justify-between items-end border-t border-white/10 pt-3">
                 <div className="flex items-center gap-2">
                   <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">
                      {item.category === 'book' ? '书' : item.category === 'music' ? '音' : '影'}
                   </span>
                   <span className="text-xs text-pink-300 font-bold uppercase tracking-wider">{item.title}</span>
                 </div>
                 <span className="text-[10px] text-gray-400 max-w-[50%] text-right">{item.commentary}</span>
               </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          
          {/* Layer 1: Aesthetics */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2.5rem] relative">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-2xl font-bold text-pink-300">Layer 1: 审美与好恶</h3>
            </div>
            
            {/* Chart */}
            <div className="h-64 mb-8">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.layer1.topGenres} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis 
                        dataKey="name" 
                        stroke="#a5b4fc" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        interval={0} // Force show all labels
                        angle={-15}  // Rotate slightly to avoid overlap
                        textAnchor="end"
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#181524', border: '1px solid #ffffff20', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                      {data.layer1.topGenres.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={macaronColors[index % macaronColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            
            {/* Deep Love/Hate + Books/Music */}
            <div className="space-y-4">
               <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-200/20">
                 <span className="block text-blue-300 font-bold mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                   ❤️ 挚爱 (Why You Love)
                 </span>
                 <p className="text-gray-300 text-sm leading-relaxed">{data.layer1.favoritesAnalysis}</p>
               </div>
               <div className="bg-red-500/10 p-5 rounded-2xl border border-red-200/20">
                 <span className="block text-red-300 font-bold mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                   ⚡ 雷点 (Why You Hate)
                 </span>
                 <p className="text-gray-300 text-sm leading-relaxed">{data.layer1.hatedAnalysis}</p>
               </div>
               {/*{data.layer1.bookMusicAnalysis && (
                  <div className="bg-green-500/10 p-5 rounded-2xl border border-green-200/20">
                      <span className="block text-green-300 font-bold mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                          📚🎵 书音品味
                      </span>
                      <p className="text-gray-300 text-sm leading-relaxed">{data.layer1.bookMusicAnalysis}</p>
                  </div>
               )}*/}
            </div>
          </div>

          {/* Layer 3: Personality */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-bold text-blue-300">Layer 3: 人格模型</h3>
            </div>
            <div className="h-80 flex justify-center items-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#c4b5fd', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="#818cf8"
                    strokeWidth={4}
                    fill="#c4b5fd"
                    fillOpacity={0.5}
                  />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#181524', border: '1px solid #ffffff20', borderRadius: '12px', color: '#fff' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
               <p className="text-sm text-gray-300 italic px-4 leading-relaxed bg-white/5 py-4 rounded-2xl border border-white/5">
                  "{data.layer3.summary}"
               </p>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          
          {/* Layer 2: Cognitive */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden">
            <h3 className="text-2xl font-bold text-emerald-300 mb-8">Layer 2: 认知水平</h3>
            
            <div className="space-y-8">
              <div className="relative pt-6">
                <div className="flex justify-between text-xs mb-3 text-gray-400 font-bold tracking-widest px-2">
                  <span>EMOTION</span>
                  <span>LOGIC</span>
                </div>
                <div className="h-4 bg-gray-700/30 rounded-full overflow-hidden flex relative shadow-inner">
                  <div style={{ width: `${normalizeScore(data.layer2.emotionalScore)}%` }} className="bg-gradient-to-r from-pink-300 to-rose-300 h-full"></div>
                  <div style={{ width: `${normalizeScore(data.layer2.logicScore)}%` }} className="bg-gradient-to-r from-blue-300 to-cyan-300 h-full"></div>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 transform -translate-x-1/2"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block mb-2">词汇复杂度</span>
                    <p className="text-xl font-bold text-gray-100">{data.layer2.vocabularyComplexity}</p>
                 </div>
                 <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block mb-2">批判性思维</span>
                    <p className="text-xl font-bold text-gray-100">{data.layer2.criticalThinkingLevel}</p>
                 </div>
              </div>
              {data.layer2.writingStyleAnalysis && (
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">✍️ 笔触风格</span>
                    <p className="text-gray-300 text-sm leading-relaxed italic">{data.layer2.writingStyleAnalysis}</p>
                 </div>
              )}
              <p className="text-gray-300 text-sm leading-7 pl-2 border-l-2 border-emerald-500/30">
                {data.layer2.summary}
              </p>
            </div>
          </div>

          {/* Layer 4: Philosophy & Ideologies */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden">
             <h3 className="text-2xl font-bold text-purple-300 mb-8">Layer 4: 哲学与主义</h3>
             
             <div className="space-y-6">
                <div className="flex flex-wrap gap-3 mb-6">
                   <div className="px-4 py-2 border border-purple-400/30 bg-purple-500/10 text-purple-200 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm">
                     {data.layer4.moralAlignment}
                   </div>
                   {/* Ideology Badges */}
                   {data.layer4.ideologies?.map((ism, i) => (
                      <div key={i} className="px-4 py-2 bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-400/30 text-pink-200 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm">
                        {ism}
                      </div>
                   ))}
                </div>

                <div className="space-y-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider pl-1">核心价值观</span>
                  <div className="flex flex-wrap gap-2">
                     {data.layer4.coreValues.map(v => (
                       <span key={v} className="px-3 py-1.5 bg-white/10 text-gray-100 rounded-lg text-sm border border-white/10">
                         {v}
                       </span>
                     ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white/5 to-transparent p-6 rounded-3xl border border-white/5 mt-4">
                   <p className="text-gray-200 italic font-serif leading-relaxed text-center px-2">
                     "{data.layer4.lifeViewSummary}"
                   </p>
                   <div className="mt-4 text-center border-t border-white/5 pt-3">
                      <span className="text-xs text-purple-300 uppercase tracking-widest font-bold">哲学倾向: {data.layer4.philosophicalLeaning}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* NEW: Soul Resonance Recommendations */}
        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem]">
            <div className="mb-6">
               <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-cyan-200 flex items-center gap-2">
                 <span>🔮</span> 灵魂共振 (Soul Resonance)
               </h3>
               <p className="text-gray-400 text-sm mt-2 font-light">基于你的人格原型推荐的精神食粮</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.recommendations?.map((rec, i) => (
                    <div key={i} className="bg-[#181524]/50 border border-white/10 rounded-2xl p-5 hover:bg-white/5 transition-colors group">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">{rec.title}</span>
                            <span className="text-[10px] px-2 py-1 rounded bg-white/10 text-gray-300 uppercase">
                                {rec.type === 'book' ? '书' : rec.type === 'music' ? '音' : '影'}
                            </span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed">{rec.reason}</p>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisReport;
