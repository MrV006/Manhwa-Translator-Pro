import React from 'react';
import { ManhwaImage } from '../types';
import { Check, CheckCircle2, Circle, ArrowRight, Trash2 } from 'lucide-react';

interface Props {
  images: ManhwaImage[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const SelectionSection: React.FC<Props> = ({
  images,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onConfirm,
  onBack
}) => {
  const selectedCount = images.filter(i => i.selected).length;

  return (
    <div className="flex flex-col h-full relative">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#0f172a]/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
         <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                 <ArrowRight size={20}/>
             </button>
             <div>
                <h2 className="text-lg font-bold text-white">انتخاب تصاویر</h2>
                <p className="text-xs text-slate-400">تعداد: {images.length} | انتخاب شده: {selectedCount}</p>
             </div>
         </div>
         <div className="flex gap-2">
            <button onClick={onSelectAll} className="hidden sm:block px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                همه
            </button>
            <button onClick={onDeselectAll} className="hidden sm:block px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                هیچکدام
            </button>
         </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {images.map((img, idx) => (
            <div 
                key={img.id}
                onClick={() => onToggleSelect(img.id)}
                className={`relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 border-2 shadow-lg ${
                img.selected ? 'border-primary ring-2 ring-primary/30 scale-95' : 'border-slate-700 hover:border-slate-500'
                }`}
            >
                <img src={img.url} className="w-full h-full object-cover" loading="lazy" alt={`page-${idx}`}/>
                
                <div className={`absolute inset-0 bg-black/40 transition-opacity ${img.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                
                <div className="absolute top-2 right-2 z-10">
                {img.selected ? (
                    <CheckCircle2 className="text-primary fill-white" size={24} />
                ) : (
                    <Circle className="text-white/70 drop-shadow-md" size={24} />
                )}
                </div>
                
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono backdrop-blur-sm">
                    #{idx + 1}
                </div>
            </div>
            ))}
        </div>
      </div>
      
      {/* Sticky Bottom Action Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
          <button 
            onClick={onConfirm}
            disabled={selectedCount === 0}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center justify-center gap-3 transform active:scale-95"
          >
            <span className="text-lg">تایید و شروع ترجمه</span>
            <div className="bg-white/20 rounded-full p-1">
                <Check size={16} />
            </div>
          </button>
      </div>
    </div>
  );
};