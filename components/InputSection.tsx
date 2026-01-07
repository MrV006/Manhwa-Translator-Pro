import React, { useState } from 'react';
import { Upload, Link as LinkIcon, AlertCircle, Search, ArrowLeft, Image as ImageIcon, Globe } from 'lucide-react';

interface Props {
  onUrlSubmit: (url: string) => void;
  onFilesSelected: (files: FileList) => void;
  loading: boolean;
}

export const InputSection: React.FC<Props> = ({ onUrlSubmit, onFilesSelected, loading }) => {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'select' | 'url' | 'upload'>('select');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onUrlSubmit(url);
  };

  if (mode === 'select') {
      return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in flex flex-col items-center justify-center min-h-[50vh]">
            <div className="text-center mb-10 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                ورودی تصاویر
              </h2>
              <p className="text-slate-400 text-lg">
                چگونه می‌خواهید چپتر را وارد کنید؟
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4">
                <button 
                    onClick={() => setMode('url')}
                    className="group relative overflow-hidden bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-primary rounded-2xl p-8 text-right transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
                >
                    <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-x-10 -translate-y-10 group-hover:bg-primary/20 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div className="bg-slate-900/50 w-14 h-14 rounded-xl flex items-center justify-center border border-slate-600 group-hover:border-primary group-hover:text-primary transition-colors">
                            <Globe size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">لینک وبسایت</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                آدرس صفحه مانگا را وارد کنید تا هوش مصنوعی تصاویر را استخراج کند.
                            </p>
                        </div>
                    </div>
                </button>

                <button 
                    onClick={() => setMode('upload')}
                    className="group relative overflow-hidden bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-indigo-400 rounded-2xl p-8 text-right transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                >
                     <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10 group-hover:bg-indigo-500/20 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div className="bg-slate-900/50 w-14 h-14 rounded-xl flex items-center justify-center border border-slate-600 group-hover:border-indigo-400 group-hover:text-indigo-400 transition-colors">
                            <Upload size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">آپلود فایل</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                فایل‌های تصویری دانلود شده را مستقیماً از سیستم خود انتخاب کنید.
                            </p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in py-10">
      <button 
        onClick={() => setMode('select')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        بازگشت به انتخاب روش
      </button>

      <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {mode === 'url' ? (
          <form onSubmit={handleUrlSubmit} className="space-y-6 relative z-10">
            <div className="text-center space-y-2 mb-8">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <LinkIcon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">دریافت از لینک</h3>
                <p className="text-sm text-slate-400">لینک صفحه چپتر مورد نظر را وارد کنید</p>
            </div>

            <div className="space-y-2">
              <div className="relative group">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/manga/chapter-1"
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-4 pl-12 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-left dir-ltr"
                  required
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 items-start">
              <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-blue-200/80 leading-relaxed">
                سیستم به طور خودکار تمام تصاویر موجود در صفحه (شامل Lazy-load) را اسکن می‌کند. در مرحله بعد می‌توانید تصاویر اضافی را حذف کنید.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  در حال استخراج...
                </>
              ) : (
                <>
                  دریافت تصاویر <ArrowLeft size={18} className="rotate-180"/>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6 relative z-10">
             <div className="text-center space-y-2 mb-8">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                    <ImageIcon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">آپلود از سیستم</h3>
                <p className="text-sm text-slate-400">فرمت‌های JPG, PNG, WEBP پشتیبانی می‌شوند</p>
            </div>

             <div className="border-2 border-dashed border-slate-600 rounded-2xl p-10 text-center hover:border-primary/50 hover:bg-slate-800/80 transition-all group cursor-pointer relative">
               <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
               />
               <div className="flex flex-col items-center justify-center gap-4 relative z-10">
                 <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Upload className="text-slate-400 group-hover:text-primary transition-colors" size={32} />
                 </div>
                 <div>
                   <h3 className="text-lg font-medium text-white mb-1 group-hover:text-primary transition-colors">کلیک کنید یا تصاویر را بکشید</h3>
                   <p className="text-sm text-slate-500">حداکثر حجم هر فایل ۲۰ مگابایت</p>
                 </div>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};