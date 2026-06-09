import React from 'react';
import { Trash2, AlertCircle, Sparkles, Book, Type, FileText, Image, Layout, Palette, Highlighter } from 'lucide-react';
import type { AppOptions } from '../utils/pdfGenerator';
import type { HighlightTag } from '../utils/textTransformer';

interface SidebarProps {
  options: AppOptions;
  onChangeOptions: (newOptions: AppOptions) => void;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'epub';
  onDeleteFile: () => void;
}

const EMOJIS = ['📌', '💡', '⚠️', '📎', '🔖', '✏️', '📝', '🎯', '⭐', '👉', '✅', '▶️'];

const FONTS = [
  { value: 'Lexend', label: 'Lexend (Accessibilité)' },
  { value: 'Luciole', label: 'Luciole (Déficience Visuelle)' },
  { value: 'Sylexiad Serif Thin', label: 'Sylexiad Serif Thin (Dyslexie)' },
  { value: 'Caldina', label: 'Caldina (Outfit)' },
  { value: 'Squad', label: 'Squad (Cabin)' },
  { value: 'TT Interphases Pro Trial Light', label: 'TT Interphases Pro' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Zilla Slab', label: 'Zilla Slab' },
  { value: 'Abyssinica SIL', label: 'Abyssinica SIL' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  options,
  onChangeOptions,
  fileName,
  fileSize,
  fileType,
  onDeleteFile,
}) => {
  const [newTagWord, setNewTagWord] = React.useState('');
  const [newTagStyle, setNewTagStyle] = React.useState<'bold' | 'color'>('bold');
  const [newTagColor, setNewTagColor] = React.useState('#e11d48'); // bright comic red default

  const updateOption = <K extends keyof AppOptions>(key: K, value: AppOptions[K]) => {
    onChangeOptions({
      ...options,
      [key]: value
    });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagWord.trim()) return;

    if (options.highlightTags.some(t => t.word.toLowerCase() === newTagWord.trim().toLowerCase())) {
      setNewTagWord('');
      return;
    }

    const newTag: HighlightTag = {
      word: newTagWord.trim(),
      style: newTagStyle,
      color: newTagStyle === 'color' ? newTagColor : '#000000'
    };

    let updatedAdvanced = { ...options.advancedColoring };
    if (options.advancedColoring.type !== 'none') {
      updatedAdvanced = { type: 'none', colors: [] };
    }

    onChangeOptions({
      ...options,
      highlightTags: [...options.highlightTags, newTag],
      advancedColoring: updatedAdvanced
    });

    setNewTagWord('');
  };

  const handleRemoveTag = (index: number) => {
    const updated = [...options.highlightTags];
    updated.splice(index, 1);
    updateOption('highlightTags', updated);
  };

  const handleAdvancedColoringChange = (type: any) => {
    let colors: string[] = [];
    if (type === 'sentence-bg') {
      colors = ['#fef08a', '#e0f2fe']; // pop-art backgrounds: yellow & blue
    } else if (type === 'word') {
      colors = ['#a855f7', '#f59e0b']; // purple & amber
    } else if (type === 'syllable') {
      colors = ['#ec4899', '#10b981']; // pink & emerald
    } else if (type === 'liaison') {
      colors = ['#ef4444']; // red
    }

    onChangeOptions({
      ...options,
      highlightTags: type !== 'none' ? [] : options.highlightTags,
      advancedColoring: {
        type,
        colors
      }
    });
  };

  const handleAdvancedColor1Change = (color: string) => {
    const updatedColors = [...options.advancedColoring.colors];
    updatedColors[0] = color;
    updateOption('advancedColoring', {
      ...options.advancedColoring,
      colors: updatedColors
    });
  };

  const handleAdvancedColor2Change = (color: string) => {
    const updatedColors = [...options.advancedColoring.colors];
    updatedColors[1] = color;
    updateOption('advancedColoring', {
      ...options.advancedColoring,
      colors: updatedColors
    });
  };

  const isConverting = fileType !== options.outputFormat;

  return (
    <aside className="w-80 h-full flex flex-col bg-zinc-900 border-r-[3px] border-black flex-shrink-0 select-none overflow-hidden relative">
      <div className="absolute inset-0 halftone-overlay pointer-events-none opacity-[0.03] z-0"></div>

      {/* File Card Info */}
      <div className="p-4 bg-zinc-950 border-b-[3px] border-black flex items-center justify-between gap-3 flex-shrink-0 z-10">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-white truncate" title={fileName}>
            {fileName}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="uppercase font-bold text-[9px] px-1.5 py-0.5 bg-yellow-400 text-black border border-black shadow-[1px_1px_0px_#000]">
              {fileType}
            </span>
            <span className="text-[10px] text-white/50 font-bold">{fileSize}</span>
          </div>
        </div>
        <button
          onClick={onDeleteFile}
          className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-black border border-transparent hover:border-black transition-all shadow-none hover:shadow-[2px_2px_0px_#000]"
          title="Supprimer le document"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Options Panel (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10 scrollbar-thin">
        
        {/* Section 1: Typography */}
        <div className="comic-panel border-2 border-black p-4 bg-zinc-900/80">
          <h5 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 border-b border-black pb-2 mb-3">
            <Type className="w-4 h-4 text-purple-400" /> TYPOGRAPHIE
          </h5>
          
          <div className="space-y-4">
            {/* Font family */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] text-white/70 font-bold uppercase">Police de caractères</label>
              <select
                value={options.fontFamily}
                onChange={(e) => updateOption('fontFamily', e.target.value)}
                className="w-full text-xs py-1"
              >
                {FONTS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Font size */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-white/70 uppercase text-[11px]">Taille de police</span>
                <span className="text-yellow-400">{options.fontSize} pt</span>
              </div>
              <input
                type="range"
                min="8"
                max="32"
                value={options.fontSize}
                onChange={(e) => updateOption('fontSize', parseInt(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Line height */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-white/70 uppercase text-[11px]">Interligne</span>
                <span className="text-yellow-400">{options.lineHeight}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={options.lineHeight}
                onChange={(e) => updateOption('lineHeight', parseFloat(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Paragraph spacing */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-white/70 uppercase text-[11px]">Espacement paragraphes</span>
                <span className="text-yellow-400">{options.paragraphSpacing} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                value={options.paragraphSpacing}
                onChange={(e) => updateOption('paragraphSpacing', parseInt(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Letter spacing */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-white/70 uppercase text-[11px]">Espacement lettres</span>
                <span className="text-yellow-400">{options.letterSpacing} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={options.letterSpacing}
                onChange={(e) => updateOption('letterSpacing', parseInt(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Layout alignment */}
        <div className="comic-panel border-2 border-black p-4 bg-zinc-900/80">
          <h5 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 border-b border-black pb-2 mb-3">
            <Layout className="w-4 h-4 text-blue-400" /> MISE EN PAGE
          </h5>
          <div className="flex flex-col space-y-2">
            <label className="text-[11px] text-white/70 font-bold uppercase">Alignement du texte</label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 border border-black">
              {(['left', 'justify', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => updateOption('alignment', align)}
                  className={`text-[10px] py-1.5 border border-transparent font-bold uppercase transition-all ${
                    options.alignment === align
                      ? 'bg-purple-500 text-black border-black font-extrabold shadow-[1.5px_1.5px_0px_#000]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {align === 'left' ? 'Gauche' : align === 'justify' ? 'Justifié' : align === 'center' ? 'Centré' : 'Droite'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Headings */}
        <div className="comic-panel border-2 border-black p-4 bg-zinc-900/80">
          <h5 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 border-b border-black pb-2 mb-3">
            <Sparkles className="w-4 h-4 text-rose-400" /> TITRES &amp; REPÈRES
          </h5>
          
          <div className="space-y-3.5">
            {/* Normalize titles */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/80 font-bold uppercase cursor-pointer" htmlFor="norm-title">
                Normaliser les titres
              </label>
              <input
                id="norm-title"
                type="checkbox"
                checked={options.normalizeHeadings}
                onChange={(e) => updateOption('normalizeHeadings', e.target.checked)}
              />
            </div>

            {/* Headings icon indicator */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/80 font-bold uppercase cursor-pointer" htmlFor="heading-icon">
                Ajouter une icône repère
              </label>
              <input
                id="heading-icon"
                type="checkbox"
                checked={options.showHeadingIcon}
                onChange={(e) => updateOption('showHeadingIcon', e.target.checked)}
              />
            </div>

            {/* Emoji choice */}
            {options.showHeadingIcon && (
              <div className="space-y-2.5 bg-black/40 p-2.5 border border-black animate-fade-in">
                <label className="text-[10px] text-white/65 font-bold uppercase block">Sélectionner l'icône</label>
                <div className="grid grid-cols-6 gap-1 bg-zinc-950 p-1 border border-black">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => updateOption('headingEmoji', emoji)}
                      className={`text-sm p-1 hover:bg-white/10 transition-all border ${
                        options.headingEmoji === emoji ? 'bg-yellow-400 border-black shadow-[1px_1px_0px_#000]' : 'border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Paragraph icon sync */}
                <div className="flex items-center justify-between pt-2 border-t border-black/40 mt-1">
                  <label className="text-[10px] text-white/80 font-bold uppercase cursor-pointer" htmlFor="p-icon">
                    Appliquer aux paragraphes
                  </label>
                  <input
                    id="p-icon"
                    type="checkbox"
                    checked={options.showParagraphIcon}
                    onChange={(e) => updateOption('showParagraphIcon', e.target.checked)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Images */}
        <div className="comic-panel border-2 border-black p-4 bg-zinc-900/80">
          <h5 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 border-b border-black pb-2 mb-3">
            <Image className="w-4 h-4 text-emerald-400" /> IMAGES
          </h5>
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/80 font-bold uppercase cursor-pointer" htmlFor="suppress-img">
              Supprimer les images
            </label>
            <input
              id="suppress-img"
              type="checkbox"
              checked={options.suppressImages}
              onChange={(e) => updateOption('suppressImages', e.target.checked)}
            />
          </div>
        </div>

        {/* Section 5: Colors */}
        <div className="comic-panel border-2 border-black p-4 bg-zinc-900/80">
          <h5 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 border-b border-black pb-2 mb-3">
            <Palette className="w-4 h-4 text-pink-400" /> COULEURS DU LIVRE
          </h5>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] text-white/70 font-bold uppercase">Couleur de fond</label>
              <div className="flex gap-2 items-center bg-black/40 p-1.5 border border-black">
                <input
                  type="color"
                  value={options.bgColor}
                  onChange={(e) => updateOption('bgColor', e.target.value)}
                  className="w-7 h-7 p-0 border border-black cursor-pointer shadow-[1px_1px_0px_#000]"
                />
                <span className="text-[9px] font-bold font-mono text-white/50">{options.bgColor}</span>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] text-white/70 font-bold uppercase">Couleur texte</label>
              <div className="flex gap-2 items-center bg-black/40 p-1.5 border border-black">
                <input
                  type="color"
                  value={options.textColor}
                  onChange={(e) => updateOption('textColor', e.target.value)}
                  className="w-7 h-7 p-0 border border-black cursor-pointer shadow-[1px_1px_0px_#000]"
                />
                <span className="text-[9px] font-bold font-mono text-white/50">{options.textColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Paragraph split */}
        <div className="comic-panel border-2 border-black p-4 bg-zinc-900/80">
          <h5 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 border-b border-black pb-2 mb-3">
            <Layout className="w-4 h-4 text-amber-400" /> DÉCOUPAGE
          </h5>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-white/75 uppercase text-[11px]">Max phrases par bloc</span>
              <span className="text-[9px] text-white/45">(0 = illimité)</span>
            </div>
            <input
              type="number"
              min="0"
              max="50"
              value={options.maxPhrases}
              onChange={(e) => updateOption('maxPhrases', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-xs font-bold"
            />
          </div>
        </div>

        {/* Section 7: Keyword highlights */}
        <div className="comic-panel border-2 border-black p-4 bg-zinc-900/80">
          <h5 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 border-b border-black pb-2 mb-3">
            <Highlighter className="w-4 h-4 text-cyan-400" /> MOTS EN SURBRILLANCE
          </h5>

          <form onSubmit={handleAddTag} className="space-y-3.5 bg-black/40 p-3 border border-black">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] text-white/60 font-bold uppercase">Mot ou nom propre</label>
              <input
                type="text"
                placeholder="Ex: Antoine"
                value={newTagWord}
                onChange={(e) => setNewTagWord(e.target.value)}
                className="w-full text-xs py-1"
                disabled={options.advancedColoring.type !== 'none'}
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1 flex flex-col space-y-1">
                <label className="text-[10px] text-white/60 font-bold uppercase">Style</label>
                <select
                  value={newTagStyle}
                  onChange={(e) => setNewTagStyle(e.target.value as any)}
                  className="w-full text-xs py-1.5"
                  disabled={options.advancedColoring.type !== 'none'}
                >
                  <option value="bold">Gras</option>
                  <option value="color">Couleur</option>
                </select>
              </div>

              {newTagStyle === 'color' && (
                <div className="flex-shrink-0 flex flex-col space-y-1 items-center">
                  <label className="text-[10px] text-white/60 font-bold uppercase">Couleur</label>
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-8 h-8 p-0 border border-black cursor-pointer shadow-[1px_1px_0px_#000]"
                    disabled={options.advancedColoring.type !== 'none'}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!newTagWord.trim() || options.advancedColoring.type !== 'none'}
              className="comic-btn w-full py-1.5 bg-purple-500 hover:bg-purple-400 text-black text-xs font-bold"
            >
              AJOUTER LE MOT
            </button>

            {options.advancedColoring.type !== 'none' && (
              <p className="text-[10px] text-yellow-400 font-bold leading-normal flex gap-1.5 items-start">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Désactivez la coloration avancée pour activer la surbrillance simple.
              </p>
            )}
          </form>

          {/* List of badges */}
          {options.highlightTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-black/45 border border-black">
              {options.highlightTags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    fontWeight: tag.style === 'bold' ? 'bold' : 'normal',
                    color: tag.style === 'color' ? tag.color : '#000000',
                    backgroundColor: tag.style === 'color' ? '#ffffff' : '#fef08a'
                  }}
                  className="comic-bubble text-[10px] px-2 py-0.5 inline-flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#000]"
                >
                  {tag.word}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-black/60 hover:text-black font-bold text-[10px] ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Section 8: Advanced coloring */}
        <div className="comic-panel border-2 border-black p-4 bg-zinc-900/80">
          <h5 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 border-b border-black pb-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" /> COLORATION AVANCÉE
          </h5>

          <div className="space-y-3.5 bg-black/40 p-3 border border-black">
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs text-white/90 font-bold uppercase cursor-pointer">
                <input
                  type="radio"
                  name="advColorType"
                  checked={options.advancedColoring.type === 'none'}
                  onChange={() => handleAdvancedColoringChange('none')}
                  className="cursor-pointer accent-purple-500"
                />
                Aucune
              </label>

              <label className="flex items-start gap-2 text-xs text-white/90 font-bold uppercase cursor-pointer">
                <input
                  type="radio"
                  name="advColorType"
                  checked={options.advancedColoring.type === 'sentence-bg'}
                  onChange={() => handleAdvancedColoringChange('sentence-bg')}
                  className="cursor-pointer accent-purple-500 mt-0.5"
                />
                Fonds alternés par phrase
              </label>

              <label className="flex items-center gap-2 text-xs text-white/90 font-bold uppercase cursor-pointer">
                <input
                  type="radio"
                  name="advColorType"
                  checked={options.advancedColoring.type === 'syllable'}
                  onChange={() => handleAdvancedColoringChange('syllable')}
                  className="cursor-pointer accent-purple-500"
                />
                Coloration par syllabe
              </label>

              <label className="flex items-center gap-2 text-xs text-white/90 font-bold uppercase cursor-pointer">
                <input
                  type="radio"
                  name="advColorType"
                  checked={options.advancedColoring.type === 'word'}
                  onChange={() => handleAdvancedColoringChange('word')}
                  className="cursor-pointer accent-purple-500"
                />
                Coloration par mot
              </label>

              <label className="flex items-start gap-2 text-xs text-white/90 font-bold uppercase cursor-pointer">
                <input
                  type="radio"
                  name="advColorType"
                  checked={options.advancedColoring.type === 'liaison'}
                  onChange={() => handleAdvancedColoringChange('liaison')}
                  className="cursor-pointer accent-purple-500 mt-0.5"
                />
                Liaisons entre phrases
              </label>
            </div>

            {/* Custom color configuration for advanced settings */}
            {options.advancedColoring.type !== 'none' && (
              <div className="pt-2.5 border-t border-black/45 space-y-3 animate-fade-in">
                {options.advancedColoring.type !== 'liaison' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[9px] text-white/60 font-bold uppercase">Couleur 1</label>
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-black">
                        <input
                          type="color"
                          value={options.advancedColoring.colors[0]}
                          onChange={(e) => handleAdvancedColor1Change(e.target.value)}
                          className="w-6 h-6 p-0 border border-black cursor-pointer shadow-[1px_1px_0px_#000]"
                        />
                        <span className="text-[8px] font-mono text-white/50 truncate">
                          {options.advancedColoring.colors[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[9px] text-white/60 font-bold uppercase">Couleur 2</label>
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-black">
                        <input
                          type="color"
                          value={options.advancedColoring.colors[1]}
                          onChange={(e) => handleAdvancedColor2Change(e.target.value)}
                          className="w-6 h-6 p-0 border border-black cursor-pointer shadow-[1px_1px_0px_#000]"
                        />
                        <span className="text-[8px] font-mono text-white/50 truncate">
                          {options.advancedColoring.colors[1]}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1 bg-zinc-950 p-2 border border-black">
                    <label className="text-[9px] text-white/65 font-bold uppercase">Couleur liaison</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={options.advancedColoring.colors[0]}
                        onChange={(e) => handleAdvancedColor1Change(e.target.value)}
                        className="w-7 h-7 p-0 border border-black cursor-pointer shadow-[1px_1px_0px_#000]"
                      />
                      <span className="text-[10px] font-mono text-white/50">
                        {options.advancedColoring.colors[0]}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 9: Output Format */}
        <div className="comic-panel border-2 border-black p-4 bg-zinc-900/80">
          <h5 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 border-b border-black pb-2 mb-3">
            <Book className="w-4 h-4 text-yellow-400" /> FORMAT D'EXPORT
          </h5>

          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-black">
              {(['pdf', 'epub'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => updateOption('outputFormat', fmt)}
                  className={`text-xs py-2 border border-transparent font-bold uppercase flex items-center justify-center gap-1.5 transition-all ${
                    options.outputFormat === fmt
                      ? 'bg-yellow-400 text-black border-black font-extrabold shadow-[2px_2px_0px_#000]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> {fmt}
                </button>
              ))}
            </div>

            {/* Conversion Warning Message */}
            {isConverting && (
              <div className="p-3 bg-blue-500/10 border-2 border-blue-400/50 text-blue-200 text-xs font-bold leading-normal animate-fade-in flex gap-2 items-start shadow-[3px_3px_0px_0px_rgba(59,130,246,0.2)]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <div>
                  <span className="block mb-0.5 text-blue-400 font-extrabold uppercase text-[10px] tracking-wider">CONVERSION ACTIVÉE</span>
                  Le document {fileType.toUpperCase()} sera converti et généré en {options.outputFormat.toUpperCase()}.
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};
