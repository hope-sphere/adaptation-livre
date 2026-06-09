import * as pdfjs from 'pdfjs-dist';

// Configure the pdfjs worker using a version-matched CDN to ensure Vite compatibility
const pdfjsVersion = (pdfjs as any).version || '4.10.38';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

export interface ParagraphElement {
  type: 'text';
  text: string;
}

export interface ImageElement {
  type: 'image';
  src: string; // Base64 data URL
}

export type SectionElement = ParagraphElement | ImageElement;

export interface Section {
  title: string;
  elements: SectionElement[];
}

export interface ParsedDocument {
  title: string;
  sections: Section[];
}

// Helper: Convert pdfjs image object (RGB/RGBA) to Base64 data URL
async function pdfImageToBase64(img: any): Promise<string> {
  return new Promise((resolve) => {
    try {
      if (!img || typeof img !== 'object') {
        resolve('');
        return;
      }

      const width = img.width;
      const height = img.height;
      if (!width || !height) {
        resolve('');
        return;
      }

      console.log('[pdfParser] [pdfImageToBase64] Début de la conversion en canvas, dimensions :', width, 'x', height);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn('[pdfParser] [pdfImageToBase64] Impossible d\'obtenir le contexte 2D du canvas.');
        resolve('');
        return;
      }

      const srcData = img.data;
      if (!srcData) {
        console.warn('[pdfParser] [pdfImageToBase64] Données d\'image (img.data) manquantes.');
        resolve('');
        return;
      }

      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      if (srcData.length === width * height * 3) {
        // RGB format
        let j = 0;
        for (let i = 0; i < srcData.length; i += 3) {
          data[j] = srcData[i];     // R
          data[j+1] = srcData[i+1]; // G
          data[j+2] = srcData[i+2]; // B
          data[j+3] = 255;          // A
          j += 4;
        }
      } else if (srcData.length === width * height * 4) {
        // RGBA format
        data.set(srcData);
      } else {
        // Greyscale or single-channel
        let j = 0;
        for (let i = 0; i < srcData.length; i++) {
          const val = srcData[i];
          data[j] = val;
          data[j+1] = val;
          data[j+2] = val;
          data[j+3] = 255;
          j += 4;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      console.log('[pdfParser] [pdfImageToBase64] Conversion réussie, longueur Base64 :', base64.length);
      resolve(base64);
    } catch (err) {
      console.error('[pdfParser] [pdfImageToBase64] Erreur lors de la conversion de l\'image en base64:', err);
      resolve('');
    }
  });
}

// Reconstruct a line from items grouped by Y coordinate
function reconstructLine(lineItems: any[]): { text: string; fontSize: number; y: number } {
  // Sort items from left to right (X coordinate)
  lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
  let text = '';
  let maxFontSize = 0;

  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    const fontSize = Math.abs(item.transform[3] || item.transform[0] || 10);
    if (fontSize > maxFontSize) maxFontSize = fontSize;

    if (i === 0) {
      text += item.str;
    } else {
      const prev = lineItems[i - 1];
      const gap = item.transform[4] - (prev.transform[4] + (prev.width || 0));
      
      if (prev.str.endsWith(' ') || item.str.startsWith(' ')) {
        text += item.str;
      } else if (gap > fontSize * 0.15) {
        text += ' ' + item.str;
      } else {
        text += item.str;
      }
    }
  }

  return {
    text: text.trim(),
    fontSize: maxFontSize,
    y: lineItems[0].transform[5]
  };
}

// Heuristic: Check if a line is likely a heading
function isHeading(line: { text: string; fontSize: number }, bodyFontSize: number): boolean {
  const text = line.text.trim();
  if (!text) return false;
  if (line.fontSize >= bodyFontSize * 1.25) return true;

  // Short uppercase lines without sentence punctuation
  const isShort = text.length < 80;
  const isUpper = text === text.toUpperCase() && /[A-Z]/.test(text);
  const noPunct = !/[.:;?!]$/.test(text);
  if (isShort && isUpper && noPunct && line.fontSize >= bodyFontSize * 1.05) {
    return true;
  }

  // Standard chapter words
  const chapterPattern = /^(chapitre|chapter|partie|section|épilogue|prologue|introduction|conclusion|préface|préambule)\b/i;
  const numberedPattern = /^\s*([IVXLCDM\d]+[\.\-]?\s+)+[A-Z\u00C0-\u00DC]/; // e.g. "I. Le Commencement"
  if (isShort && (chapterPattern.test(text) || numberedPattern.test(text))) {
    return true;
  }

  return false;
}

export async function parsePdf(file: File): Promise<ParsedDocument> {
  console.log('[pdfParser] Début de l\'analyse du fichier PDF :', file.name, 'Taille :', (file.size / 1024 / 1024).toFixed(2), 'Mo');
  console.log('[pdfParser] Worker PDF.js configuré sur :', pdfjs.GlobalWorkerOptions.workerSrc);
  
  console.log('[pdfParser] Lecture du fichier sous forme d\'ArrayBuffer...');
  const arrayBuffer = await file.arrayBuffer();
  console.log('[pdfParser] Lancement de la tâche de chargement PDF.js...');
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  const totalPages = pdfDoc.numPages;
  console.log('[pdfParser] Document PDF chargé avec succès. Nombre total de pages :', totalPages);
  const allLines: { text: string; fontSize: number; y: number; pageNum: number }[] = [];
  const pageImages: { [pageNum: number]: string[] } = {};

  // 1. First pass: extract text lines and images page by page
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    console.log(`[pdfParser] [Page ${pageNum}/${totalPages}] Début de l'analyse...`);
    const page = await pdfDoc.getPage(pageNum);
    console.log(`[pdfParser] [Page ${pageNum}/${totalPages}] Récupération du contenu textuel...`);
    const textContent = await page.getTextContent();
    const items = textContent.items.filter((item): item is any => 'str' in item);

    // Group items by Y coordinate
    // PDF coordinate system has Y increasing from bottom to top, so sort Y desc
    items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 4) return yDiff; // Different line
      return a.transform[4] - b.transform[4]; // Left to right
    });

    const pageLines: typeof allLines = [];
    let currentLineItems: any[] = [];

    for (const item of items) {
      if (currentLineItems.length === 0) {
        currentLineItems.push(item);
      } else {
        const prevItem = currentLineItems[currentLineItems.length - 1];
        const yDiff = Math.abs(item.transform[5] - prevItem.transform[5]);
        if (yDiff <= 4) {
          currentLineItems.push(item);
        } else {
          const recon = reconstructLine(currentLineItems);
          if (recon.text) {
            pageLines.push({ ...recon, pageNum });
          }
          currentLineItems = [item];
        }
      }
    }
    if (currentLineItems.length > 0) {
      const recon = reconstructLine(currentLineItems);
      if (recon.text) {
        pageLines.push({ ...recon, pageNum });
      }
    }

    allLines.push(...pageLines);
    console.log(`[pdfParser] [Page ${pageNum}/${totalPages}] Extraction de texte complétée. Lignes trouvées :`, pageLines.length);

    // Extract images from this page
    const images: string[] = [];
    try {
      console.log(`[pdfParser] [Page ${pageNum}/${totalPages}] Chargement de la liste des opérateurs pour recherche d'images...`);
      const opList = await page.getOperatorList();
      console.log(`[pdfParser] [Page ${pageNum}/${totalPages}] Opérateurs chargés. Recherche d'images (paintImageXObject / paintInlineImageXObject)...`);
      
      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        if (fn === (pdfjs as any).OPS.paintImageXObject || fn === (pdfjs as any).OPS.paintInlineImageXObject) {
          const imgKey = opList.argsArray[i][0];
          console.log(`[pdfParser] [Page ${pageNum}/${totalPages}] Image détectée (Clé : ${imgKey}). Résolution de l'objet...`);
          
          try {
            // Promise with safety timeout to prevent hanging on corrupted/missing images
            const img = await new Promise<any>((resolveImg) => {
              let resolved = false;
              const timeoutId = setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  console.warn(`[pdfParser] [Page ${pageNum}/${totalPages}] TIMEOUT (2s) lors du chargement de l'image "${imgKey}". L'image sera ignorée.`);
                  resolveImg(null);
                }
              }, 2000);

              page.objs.get(imgKey, (obj: any) => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timeoutId);
                  if (obj) {
                    console.log(`[pdfParser] [Page ${pageNum}/${totalPages}] Image "${imgKey}" résolue avec succès (largeur : ${obj.width}, hauteur : ${obj.height}).`);
                    resolveImg(obj);
                  } else {
                    console.warn(`[pdfParser] [Page ${pageNum}/${totalPages}] L'image "${imgKey}" est null ou non définie.`);
                    resolveImg(null);
                  }
                }
              });
            });

            if (img) {
              console.log(`[pdfParser] [Page ${pageNum}/${totalPages}] Conversion en Base64 de l'image "${imgKey}"...`);
              const base64 = await pdfImageToBase64(img);
              if (base64) {
                images.push(base64);
              }
            }
          } catch (e) {
            console.error(`[pdfParser] [Page ${pageNum}/${totalPages}] Erreur lors de la résolution de l'image "${imgKey}":`, e);
          }
        }
      }
    } catch (e) {
      console.warn(`[pdfParser] Impossible d'analyser la liste d'opérateurs sur la page ${pageNum}:`, e);
    }
    
    if (images.length > 0) {
      console.log(`[pdfParser] [Page ${pageNum}/${totalPages}] Total d'images valides extraites sur la page :`, images.length);
      pageImages[pageNum] = images;
    }
  }

  // 2. Determine the most frequent font size (assumed body font size)
  console.log('[pdfParser] Calcul de la taille de police principale (corps du texte)...');
  const fontSizes = allLines.map(l => Math.round(l.fontSize));
  const sizeCounts: { [size: number]: number } = {};
  let maxCount = 0;
  let bodyFontSize = 10; // Default fallback

  for (const size of fontSizes) {
    sizeCounts[size] = (sizeCounts[size] || 0) + 1;
    if (sizeCounts[size] > maxCount) {
      maxCount = sizeCounts[size];
      bodyFontSize = size;
    }
  }
  console.log('[pdfParser] Taille de police principale détectée :', bodyFontSize, 'pt (trouvée', maxCount, 'fois)');

  // 3. Second pass: structure into chapters/sections based on headings
  console.log('[pdfParser] Structuration des sections et chapitres...');
  const sections: Section[] = [];
  let currentSection: Section = {
    title: 'Introduction',
    elements: []
  };

  let lastPageNumWithImages = 0;

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    const prevLine = i > 0 ? allLines[i - 1] : null;

    // Check if we should insert images from the current page before this paragraph
    if (line.pageNum !== lastPageNumWithImages) {
      const images = pageImages[line.pageNum];
      if (images) {
        for (const img of images) {
          currentSection.elements.push({ type: 'image', src: img });
        }
      }
      lastPageNumWithImages = line.pageNum;
    }

    if (isHeading(line, bodyFontSize)) {
      // If the current section has elements, save it
      if (currentSection.elements.length > 0 || currentSection.title !== 'Introduction') {
        console.log(`[pdfParser] Clôture de la section "${currentSection.title}" avec ${currentSection.elements.length} éléments.`);
        sections.push(currentSection);
      }
      // Start a new section
      console.log(`[pdfParser] Nouveau chapitre détecté : "${line.text}" (Ligne ${i + 1}, Police: ${line.fontSize}pt)`);
      currentSection = {
        title: line.text,
        elements: []
      };
    } else {
      // Append text. Determine if this line starts a new paragraph or merges with the previous one
      let isNewParagraph = false;

      if (!prevLine || prevLine.pageNum !== line.pageNum) {
        // New page, check if previous line ended with paragraph terminator
        const textEnd = prevLine ? prevLine.text.trim() : '';
        isNewParagraph = !textEnd || /[.:;?!»"]$/.test(textEnd);
      } else {
        // Same page, check vertical gap
        const expectedGap = prevLine.fontSize * 1.5;
        const actualGap = Math.abs(prevLine.y - line.y);
        isNewParagraph = actualGap > expectedGap || /[.:;?!»"]$/.test(prevLine.text.trim());
      }

      if (isNewParagraph || currentSection.elements.length === 0) {
        currentSection.elements.push({ type: 'text', text: line.text });
      } else {
        // Merge with the last text element
        const lastEl = currentSection.elements[currentSection.elements.length - 1];
        if (lastEl.type === 'text') {
          lastEl.text += ' ' + line.text;
        } else {
          currentSection.elements.push({ type: 'text', text: line.text });
        }
      }
    }
  }

  // Save the last section
  if (currentSection.elements.length > 0 || sections.length === 0) {
    console.log(`[pdfParser] Clôture du dernier chapitre "${currentSection.title}" avec ${currentSection.elements.length} éléments.`);
    sections.push(currentSection);
  }

  // Deduce document title from name or first section title
  const cleanDocTitle = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');

  console.log('[pdfParser] Analyse PDF complétée avec succès ! Titre deduit :', cleanDocTitle, 'Sections :', sections.length);
  return {
    title: cleanDocTitle,
    sections
  };
}
