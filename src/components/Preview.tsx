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
      // Normalize: 1. Title lowercase except first letter
      text = `${index + 1}. ${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`;
    }
    return text;
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Stats Banner */}
      <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-xs text-white/50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <strong className="text-white/80">{doc.sections.length}</strong> section{doc.sections.length > 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <strong className="text-white/80">{totalParagraphs}</strong> paragraphe{totalParagraphs > 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px] font-medium">
          <CheckCircle className="w-3 h-3" /> Synchronisé en direct
        </div>
      </div>

      {/* Book Content Preview Area */}
      <div 
        className="flex-1 overflow-y-auto p-12 transition-all duration-300"
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
        <div className="max-w-2xl mx-auto space-y-12 pb-24">
          {/* Document Main Title (Simulated Book Title) */}
          <div className="border-b border-current/10 pb-8 text-center">
            <h1 
              style={{ fontSize: '1.8em', color: options.textColor }} 
              className="font-bold mb-2 tracking-tight"
            >
              {doc.title}
            </h1>
            <p className="text-xs opacity-60 italic">
              Adaptation de lecture accessibilité
            </p>
          </div>

          {/* Chapters Render */}
          {doc.sections.map((section, sIdx) => {
            const headingText = getHeadingText(section.title, sIdx);
            
            return (
              <section key={sIdx} className="space-y-6">
                {/* Chapter Heading */}
                <h2
                  style={{
                    fontSize: '1.35em',
                    fontWeight: 'bold',
                    textDecoration: options.normalizeHeadings ? 'underline' : 'none',
                    color: options.textColor,
                    marginTop: '2em'
                  }}
                  className="mb-4 text-center leading-snug"
                >
                  {options.showHeadingIcon && (
                    <span className="mr-2 inline-block select-none">{options.headingEmoji}</span>
                  )}
                  {headingText}
                </h2>

                {/* Chapter Elements (Paragraphs and Images) */}
                <div className="space-y-4">
                  {section.elements.map((el, elIdx) => {
                    if (el.type === 'image') {
                      if (options.suppressImages) return null;
                      return (
                        <div key={elIdx} className="w-full flex justify-center py-4 select-none">
                          <img
                            src={el.src}
                            alt="Illustration"
                            className="max-h-96 max-w-full rounded-lg object-contain shadow-sm border border-current/5"
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
