import React from 'react';
import { BookOpen, FileText, CheckCircle } from 'lucide-react';
import type { ParsedDocument } from '../utils/pdfParser';
import type { AppOptions } from '../utils/pdfGenerator';
import { transformParagraphToHtml, splitParagraphIntoBlocks } from '../utils/textTransformer';

interface PreviewProps {
  document: ParsedDocument;
  options: AppOptions;
}

export const Preview: React.FC<PreviewProps> = ({ document: doc, options }) => {
  // Calculate total paragraphs
  const totalParagraphs = doc.sections.reduce(
    (acc, section) => 
      acc + section.elements.filter((el) => el.type === 'text').length, 
    0
  );

  // Helper: Format section heading
  const getHeadingText = (title: string, index: number) => {
    let text = title;
    if (options.normalizeHeadings) {
      text = `${index + 1}. ${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`;
    }
    return text;
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-zinc-900 border-l-[3px] border-black relative">
      <div className="absolute inset-0 halftone-overlay pointer-events-none opacity-[0.02] z-0"></div>

      {/* Stats Banner */}
      <div className="px-6 py-3.5 bg-zinc-950 border-b-[3px] border-black flex items-center justify-between text-xs flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <span className="comic-bubble bg-purple-500/10 text-white border-black flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#000]">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span><strong className="text-white">{doc.sections.length}</strong> Section{doc.sections.length > 1 ? 's' : ''}</span>
          </span>
          <span className="comic-bubble bg-blue-500/10 text-white border-black flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#000]">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span><strong className="text-white">{totalParagraphs}</strong> Paragraphe{totalParagraphs > 1 ? 's' : ''}</span>
          </span>
        </div>
        <div className="comic-bubble bg-emerald-400 text-black border-black font-extrabold uppercase tracking-wide text-[10px] shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" /> Synchronisé en direct
        </div>
      </div>

      {/* Book Content Preview Area (Fixed height scroll container) */}
      <div 
        className="flex-1 overflow-y-auto p-12 transition-all duration-300 z-10 scrollbar-thin scroll-smooth"
        style={{
          backgroundColor: options.bgColor,
          color: options.textColor,
          fontFamily: options.fontFamily,
          fontSize: `${options.fontSize}pt`,
          lineHeight: options.lineHeight,
          letterSpacing: `${options.letterSpacing}px`,
          textAlign: options.alignment,
        }}
      >
        <div className="max-w-2xl mx-auto space-y-12 pb-32">
          {/* Document Main Title (Simulated Book Title) */}
          <div className="border-b-[3px] border-current/25 pb-8 text-center">
            <h1 
              style={{ fontSize: '2em', color: options.textColor }} 
              className="font-extrabold mb-3 tracking-tight leading-tight uppercase"
            >
              {doc.title}
            </h1>
            <span 
              className="comic-bubble bg-zinc-950 text-white border-current/40 text-[10px] font-bold uppercase py-0.5 px-3 shadow-[1.5px_1.5px_0px_currentColor]"
            >
              Aperçu Adapté
            </span>
          </div>

          {/* Chapters Render */}
          {doc.sections.map((section, sIdx) => {
            const headingText = getHeadingText(section.title, sIdx);
            
            return (
              <section key={sIdx} className="space-y-6">
                {/* Chapter Heading wrapper for centering */}
                <div className="text-center w-full" style={{ marginTop: '2.5em', marginBottom: '1.5em' }}>
                  <h2
                    style={{
                      fontSize: '1.4em',
                      fontWeight: options.headingBold ? 'bold' : 'normal',
                      fontStyle: options.headingItalic ? 'italic' : 'normal',
                      textDecoration: options.normalizeHeadings ? 'underline' : 'none',
                      color: options.useHeadingCustomColor ? options.headingColor : options.textColor,
                      backgroundColor: options.useHeadingBgColor ? options.headingBgColor : 'transparent',
                      padding: options.useHeadingBgColor ? '6px 14px' : '0px',
                      display: options.useHeadingBgColor ? 'inline-block' : 'block',
                      border: options.useHeadingBgColor ? '2.5px solid #000' : 'none',
                      boxShadow: options.useHeadingBgColor ? '2.5px 2.5px 0px #000' : 'none',
                    }}
                    className="leading-snug inline-block max-w-full text-center"
                  >
                    {options.showHeadingIcon && (
                      <span className="mr-2.5 inline-block select-none">{options.headingEmoji}</span>
                    )}
                    {headingText}
                  </h2>
                </div>

                {/* Chapter Elements (Paragraphs and Images) */}
                <div className="space-y-5">
                  {section.elements.map((el, elIdx) => {
                    if (el.type === 'image') {
                      if (options.suppressImages) return null;
                      return (
                        <div key={elIdx} className="w-full flex justify-center py-4 select-none">
                          <img
                            src={el.src}
                            alt="Illustration"
                            className="max-h-96 max-w-full rounded-none object-contain border-[3px] border-black shadow-[4px_4px_0px_#000]"
                            style={{ margin: `${options.paragraphSpacing}px 0` }}
                          />
                        </div>
                      );
                    }

                    // Text paragraph: Split into blocks of max phrases if configured
                    const paragraphBlocks = splitParagraphIntoBlocks(el.text, options.maxPhrases);
                    
                    return paragraphBlocks.map((blockText, bIdx) => {
                      const prefixHtml = options.showHeadingIcon && options.showParagraphIcon
                        ? `<span style="margin-right: 8px; font-weight: bold;" class="select-none">${options.headingEmoji}</span>`
                        : '';
                      
                      const htmlContent = transformParagraphToHtml(
                        blockText, 
                        options.highlightTags, 
                        options.advancedColoring
                      );

                      return (
                        <p
                          key={`${elIdx}-${bIdx}`}
                          style={{ marginBottom: `${options.paragraphSpacing}px`, marginTop: '0px' }}
                          className="leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: prefixHtml + htmlContent }}
                        />
                      );
                    });
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
