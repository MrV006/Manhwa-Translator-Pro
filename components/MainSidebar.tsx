import React from 'react';
import { BookOpen, Settings, Key, Hash, FileText, RefreshCw, Book, Menu, X, ChevronRight, Zap, Code } from 'lucide-react';
import { Genre } from '../types';

interface Props {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  currentProject: string;
  setCurrentProject: (val: string) => void;
  apiKey: string;
  setApiKey: (val: string) => void;
  genre: Genre;
  setGenre: (val: Genre) => void;
  onOpenGlossary: () => void;
  onReset: () => void;
  step: string;
}

export const MainSidebar: React.FC<Props> = ({
  isOpen,
  setIsOpen,
  currentProject,
  setCurrentProject,
  apiKey,
  setApiKey,
  genre,
  setGenre,
  onOpenGlossary,
  onReset,
  step
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static inset-y-0 right-0 z-50
        w-72 bg-slate-900 border-l border-slate-700
        transform transition-transform duration-300 ease-in-out
        flex flex-col shadow-2xl
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-primary to-purple-600 p-1.5 rounded-lg shadow-lg shadow-primary/20">
              <BookOpen className="text-white" size={20} />
            </div>
            <div>
                <h1 className="font-bold text-slate-100 tracking-tight leading-none">مترجم مانهوا</h1>
                <span className="text-[10px] text-primary font-bold tracking-widest">PRO EDITION</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* Project Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <FileText size={12}/> اطلاعات پروژه
            </h3>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-400">نام پروژه</label>
              <input
                type="text"
                value={currentProject}
                onChange={(e) => setCurrentProject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none transition-colors placeholder-slate-600"
                placeholder="مثلا: Solo Leveling Ch 10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">ژانر (جهت لحن ترجمه)</label>
              <div className="relative">
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as Genre)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none appearance-none cursor-pointer"
                >
                  <option value="general">عمومی (روان)</option>
                  <option value="wuxia">ووشیا (حماسی/تاریخی)</option>
                  <option value="system">سیستمی (گیمینگ)</option>
                  <option value="romance">عاشقانه (لطیف)</option>
                  <option value="school">مدرسه‌ای (عامیانه)</option>
                  <option value="fantasy">فانتزی (ماجراجویانه)</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* AI Configuration */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Zap size={12}/> تنظیمات هوش مصنوعی
            </h3>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-400 flex justify-between">
                <span>Gemini API Key</span>
                <span className="text-[10px] text-slate-500">(الزامی)</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 pl-8 text-sm text-white focus:border-primary outline-none transition-colors placeholder-slate-600 font-mono"
                  placeholder="کلید API خود را وارد کنید"
                />
                <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              </div>
              <p className="text-[10px] text-slate-500 leading-tight pt-1">
                کلید شما فقط در مرورگر ذخیره می‌شود.
              </p>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Tools */}
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Hash size={12}/> ابزارها
            </h3>
            
            <button 
              onClick={onOpenGlossary}
              className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-3 rounded-lg transition-all group"
            >
              <span className="flex items-center gap-2 text-sm"><Book size={16} className="text-blue-400"/> مدیریت واژه‌نامه</span>
              <ChevronRight size={16} className="text-slate-500 group-hover:-translate-x-1 transition-transform rotate-180" />
            </button>
          </div>

        </div>

        {/* Footer Actions & Branding */}
        <div className="border-t border-slate-700 bg-slate-900 flex flex-col">
           <div className="p-4 pb-2">
                <button 
                    onClick={() => {
                        if(window.confirm('آیا از شروع مجدد اطمینان دارید؟ تمام تغییرات فعلی حذف خواهند شد.')) {
                            onReset();
                        }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-lg text-sm transition-colors mb-4"
                >
                    <RefreshCw size={16} />
                    شروع مجدد / پروژه جدید
                </button>
           </div>
           
           {/* Mr.V Branding Signature */}
           <div className="py-3 bg-black/20 text-center border-t border-slate-800">
               <div className="flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default group">
                   <Code size={12} className="text-primary"/>
                   <span className="text-[10px] text-slate-400 font-mono">Developed by <span className="text-primary font-bold group-hover:text-white transition-colors">Mr.V</span></span>
               </div>
           </div>
        </div>
      </aside>
    </>
  );
};