import React, { useState } from 'react';
import { ManhwaImage, ProcessingStats, TranslationType } from '../types';
import { Download, RefreshCw, CheckCircle, AlertTriangle, FileText, Image as ImageIcon, Edit3, MessageSquare, Mic, Book, CloudLightning, FileType, ArrowRight, Pause, Play, Settings2 } from 'lucide-react';

interface Props {
  images: ManhwaImage[];
  stats: ProcessingStats;
  isProcessing: boolean;
  onProcessStart: (reset?: boolean) => void;
  onProcessStop: () => void;
  onGeneratePdf: () => void;
  onGenerateWord: (includeSfx: boolean) => void;
  onReset: () => void;
  onEditImage: (id: string) => void;
  onBack: () => void;
}

export const ProcessingSection: React.FC<Props> = ({ 
  images, 
  stats, 
  isProcessing, 
  onProcessStart, 
  onProcessStop,
  onGeneratePdf,
  onGenerateWord,
  onReset,
  onEditImage,
  onBack
}) => {
  const isFinished = stats.processed === stats.total && stats.total > 0;
  const isStarted = stats.processed > 0;
  const progressPercentage = stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;
  const [includeSfx, setIncludeSfx] = useState(true);

  const getTypeIcon = (type: TranslationType) => {
      switch(type) {
          case 'dialogue': return <MessageSquare size={14} className="text-blue-400" />;
          case 'thought': return <CloudLightning size={14} className="text-gray-400" />;
          case 'sfx': return <Mic size={14} className="text-red-400" />;
          case 'narration': return <Book size={14} className="text-yellow-400" />;
          default: return <FileText size={14} />;
      }
  };

  const getTypeLabel = (type: TranslationType) => {
      switch(type) {
          case 'dialogue': return 'دیالوگ';
          case 'thought': return 'فکر';
          case 'sfx': return 'افکت';
          case 'narration': return 'راوی';
          default: return 'متن';
      }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-[#0f172a]/95 backdrop-blur border-b border-slate-800 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex flex-col xl:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-4 w-full xl:w-auto">
                {!isProcessing && !isStarted && (
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ArrowRight size={20}/>
                    </button>
                )}
                <div>
                    <h2 className="font-bold text-white text-lg flex items-center gap-2">
                        داشبورد ترجمه
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{images.length} تصویر</span>
                    </h2>
                    <div className="flex gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {stats.success} موفق</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {stats.failed} ناموفق</span>
                    </div>
                </div>
            </div>

            {isProcessing && (
            <div className="flex-1 w-full xl:mx-8 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="flex justify-between text-xs text-slate-300 mb-2 font-medium">
                    <span className="flex items-center gap-2 text-primary animate-pulse"><RefreshCw size={12} className="animate-spin" /> در حال ترجمه هوشمند...</span>
                    <span>{progressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-primary h-full rounded-full transition-all duration-300" 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>
            )}

            <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-end">
                {/* Control Buttons */}
                {!isProcessing && !isFinished && !isStarted && (
                    <button
                    onClick={() => onProcessStart(false)}
                    className="flex-1 xl:flex-none bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-primary/25 active:scale-95 flex items-center justify-center gap-2"
                    >
                    <RefreshCw size={18}/> شروع ترجمه
                    </button>
                )}

                {isProcessing && (
                    <button
                    onClick={onProcessStop}
                    className="flex-1 xl:flex-none bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-6 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                    >
                    <Pause size={18}/> توقف
                    </button>
                )}

                {!isProcessing && isStarted && !isFinished && (
                    <>
                        <button
                        onClick={() => onProcessStart(false)}
                        className="flex-1 xl:flex-none bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-6 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                        >
                        <Play size={18}/> ادامه ترجمه
                        </button>
                        <button
                        onClick={() => {
                            if(confirm('آیا مطمئن هستید؟ تمام ترجمه‌های قبلی پاک شده و از اول شروع می‌شود.')) {
                                onProcessStart(true);
                            }
                        }}
                        className="flex-1 xl:flex-none bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                        <RefreshCw size={16}/> شروع مجدد
                        </button>
                    </>
                )}
                
                {/* Export Options */}
                {(isFinished || isStarted) && !isProcessing && (
                    <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <div className="flex items-center px-2 gap-2 border-l border-slate-700 pl-3">
                             <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={includeSfx} 
                                    onChange={e => setIncludeSfx(e.target.checked)} 
                                    className="accent-primary w-4 h-4 rounded"
                                />
                                خروجی با افکت صوتی
                             </label>
                        </div>
                        <button onClick={() => onGenerateWord(includeSfx)} className="flex items-center justify-center gap-2 text-blue-400 hover:bg-blue-600/10 px-3 py-1.5 rounded transition-colors text-xs font-bold">
                            <FileType size={16} /> Word
                        </button>
                        <button onClick={onGeneratePdf} className="flex items-center justify-center gap-2 text-green-400 hover:bg-green-600/10 px-3 py-1.5 rounded transition-colors text-xs font-bold">
                            <Download size={16} /> PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 custom-scrollbar">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((img, idx) => (
            <div key={img.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col hover:border-slate-600 transition-all group shadow-lg">
                {/* Image Area */}
                <div className="relative aspect-[2/3] bg-slate-900 group cursor-pointer overflow-hidden" onClick={() => onEditImage(img.id)}>
                <img 
                    src={img.url} 
                    alt={`Page ${idx + 1}`} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-mono text-white border border-white/10">
                    #{idx + 1}
                </div>
                
                {/* Hover Overlay for Edit */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/10 backdrop-blur text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-primary hover:scale-105 transition-all">
                            <Edit3 size={16} />
                            <span className="text-sm font-medium">ویرایش</span>
                        </div>
                </div>
                
                {/* Status Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex justify-between items-center">
                        {img.status === 'pending' && <span className="text-xs text-slate-300 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400"/> در انتظار</span>}
                        {img.status === 'waiting' && <span className="text-xs text-slate-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"/> در صف</span>}
                        {img.status === 'processing' && <span className="text-xs text-yellow-400 flex items-center gap-1.5"><RefreshCw size={12} className="animate-spin" /> پردازش</span>}
                        {img.status === 'completed' && <span className="text-xs text-green-400 flex items-center gap-1.5"><CheckCircle size={12} /> تکمیل</span>}
                        {img.status === 'error' && <span className="text-xs text-red-400 flex items-center gap-1.5"><AlertTriangle size={12} /> خطا</span>}
                    </div>
                </div>
                </div>
                
                {/* Translation Preview Area */}
                <div className="flex-1 bg-slate-800 flex flex-col border-t border-slate-700">
                <div className="p-2.5 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <FileText size={12} />
                    <span>متن‌ها</span>
                    </div>
                    {img.blocks && img.blocks.length > 0 && (
                        <span className="text-[10px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-600">
                        {img.blocks.length}
                        </span>
                    )}
                </div>
                
                <div className="flex-1 p-2 space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar bg-slate-900/30">
                    {img.blocks && img.blocks.length > 0 ? (
                    img.blocks.map((block, i) => (
                        <div key={i} className="bg-slate-800 border border-slate-700/50 p-2 rounded text-xs text-right hover:border-slate-600 transition-colors group/block">
                        <div className="flex items-center justify-between gap-1 mb-1 opacity-70">
                            <div className="opacity-0 group-hover/block:opacity-100 transition-opacity text-[10px] text-primary cursor-pointer">ویرایش</div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px]">{getTypeLabel(block.type)}</span>
                                {getTypeIcon(block.type)}
                            </div>
                        </div>
                        <p className={`leading-relaxed line-clamp-3 ${
                            block.type === 'sfx' ? 'text-red-300 font-bold' : 
                            block.type === 'thought' ? 'text-slate-400 italic' : 
                            block.type === 'narration' ? 'text-yellow-100/80 bg-slate-700/50 p-1 rounded' :
                            'text-slate-200'
                        }`}>
                            {block.text}
                        </p>
                        </div>
                    ))
                    ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 min-h-[100px]">
                        <MessageSquare size={16} className="opacity-20" />
                        <p className="text-[10px]">متنی یافت نشد</p>
                    </div>
                    )}
                </div>
                </div>
            </div>
            ))}
          </div>
      </div>
    </div>
  );
};