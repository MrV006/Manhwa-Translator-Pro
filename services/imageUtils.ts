import { jsPDF } from "jspdf";
import { ManhwaImage, TranslationBlock } from "../types";

export const toBase64 = (url: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Local blobs (uploaded files)
      if (url.startsWith('blob:')) {
          const response = await fetch(url);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
             const base64String = reader.result as string;
             resolve(base64String.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
          return;
      }

      // Remote URLs
      let blob: Blob;
      try {
          // Try direct first
          const response = await fetch(url);
          if (!response.ok) throw new Error("Direct fetch failed");
          blob = await response.blob();
      } catch (e) {
          // Fallback to proxy
          try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error("Proxy fetch failed");
            blob = await response.blob();
          } catch (proxyError) {
             console.error("Both direct and proxy fetch failed for image", url);
             reject(proxyError);
             return;
          }
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
};

export const scrapeImagesFromUrl = async (targetUrl: string): Promise<string[]> => {
  try {
    let htmlContent = '';
    let usedFallback = false;

    // Strategy 1: AllOrigins (JSONP/CORS friendly)
    try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`AllOrigins status: ${response.status}`);
        
        const text = await response.text();
        
        // Safely parse JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (jsonError) {
            throw new Error("Invalid JSON response from proxy");
        }

        if (data && data.contents) {
            htmlContent = data.contents;
        } else {
            throw new Error("No contents in proxy response");
        }
    } catch (e) {
        console.warn("Primary proxy failed, switching to fallback:", e);
        usedFallback = true;
    }

    // Strategy 2: CorsProxy.io (Raw HTML) - if Strategy 1 failed
    if (usedFallback) {
        try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`CorsProxy status: ${response.status}`);
            htmlContent = await response.text();
        } catch (e) {
            console.error("Fallback proxy failed:", e);
            throw new Error("امکان دریافت محتوا از این سایت وجود ندارد. لطفا تصاویر را دانلود و دستی آپلود کنید.");
        }
    }

    if (!htmlContent || htmlContent.length < 50) {
        throw new Error("محتوای سایت خالی یا نامعتبر است.");
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const images = Array.from(doc.getElementsByTagName('img'));

    const validImages = images
      .map(img => {
        // PRIORITIZE DATA ATTRIBUTES FOR LAZY LOADING
        const possibleSrcs = [
            img.getAttribute('data-src'),
            img.getAttribute('data-original'),
            img.getAttribute('data-lazy-src'),
            img.getAttribute('data-url'),
            img.getAttribute('src') // Fallback to src last
        ];

        let src = possibleSrcs.find(s => s && s.trim().length > 0 && !s.startsWith('data:image/svg') && !s.startsWith('data:image/gif'));
        
        if (!src) return null;
        
        src = src.trim();
        
        // Handle Protocol-relative URLs
        if (src.startsWith('//')) {
            src = 'https:' + src;
        } 
        // Handle Root-relative URLs
        else if (src.startsWith('/')) {
            try {
                const urlObj = new URL(targetUrl);
                src = urlObj.origin + src;
            } catch(e) { return null; }
        } 
        // Handle Relative URLs
        else if (!src.startsWith('http') && !src.startsWith('data:')) {
            try {
                // Remove ./ at start
                if (src.startsWith('./')) src = src.substring(2);
                const urlObj = new URL(targetUrl);
                const basePath = urlObj.href.substring(0, urlObj.href.lastIndexOf('/') + 1);
                src = basePath + src;
            } catch(e) { return null; }
        }
        
        return src;
      })
      .filter((src): src is string => {
          if (!src) return false;
          const lower = src.toLowerCase();
          
          // REMOVED ALL KEYWORD FILTERS (logo, banner, etc.)
          // Only filtering strict technical incompatibilities
          if (lower.endsWith('.svg')) return false;
          
          return true;
      });

    // Remove duplicates
    const uniqueImages = Array.from(new Set(validImages));

    if (uniqueImages.length === 0) {
        throw new Error("هیچ تصویری در صفحه یافت نشد.");
    }

    return uniqueImages;
  } catch (error: any) {
    console.error("Scraping workflow error:", error);
    throw new Error(error.message || "خطا در پردازش لینک");
  }
};

const getImageProperties = (url: string): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({width: img.width, height: img.height});
        img.onerror = () => resolve({width: 600, height: 800}); // Fallback
        img.src = url;
    })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

export const generatePdf = async (images: ManhwaImage[], filename: string = 'chapter.pdf') => {
  const pdf = new jsPDF();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const maxContentWidth = pageWidth - (margin * 2);

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    if (i > 0) pdf.addPage();

    try {
        const imgProps = await getImageProperties(item.url);
        const scaleFactor = maxContentWidth / imgProps.width;
        const renderHeight = imgProps.height * scaleFactor;
        
        pdf.addImage(item.url, 'JPEG', margin, margin, maxContentWidth, renderHeight);
    } catch (e) {
        console.warn("Could not add image to PDF", e);
        pdf.text("Error loading image", 10, 10);
    }

    if (item.blocks && item.blocks.length > 0) {
      pdf.addPage(); 
      const textCanvas = document.createElement('canvas');
      textCanvas.width = 1200; 
      textCanvas.height = 1600; 
      const ctx = textCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';
        
        let y = 100;
        
        ctx.font = 'bold 50px "Vazirmatn", "Arial"';
        ctx.fillStyle = '#6366f1';
        ctx.fillText(`ترجمه صفحه ${i + 1}`, textCanvas.width - 50, y);
        y += 80;

        for (const block of item.blocks) {
             if (block.type === 'sfx') {
                 ctx.font = 'italic 35px "Vazirmatn"';
                 ctx.fillStyle = '#dc2626'; 
             } else if (block.type === 'thought') {
                 ctx.font = '35px "Vazirmatn"';
                 ctx.fillStyle = '#64748b'; 
             } else if (block.type === 'narration') {
                 ctx.font = 'bold 35px "Vazirmatn"';
                 ctx.fillStyle = '#0f172a'; 
             } else {
                 ctx.font = '40px "Vazirmatn"';
                 ctx.fillStyle = '#000000';
             }

             const lines = wrapText(ctx, block.text, textCanvas.width - 100);
             for (const line of lines) {
                  ctx.fillText(line, textCanvas.width - 50, y);
                  y += 50;
             }
             y += 30; 
        }

        const textDataUrl = textCanvas.toDataURL('image/jpeg', 0.8);
        pdf.addImage(textDataUrl, 'JPEG', margin, margin, maxContentWidth, pageHeight - (margin*2));
      }
    }
  }
  pdf.save(filename);
};

export const generateWord = (images: ManhwaImage[], filename: string = 'chapter.doc', includeSfx: boolean = true) => {
    let htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${filename}</title>
    <style>
      body { font-family: 'Tahoma', 'Arial', sans-serif; direction: rtl; text-align: right; line-height: 1.6; }
      .dialogue { color: #000; font-size: 14pt; margin-bottom: 24px; }
      .thought { color: #555; font-style: italic; font-size: 14pt; margin-bottom: 24px; }
      .narration { background-color: #f9f9f9; color: #333; font-size: 12pt; margin-bottom: 24px; padding: 5px; }
      .sfx { color: red; font-weight: bold; font-size: 12pt; margin-bottom: 24px; }
    </style>
    </head><body>`;

    // Flatten blocks to a continuous stream
    images.forEach((img) => {
        if (img.blocks && img.blocks.length > 0) {
            img.blocks.forEach(block => {
                if (!includeSfx && block.type === 'sfx') return;

                const className = block.type || 'dialogue';
                // User requested: one empty line between blocks. handled by margin-bottom: 24px (approx 1 empty line visually)
                // Also no page headers or page breaks.
                
                let text = block.text;
                // Add label only for specific types if needed, user didn't request labels in final output, just pure text flow.
                // Keeping it clean as per "Hello how are you?" example.
                
                if (block.type === 'sfx') text = `* ${text}`; // Add * for SFX as visual cue

                htmlContent += `<p class='${className}'>${text}</p>`;
            });
        }
    });

    htmlContent += "</body></html>";

    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};