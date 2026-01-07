import React, { useState, useEffect, ReactNode } from 'react';
import { InputSection } from './components/InputSection';
import { SelectionSection } from './components/SelectionSection';
import { ProcessingSection } from './components/ProcessingSection';
import { GlossarySidebar } from './components/GlossarySidebar';
import { MainSidebar } from './components/MainSidebar';
import { ManhwaImage, AppStep, ProcessingStats, GlossaryItem, Genre, TranslationBlock, NewTerm } from './types';
import { scrapeImagesFromUrl, generatePdf, generateWord, toBase64 } from './services/imageUtils';
import { translateImage } from './services/gemini';
import { Edit2, Save, Plus, Trash2, Type as TypeIcon, Layout, Book, Menu, X } from 'lucide-react';

interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Explicitly declare props to avoid TypeScript error 'Property props does not exist on type ErrorBoundary'
  declare props: Readonly<ErrorBoundaryProps>;

  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: any) { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error(error, errorInfo); }
  render() {
    if (this.state.hasError) return <div className="p-10 text-center text-white">متاسفانه خطایی رخ داد. رفرش کنید.</div>;
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ManhwaImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Sidebar States
  const [isMainSidebarOpen, setIsMainSidebarOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // Settings & Data
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [genre, setGenre] = useState<Genre>('general');
  const [currentProject, setCurrentProject] = useState('MyManhwa');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('manhwa_translator_api_key') || '');
  const [detectedTerms, setDetectedTerms] = useState<NewTerm[]>([]);

  // Editor State
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const stopTranslationRef = React.useRef(false);

  useEffect(() => {
    localStorage.setItem('manhwa_translator_api_key', apiKey);
  }, [apiKey]);

  // Paste Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const newImages: ManhwaImage[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            newImages.push({
                id: Math.random().toString(36).substr(2, 9),
                url: URL.createObjectURL(blob),
                file: blob,
                status: 'pending',
                selected: true
            });
          }
        }
      }
      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages]);
        if (step === AppStep.INPUT) setStep(AppStep.SELECTION);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [step]);

  // Stats
  const selectedImages = images.filter(i => i.selected);
  const stats: ProcessingStats = {
    total: selectedImages.length,
    processed: selectedImages.filter(i => i.status === 'completed' || i.status === 'error').length,
    success: selectedImages.filter(i => i.status === 'completed').length,
    failed: selectedImages.filter(i => i.status === 'error').length
  };

  const handleUrlSubmit = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const imageUrls = await scrapeImagesFromUrl(url);
      setImages(prev => [...prev, ...imageUrls.map(u => ({
        id: Math.random().toString(36).substr(2, 9),
        url: u,
        status: 'pending' as const,
        selected: true
      }))]);
      setStep(AppStep.SELECTION);
    } catch (err: any) { setError(err.message || "خطا در دریافت تصاویر."); } 
    finally { setLoading(false); }
  };

  const handleFilesSelected = (files: FileList) => {
    setImages(prev => [...prev, ...Array.from(files).map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(f),
      file: f,
      status: 'pending' as const,
      selected: true
    }))]);
    setStep(AppStep.SELECTION);
  };

  const stopTranslation = () => {
    stopTranslationRef.current = true;
    setIsTranslating(false);
    // Reset 'processing' status back to 'pending' so it can be resumed
    setImages(prev => prev.map(img => img.status === 'processing' ? { ...img, status: 'pending' } : img));
  };

  const startTranslation = async (reset: boolean = false) => {
    if (isTranslating) return;
    setIsTranslating(true);
    stopTranslationRef.current = false;

    // Reset logic: clear everything if reset is true
    if (reset) {
        setImages(prev => prev.map(img => ({ ...img, status: 'pending', blocks: undefined })));
        // Tiny delay to ensure state updates before continuing
        await new Promise(r => setTimeout(r, 50));
    }

    // Determine queue: items that are selected AND (pending OR error)
    // We do NOT process 'completed' items unless reset was true (which turns them pending)
    const queue = images.filter(img => img.selected && (img.status === 'pending' || img.status === 'error'));
    
    // Set visual state to 'waiting' for queued items
    setImages(prev => prev.map(img => (img.selected && (img.status === 'pending' || img.status === 'error')) ? { ...img, status: 'waiting' } : img));

    // For context awareness, we need to know the *previous* image's translation.
    // We'll iterate through the *original* array order to find the previous completed one.
    
    for (const img of queue) {
        if (stopTranslationRef.current) break;
        
        // Find context from the immediately preceding selected image (if completed)
        let previousContext = "";
        const currentIndex = images.findIndex(i => i.id === img.id);
        if (currentIndex > 0) {
            // Find the closest previous selected image
            for(let i = currentIndex - 1; i >= 0; i--) {
                const prevImg = images[i];
                if (prevImg.selected) {
                    if (prevImg.status === 'completed' && prevImg.blocks && prevImg.blocks.length > 0) {
                        // Get the last text block
                        previousContext = prevImg.blocks[prevImg.blocks.length - 1].text;
                    }
                    break; // Stop looking after finding the immediate predecessor
                }
            }
        }

        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i));
        try {
            let base64 = img.base64;
            if (!base64) base64 = await toBase64(img.url);
            
            // Pass previousContext to translateImage
            const result = await translateImage(base64, genre, glossary, currentProject, apiKey, previousContext);
            
            if (result.detectedTerms.length > 0) {
                const newGlossaryItems: GlossaryItem[] = result.detectedTerms.map(t => ({
                   id: Math.random().toString(36),
                   term: t.original,
                   translation: t.translation,
                   category: t.category,
                   project: currentProject
                }));
                setGlossary(prev => {
                    const existingTerms = new Set(prev.map(p => p.term.toLowerCase()));
                    const filtered = newGlossaryItems.filter(n => !existingTerms.has(n.term.toLowerCase()));
                    return [...prev, ...filtered];
                });
            }
            setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'completed', base64: base64, blocks: result.blocks } : i));
        } catch (err) {
            console.error(err);
            setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error' } : i));
        }
    }
    setIsTranslating(false);
  };

  const editingImage = images.find(img => img.id === editingImageId);
  const updateBlock = (idx: number, field: any, val: any) => {
    if (!editingImage?.blocks) return;
    const newBlocks = [...editingImage.blocks];
    newBlocks[idx] = { ...newBlocks[idx], [field]: val };
    setImages(prev => prev.map(i => i.id === editingImageId ? { ...i, blocks: newBlocks } : i));
  };
  const addBlock = () => {
      if (!editingImage) return;
      const newBlocks = [...(editingImage.blocks || []), { type: 'dialogue', text: '' } as TranslationBlock];
      setImages(prev => prev.map(i => i.id === editingImageId ? { ...i, blocks: newBlocks } : i));
  };

  const handleReset = () => {
    setImages([]);
    setStep(AppStep.INPUT);
    setIsMainSidebarOpen(false);
  };

  // Back Navigation Logic
  const handleBack = () => {
      if (step === AppStep.SELECTION) {
          if(window.confirm('با بازگشت به صفحه قبل، تصاویر فعلی حذف خواهند شد. ادامه می‌دهید؟')) {
             setImages([]);
             setStep(AppStep.INPUT);
          }
      } else if (step === AppStep.DASHBOARD) {
          setStep(AppStep.SELECTION);
      }
  };

  return (
    <ErrorBoundary>
    <div className="flex h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-primary/30 overflow-hidden">
      
      {/* LEFT SIDEBAR (Main Navigation) */}
      <MainSidebar 
        isOpen={isMainSidebarOpen}
        setIsOpen={setIsMainSidebarOpen}
        currentProject={currentProject}
        setCurrentProject={setCurrentProject}
        apiKey={apiKey}
        setApiKey={setApiKey}
        genre={genre}
        setGenre={setGenre}
        onOpenGlossary={() => { setIsGlossaryOpen(true); setIsMainSidebarOpen(false); }}
        onReset={handleReset}
        step={step}
      />

      {/* RIGHT SIDEBAR (Glossary) */}
      <GlossarySidebar 
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        glossary={glossary}
        setGlossary={setGlossary}
        currentProject={currentProject}
        setCurrentProject={setCurrentProject}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />
      
      {/* Editor Modal Overlay */}
      {editingImage && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-fade-in">
              <div className="bg-slate-900 w-full max-w-6xl h-[90vh] rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-2xl relative">
                  <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2"><Edit2 size={18} className="text-primary"/> ویرایشگر هوشمند</h3>
                      <button onClick={() => setEditingImageId(null)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 flex items-center gap-2"><Save size={16}/> ذخیره</button>
                  </div>
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                      <div className="w-full md:w-1/2 bg-black flex items-center justify-center p-4 overflow-hidden"><img src={editingImage.url} className="max-w-full max-h-full object-contain"/></div>
                      <div className="w-full md:w-1/2 bg-slate-900 border-r border-slate-800 flex flex-col">
                          <div className="p-4 bg-slate-800/50 flex justify-between"><span className="text-sm">متن‌ها</span><button onClick={addBlock} className="text-xs bg-slate-700 px-2 py-1 rounded flex items-center gap-1"><Plus size={12}/> افزودن</button></div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                              {editingImage.blocks?.map((block, idx) => (
                                  <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-2 relative">
                                      <div className="flex justify-between items-center">
                                          <div className="flex gap-2">
                                              {['dialogue', 'thought', 'sfx', 'narration'].map(t => (
                                                  <button key={t} onClick={() => updateBlock(idx, 'type', t)} className={`p-1.5 rounded ${block.type === t ? 'bg-primary' : 'bg-slate-700 text-slate-400'}`}>{t === 'dialogue' && <TypeIcon size={12}/>}{t === 'thought' && <Layout size={12}/>}{t === 'sfx' && <TypeIcon size={12} className="font-bold"/>}{t === 'narration' && <Book size={12}/>}</button>
                                              ))}
                                          </div>
                                          <button onClick={() => {
                                              const newBlocks = editingImage.blocks!.filter((_, i) => i !== idx);
                                              setImages(prev => prev.map(img => img.id === editingImageId ? { ...img, blocks: newBlocks } : img));
                                          }} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
                                      </div>
                                      <textarea value={block.text} onChange={(e) => updateBlock(idx, 'text', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-right min-h-[60px]" dir="rtl"/>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
        
        {/* Mobile Header Toggle */}
        <div className="lg:hidden absolute top-4 right-4 z-40">
           <button onClick={() => setIsMainSidebarOpen(true)} className="p-2 bg-slate-800 rounded-lg text-white border border-slate-700 shadow-lg">
             <Menu size={24} />
           </button>
        </div>

        <main className="flex-1 w-full h-full overflow-y-auto relative bg-[#0f172a]">
           {error && (
             <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-fade-in backdrop-blur">
               <span>⚠️ {error}</span>
               <button onClick={() => setError(null)}><X size={16}/></button>
             </div>
           )}

           {step === AppStep.INPUT && (
             <InputSection onUrlSubmit={handleUrlSubmit} onFilesSelected={handleFilesSelected} loading={loading} />
           )}

           {step === AppStep.SELECTION && (
             <SelectionSection 
                 images={images}
                 onToggleSelect={(id) => setImages(prev => prev.map(img => img.id === id ? { ...img, selected: !img.selected } : img))}
                 onSelectAll={() => setImages(prev => prev.map(img => ({ ...img, selected: true })))}
                 onDeselectAll={() => setImages(prev => prev.map(img => ({ ...img, selected: false })))}
                 onConfirm={() => setStep(AppStep.DASHBOARD)}
                 onBack={handleBack}
             />
           )}

           {step === AppStep.DASHBOARD && (
             <ProcessingSection 
               images={selectedImages}
               stats={stats}
               isProcessing={isTranslating}
               onProcessStart={startTranslation}
               onProcessStop={stopTranslation}
               onGeneratePdf={() => generatePdf(selectedImages, `${currentProject}-chapter.pdf`)}
               onGenerateWord={(includeSfx) => generateWord(selectedImages, `${currentProject}-chapter.doc`, includeSfx)}
               onReset={handleReset}
               onEditImage={setEditingImageId}
               onBack={handleBack}
             />
           )}
        </main>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default App;