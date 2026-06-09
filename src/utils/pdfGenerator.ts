import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { ParsedDocument } from './pdfParser';
import { transformParagraphToHtml, splitIntoSentences } from './textTransformer';
import type { HighlightTag, AdvancedColoringConfig } from './textTransformer';

export interface AppOptions {
  fontFamily: string;
  fontSize: number; // in pt
  lineHeight: number; // e.g. 1.5
  letterSpacing: number; // in px
  paragraphSpacing: number; // in px
  alignment: 'left' | 'justify' | 'center' | 'right';
  normalizeHeadings: boolean;
  showHeadingIcon: boolean;
  headingEmoji: string;
  showParagraphIcon: boolean;
  suppressImages: boolean;
  bgColor: string;
  textColor: string;
  maxPhrases: number;
  highlightTags: HighlightTag[];
  advancedColoring: AdvancedColoringConfig;
  outputFormat: 'pdf' | 'epub';
  headingBold: boolean;
  headingItalic: boolean;
  useHeadingCustomColor: boolean;
  headingColor: string;
  useHeadingBgColor: boolean;
  headingBgColor: string;
}

export async function generatePdf(
  doc: ParsedDocument,
  options: AppOptions,
  originalFilename: string
): Promise<void> {
  // 1. Create a hidden container for rendering the pages
  let wrapper = document.getElementById('pdf-render-wrapper');
  if (wrapper) {
    wrapper.innerHTML = '';
  } else {
    wrapper = document.createElement('div');
    wrapper.id = 'pdf-render-wrapper';
    document.body.appendChild(wrapper);
  }

  const pages: HTMLDivElement[] = [];

  // Helper: Create a styled page div
  function createPage(): HTMLDivElement {
    const page = document.createElement('div');
    page.className = 'pdf-page-container';
    
    // Set standard styles matching options
    page.style.width = '794px';
    page.style.height = '1123px';
    page.style.padding = '70px 60px'; // generous margins
    page.style.boxSizing = 'border-box';
    page.style.position = 'relative';
    page.style.overflow = 'hidden';
    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.backgroundColor = options.bgColor;
    page.style.color = options.textColor;
    page.style.fontFamily = options.fontFamily;
    page.style.fontSize = `${options.fontSize}pt`;
    page.style.lineHeight = `${options.lineHeight}`;
    page.style.letterSpacing = `${options.letterSpacing}px`;
    page.style.textAlign = options.alignment;

    wrapper!.appendChild(page);
    pages.push(page);
    return page;
  }

  // Helper: Calculate page height with an element appended
  function checkOverflow(page: HTMLDivElement, testElement: HTMLElement): boolean {
    page.appendChild(testElement);
    
    const elements = Array.from(page.children) as HTMLElement[];
    let totalHeight = 0;
    
    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const marginTop = parseFloat(style.marginTop) || 0;
      const marginBottom = parseFloat(style.marginBottom) || 0;
      totalHeight += el.getBoundingClientRect().height + marginTop + marginBottom;
    });

    page.removeChild(testElement);

    const maxContentHeight = 1123 - 140; // Total height minus top/bottom margins (70px * 2)
    return totalHeight > maxContentHeight;
  }

  // ----------------------------------------------------
  // Content Sections
  // ----------------------------------------------------
  let currentPage = createPage();

  for (let sIdx = 0; sIdx < doc.sections.length; sIdx++) {
    const section = doc.sections[sIdx];

    // Every chapter starts on a new page (unless the current page is completely empty)
    if (currentPage.children.length > 0) {
      currentPage = createPage();
    }

    // Render Chapter Title (only if it exists)
    if (section.title) {
      const h2 = document.createElement('h2');
      let titleText = section.title;
      if (options.normalizeHeadings) {
        // Normalize: Numbering + Capitalized first letter only + Underline
        titleText = `${sIdx + 1}. ${titleText.charAt(0).toUpperCase() + titleText.slice(1).toLowerCase()}`;
        h2.style.textDecoration = 'underline';
      }
      
      // Add PDF benchmark indicator: replace emoji with '>'
      if (options.showHeadingIcon) {
        titleText = `> ${titleText}`;
      }
      
      h2.innerText = titleText;
      h2.style.fontSize = `${options.fontSize * 1.35}pt`;
      h2.style.fontWeight = options.headingBold ? 'bold' : 'normal';
      h2.style.fontStyle = options.headingItalic ? 'italic' : 'normal';
      h2.style.marginTop = '0px';
      h2.style.marginBottom = `${options.paragraphSpacing * 1.25}px`;
      h2.style.color = options.useHeadingCustomColor ? options.headingColor : options.textColor;
      h2.style.textAlign = 'center';

      if (options.useHeadingBgColor) {
        h2.style.backgroundColor = options.headingBgColor;
        h2.style.padding = '8px 16px';
        h2.style.display = 'inline-block';
        h2.style.border = '2px solid #000';
        h2.style.boxShadow = '2px 2px 0px #000';
        h2.style.alignSelf = 'center';
      } else {
        h2.style.backgroundColor = 'transparent';
        h2.style.alignSelf = 'stretch';
      }
      
      if (checkOverflow(currentPage, h2)) {
        // If the heading alone overflows the empty page, force add it
        currentPage.appendChild(h2);
      } else {
        currentPage.appendChild(h2);
      }
    }

    // Process elements in this section
    for (const element of section.elements) {
      if (element.type === 'image') {
        if (options.suppressImages) continue;

        // Render Image
        const img = document.createElement('img');
        img.src = element.src;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '300px';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.style.margin = `${options.paragraphSpacing}px auto`;
        img.style.borderRadius = '4px';

        if (checkOverflow(currentPage, img)) {
          // Move to a new page
          currentPage = createPage();
          currentPage.appendChild(img);
        } else {
          currentPage.appendChild(img);
        }
      } else if (element.type === 'text') {
        // Split text into paragraph blocks based on options
        const sentences = splitIntoSentences(element.text);
        if (sentences.length === 0) continue;

        // Group sentences into blocks of maxPhrases
        const blocks: string[][] = [];
        const maxPhrases = options.maxPhrases > 0 ? options.maxPhrases : sentences.length;
        for (let i = 0; i < sentences.length; i += maxPhrases) {
          blocks.push(sentences.slice(i, i + maxPhrases));
        }

        // Add blocks one by one
        for (const blockSentences of blocks) {
          // Check if the block fits as a whole
          const p = document.createElement('p');
          p.style.marginBottom = `${options.paragraphSpacing}px`;
          p.style.marginTop = '0px';
          
          let prefix = '';
          if (options.showParagraphIcon) {
            prefix = '<span style="margin-right: 8px; font-weight: bold;">&gt;</span>';
          }

          const rawText = blockSentences.join(' ');
          const formattedHtml = transformParagraphToHtml(rawText, options.highlightTags, options.advancedColoring);
          p.innerHTML = prefix + formattedHtml;

          if (!checkOverflow(currentPage, p)) {
            currentPage.appendChild(p);
          } else {
            // The block overflows. Split block sentence-by-sentence to fill the page exactly.
            let sentencesToAdd = [...blockSentences];
            let currentBlockSentences: string[] = [];

            while (sentencesToAdd.length > 0) {
              const nextSentence = sentencesToAdd[0];
              const testP = document.createElement('p');
              testP.style.marginBottom = `${options.paragraphSpacing}px`;
              testP.style.marginTop = '0px';
              
              const testText = [...currentBlockSentences, nextSentence].join(' ');
              testP.innerHTML = prefix + transformParagraphToHtml(testText, options.highlightTags, options.advancedColoring);

              if (!checkOverflow(currentPage, testP)) {
                // It fits! Add it to the current block accumulator
                currentBlockSentences.push(nextSentence);
                sentencesToAdd.shift();
              } else {
                // It overflows! Write whatever we accumulated to the current page
                if (currentBlockSentences.length > 0) {
                  const finalP = document.createElement('p');
                  finalP.style.marginBottom = `${options.paragraphSpacing}px`;
                  finalP.style.marginTop = '0px';
                  const text = currentBlockSentences.join(' ');
                  finalP.innerHTML = prefix + transformParagraphToHtml(text, options.highlightTags, options.advancedColoring);
                  currentPage.appendChild(finalP);
                  currentBlockSentences = [];
                }

                // Start a new page
                currentPage = createPage();
                
                // If the single next sentence overflows the empty page, force-add it
                const singleP = document.createElement('p');
                singleP.style.marginBottom = `${options.paragraphSpacing}px`;
                singleP.style.marginTop = '0px';
                singleP.innerHTML = prefix + transformParagraphToHtml(nextSentence, options.highlightTags, options.advancedColoring);
                
                if (checkOverflow(currentPage, singleP)) {
                  currentPage.appendChild(singleP);
                  sentencesToAdd.shift();
                } else {
                  currentBlockSentences.push(nextSentence);
                  sentencesToAdd.shift();
                }
              }
            }

            // Write any remaining accumulated sentences
            if (currentBlockSentences.length > 0) {
              const finalP = document.createElement('p');
              finalP.style.marginBottom = `${options.paragraphSpacing}px`;
              finalP.style.marginTop = '0px';
              const text = currentBlockSentences.join(' ');
              finalP.innerHTML = prefix + transformParagraphToHtml(text, options.highlightTags, options.advancedColoring);
              currentPage.appendChild(finalP);
            }
          }
        }
      }
    }
  }

  // Ensure fonts are fully loaded prior to rendering canvas
  await document.fonts.ready;

  // 3. Compile pages to PDF using html2canvas & jsPDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let idx = 0; idx < pages.length; idx++) {
    const pageEl = pages[idx];
    
    // Render the page to a canvas
    const canvas = await html2canvas(pageEl, {
      scale: 2, // High resolution (approx 192 DPI)
      useCORS: true,
      logging: false,
      backgroundColor: options.bgColor,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    if (idx > 0) {
      pdf.addPage();
    }

    // A4 dimensions are 210mm x 297mm
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  }

  // 4. Save file and clean up the hidden DOM
  const outName = originalFilename.replace(/\.[^/.]+$/, '') + '_converti.pdf';
  pdf.save(outName);
  
  if (wrapper.parentNode) {
    wrapper.parentNode.removeChild(wrapper);
  }
}
