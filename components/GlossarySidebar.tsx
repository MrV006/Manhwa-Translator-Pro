import React, { useState } from 'react';
import { GlossaryItem, NewTerm } from '../types';
import { X, Plus, Trash2, Download, Upload, Copy, Book, Hash, FolderOpen, Key } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  glossary: GlossaryItem[];
  setGlossary: React.Dispatch<React.SetStateAction<GlossaryItem[]>>;
  currentProject: string;
  setCurrentProject: (name: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const GlossarySidebar: React.FC<Props> = ({
  isOpen,
  onClose,
  glossary,
  setGlossary,
  currentProject,
  setCurrentProject,
  apiKey,
  setApiKey
}) => {
  const [newTerm, setNewTerm] = useState({ term: '', translation: '', category: '#Names' });
  const [activeTab, setActiveTab] = useState<'list' | 'import' | 'export'>('list');

  // Filter glossary by current project
  const projectGlossary = glossary.filter(g => g.project === currentProject);

  const addTerm = () => {
    if (newTerm.term && newTerm.translation) {
      setGlossary(prev => [...prev, { 
        ...newTerm, 
        id: Math.random().toString(36), 
        project: currentProject 
      }]);
      setNewTerm({ ...newTerm, term: '', translation: '' });
    }
  };

  const deleteTerm = (id: string) => {
    setGlossary(prev => prev.filter(g => g.id !== id));
  };

  const handleExport = (format: 'txt' | 'word' | 'excel' | 'clipboard') => {
    let content = '';
    
    // Formatting logic as requested: English Persian #Tag
    if (format === 'txt' || format === 'clipboard') {
      content = projectGlossary.map(g => `${g.term} ${g.translation}\n${g.category}`).join('\n\n');
    } else if (format === 'excel') {
      content = "Term,Translation,Category,Project\n" + 
                projectGlossary.map(g => `${g.term},${g.translation},${g.category},${g.project}`).join('\n');
    } else if (format === 'word') {
       // Minimal HTML for Word
       content = `<html><body><table border="1"><tr><th>Term</th><th>Translation</th><th>Category</th></tr>
       ${projectGlossary.map(g => `<tr><td>${g.term}</td><td>${g.translation}</td><td>${g.category}</td></tr>`).join('')}
       </table></body></html>`;
    }

    if (format === 'clipboard') {
      navigator.clipboard.writeText(content);
      alert('کپی شد!');
    } else {
      const mime = format === 'excel' ? 'text/csv' : format === 'word' ? 'application/msword' : 'text/plain';
      const blob = new Blob(['\ufeff', content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glossary-${currentProject}.${format === 'excel' ? 'csv' : format === 'word' ? 'doc' : 'txt'}`;
      a.click();
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
          const text = evt.target?.result as string;
          // Simple parser: assumes "term translation" or CSV
          const lines = text.split('\n');
          const newItems: GlossaryItem[] = [];
          
          lines.forEach(line => {
              // Try comma first (CSV)
              let parts = line.split(',');
              if (parts.length < 2) parts = line.split(/\s+/); // Fallback to space split
              
              if (parts.length >= 2) {
                  const term = parts[0].trim();
                  const translation = parts[1].trim();
                  // Detect hash tag if present
                  let cat = '#Names';
                  if (line.includes('#')) {
                      const match = line.match(/(#[^\s]+)/);
                      if (match) cat = match[1];
                  } else if (parts[2] && parts[2].startsWith('#')) {
                      cat = parts[2].trim();
                  }

                  if (term && translation) {
                      newItems.push({
                          id: Math.random().toString(36),
                          term,
                          translation,
                          category: cat,
                          project: currentProject
                      });
                  }
              }
          });
          setGlossary(prev => [...prev, ...newItems]);
          alert(`${newItems.length} لغت اضافه شد.`);
      };
      reader.readAsText(file);
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-700 transform transition-transform duration-300 z-50 flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex flex-col bg-slate-800 space-y-3">
        <div className="flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2 text-white"><Book size={18} className="text-primary"/> تنظیمات و واژه</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>
        
        {/* API Key Input */}
        <div className="flex flex-col gap-1">
             <label className="text-[10px] text-slate-400 flex items-center gap-1"><Key size={10}/> Gemini API Key (اختیاری)</label>
             <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white placeholder-slate-600 focus:border-primary outline-none"
                placeholder="کلید API خود را اینجا وارد کنید..."
             />
        </div>

        {/* Project Name */}
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
            <FolderOpen size={16} className="text-slate-400" />
            <input 
                value={currentProject}
                onChange={(e) => setCurrentProject(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-slate-500"
                placeholder="نام پروژه (مثلا: Solo Leveling)"
            />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
          <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 text-xs font-medium ${activeTab === 'list' ? 'bg-slate-800 text-primary border-b-2 border-primary' : 'text-slate-400 hover:bg-slate-800'}`}>لیست لغات</button>
          <button onClick={() => setActiveTab('import')} className={`flex-1 py-3 text-xs font-medium ${activeTab === 'import' ? 'bg-slate-800 text-primary border-b-2 border-primary' : 'text-slate-400 hover:bg-slate-800'}`}>وارد کردن</button>
          <button onClick={() => setActiveTab('export')} className={`flex-1 py-3 text-xs font-medium ${activeTab === 'export' ? 'bg-slate-800 text-primary border-b-2 border-primary' : 'text-slate-400 hover:bg-slate-800'}`}>خروجی</button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'list' && (
            <div className="space-y-4">
                {/* Add New */}
                <div className="space-y-2 bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 font-bold mb-2">افزودن دستی</p>
                    <div className="flex gap-2">
                        <input 
                            placeholder="English" 
                            className="w-1/2 bg-slate-900 border border-slate-600 rounded p-1.5 text-xs text-left"
                            value={newTerm.term}
                            onChange={e => setNewTerm({...newTerm, term: e.target.value})}
                        />
                        <input 
                            placeholder="فارسی" 
                            className="w-1/2 bg-slate-900 border border-slate-600 rounded p-1.5 text-xs text-right"
                            value={newTerm.translation}
                            onChange={e => setNewTerm({...newTerm, translation: e.target.value})}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            className="w-full bg-slate-900 border border-slate-600 rounded p-1.5 text-xs text-slate-300"
                            value={newTerm.category}
                            onChange={e => setNewTerm({...newTerm, category: e.target.value})}
                        >
                            <option value="#Names">#Names (اسامی)</option>
                            <option value="#Places">#Places (مکان‌ها)</option>
                            <option value="#Skills">#Skills (فنون)</option>
                            <option value="#Other">#Other (سایر)</option>
                        </select>
                        <button onClick={addTerm} className="bg-primary text-white p-1.5 rounded w-10 flex items-center justify-center hover:bg-primary/90">
                            <Plus size={16}/>
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-2">
                    {projectGlossary.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 mt-10">هیچ لغتی برای این پروژه ثبت نشده.</p>
                    ) : (
                        projectGlossary.map(item => (
                            <div key={item.id} className="bg-slate-800/50 p-2 rounded border border-slate-700/50 flex flex-col gap-1 group">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-blue-300">{item.category}</span>
                                    </div>
                                    <button onClick={() => deleteTerm(item.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                                <div className="flex justify-between items-center text-xs px-1">
                                    <span className="text-slate-300">{item.term}</span>
                                    <span className="text-slate-500">→</span>
                                    <span className="text-primary font-medium">{item.translation}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {activeTab === 'import' && (
            <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-primary/50 cursor-pointer relative">
                    <input type="file" accept=".txt,.csv" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                    <Upload className="mx-auto text-slate-500 mb-2" size={24}/>
                    <p className="text-xs text-slate-400">آپلود فایل TXT یا CSV</p>
                    <p className="text-[10px] text-slate-600 mt-2">فرمت: Term Translation #Tag</p>
                </div>
                <div className="text-xs text-slate-500 leading-relaxed p-2">
                    <p>مثال فایل متنی:</p>
                    <div className="bg-black/30 p-2 rounded font-mono text-slate-400 mt-1" dir="ltr">
                        Jin-Woo جین-وو #Names<br/>
                        Seoul سئول #Places
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'export' && (
            <div className="space-y-3">
                <button onClick={() => handleExport('word')} className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-600/30 p-3 rounded-lg flex items-center gap-3 transition-colors">
                    <Book size={18}/> خروجی Word (Doc)
                </button>
                <button onClick={() => handleExport('excel')} className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-200 border border-green-600/30 p-3 rounded-lg flex items-center gap-3 transition-colors">
                    <Hash size={18}/> خروجی Excel (CSV)
                </button>
                <button onClick={() => handleExport('txt')} className="w-full bg-slate-600/20 hover:bg-slate-600/30 text-slate-200 border border-slate-600/30 p-3 rounded-lg flex items-center gap-3 transition-colors">
                    <Download size={18}/> خروجی Text
                </button>
                <div className="h-px bg-slate-700 my-2"></div>
                <button onClick={() => handleExport('clipboard')} className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <Copy size={18}/> کپی در کلیپ‌بورد
                </button>
                <p className="text-[10px] text-center text-slate-500 mt-2">فرمت کپی: English Persian #Hashtag</p>
            </div>
        )}
      </div>
    </div>
  );
};