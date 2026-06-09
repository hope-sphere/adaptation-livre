import React from 'react';
import { Trash2, AlertCircle, Sparkles, Book, Type, FileText, Image, Layout, Palette, Highlighter } from 'lucide-react';
import type { AppOptions } from '../utils/pdfGenerator';
import type { HighlightTag } from '../utils/textTransformer';

interface SidebarProps {
  options: AppOptions;
  onChangeOptions: (newOptions: AppOptions) => void;
  fileName: string;
  fileSize: string; // formatted size e.g. "1.2 Mo"
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
  const [newTagColor, setNewTagColor] = React.useState('#a855f7');

  const updateOption = <K extends keyof AppOptions>(key: K, value: AppOptions[K]) => {
    onChangeOptions({
      ...options,
      [key]: value
    });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagWord.trim()) return;

    // Check if word already exists in highlights
    if (options.highlightTags.some(t => t.word.toLowerCase() === newTagWord.trim().toLowerCase())) {
      setNewTagWord('');
      return;
    }

    const newTag: HighlightTag = {
      word: newTagWord.trim(),
      style: newTagStyle,
      color: newTagStyle === 'color' ? newTagColor : '#000000'
    };

    // If advanced coloring is enabled, disable it because highlights is exclusive
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
      colors = ['rgba(168, 85, 247, 0.08)', 'rgba(59, 130, 246, 0.08)'];
    } else if (type === 'word') {
      colors = ['#a855f7', '#3b82f6'];
    } else if (type === 'syllable') {
      colors = ['#a855f7', '#10b981'];
    } else if (type === 'liaison') {
      colors = ['#ef4444'];
    }

    onChangeOptions({
      ...options,
      // Clear simple highlights because it is exclusive with advanced coloring
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

  // Check if output conversion warning is required
  const isConverting = fileType !== options.outputFormat;

  return (
    <aside className="w-80 h-full flex flex-col glass-panel border-r border-white/5 divide-y divide-white/5 flex-shrink-0 select-none overflow-hidden">
      {/* File Card info */}
      <div className="p-4 bg-white/[0.02] flex items-center justify-between gap-3 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-white/90 truncate" title={fileName}>
            {fileName}
          </h4>
          <p className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5">
            <span className="uppercase font-bold text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
              {fileType}
            </span>
            <span>{fileSize}</span>
          </p>
        </div>
        <button
          onClick={onDeleteFile}
          className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          title="Supprimer le document"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Options Panel (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Section 1: Typography */}
        <div className="space-y-4">
          <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" /> Typographie
          </h5>
          
          <div className="space-y-3">
            {/* Font family */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs text-white/60">Police de caractères</label>
              <select
                value={options.fontFamily}
                onChange={(e) => updateOption('fontFamily', e.target.value)}
                className="w-full text-xs"
              >
                {FONTS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Font size */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Taille de police</span>
                <span className="font-semibold text-purple-400">{options.fontSize} pt</span>
              </div>
              <input
                type="range"
                min="8"
                max="32"
                value={options.fontSize}
                onChange={(e) => updateOption('fontSize', parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Line height */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Interligne</span>
                <span className="font-semibold text-purple-400">{options.lineHeight}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={options.lineHeight}
                onChange={(e) => updateOption('lineHeight', parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Paragraph spacing */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Espacement paragraphes</span>
                <span className="font-semibold text-purple-400">{options.paragraphSpacing} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                value={options.paragraphSpacing}
                onChange={(e) => updateOption('paragraphSpacing', parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Letter spacing */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Espacement caractères</span>
                <span className="font-semibold text-purple-400">{options.letterSpacing} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={options.letterSpacing}
                onChange={(e) => updateOption('letterSpacing', parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Layout alignment */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5" /> Mise en page
          </h5>
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs text-white/60">Alignement du texte</label>
            <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
              {(['left', 'justify', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => updateOption('alignment', align)}
                  className={`text-[10px] py-1.5 rounded transition-all capitalize ${
                    options.alignment === align
                      ? 'bg-purple-500 text-white font-medium shadow'
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
        <div className="space-y-4">
          <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Titres &amp; Repères
          </h5>
          
          <div className="space-y-3">
            {/* Normalize titles */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/60 cursor-pointer" htmlFor="norm-title">
                Normalisation des titres
              </label>
              <input
                id="norm-title"
                type="checkbox"
                checked={options.normalizeHeadings}
                onChange={(e) => updateOption('normalizeHeadings', e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-purple-500"
              />
            </div>

            {/* Headings icon indicator */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/60 cursor-pointer" htmlFor="heading-icon">
                Ajouter une icône repère
              </label>
              <input
                id="heading-icon"
                type="checkbox"
                checked={options.showHeadingIcon}
                onChange={(e) => updateOption('showHeadingIcon', e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-purple-500"
              />
            </div>

            {/* Emoji choice (if icon active) */}
            {options.showHeadingIcon && (
              <div className="space-y-2 animate-fade-in bg-white/5 p-2.5 rounded-lg border border-white/5">
                <label className="text-[11px] text-white/50 block">Choisir l'icône</label>
                <div className="grid grid-cols-6 gap-1">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => updateOption('headingEmoji', emoji)}
                      className={`text-base p-1 rounded hover:bg-white/5 transition-all ${
                        options.headingEmoji === emoji ? 'bg-purple-500/20 border border-purple-500/50' : 'border border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Paragraph icon sync */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                  <label className="text-[11px] text-white/60 cursor-pointer" htmlFor="p-icon">
                    Appliquer aux paragraphes
                  </label>
                  <input
                    id="p-icon"
                    type="checkbox"
                    checked={options.showParagraphIcon}
                    onChange={(e) => updateOption('showParagraphIcon', e.target.checked)}
                    className="w-3.5 h-3.5 cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Images */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5" /> Images
          </h5>
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/60 cursor-pointer" htmlFor="suppress-img">
              Supprimer les images
            </label>
            <input
              id="suppress-img"
              type="checkbox"
              checked={options.suppressImages}
              onChange={(e) => updateOption('suppressImages', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-purple-500"
            />
          </div>
        </div>

        {/* Section 5: Colors */}
        <div className="space-y-4">
          <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Couleurs de lecture
          </h5>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs text-white/60">Couleur de fond</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={options.bgColor}
                  onChange={(e) => updateOption('bgColor', e.target.value)}
                  className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                />
                <span className="text-[10px] font-mono text-white/40">{options.bgColor}</span>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs text-white/60">Couleur du texte</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={options.textColor}
                  onChange={(e) => updateOption('textColor', e.target.value)}
                  className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                />
                <span className="text-[10px] font-mono text-white/40">{options.textColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Paragraph split */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5" /> Découpage
          </h5>
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60">Max phrases par paragraphe</span>
              <span className="text-[10px] text-white/40">(0 = illimité)</span>
            </div>
            <input
              type="number"
              min="0"
              max="50"
              value={options.maxPhrases}
              onChange={(e) => updateOption('maxPhrases', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-xs"
            />
          </div>
        </div>

        {/* Section 7: Keyword highlights */}
        <div className="space-y-4">
          <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Highlighter className="w-3.5 h-3.5" /> Mots en surbrillance
          </h5>

          <form onSubmit={handleAddTag} className="space-y-3 bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] text-white/50">Mot ou nom propre</label>
              <input
                type="text"
                placeholder="Ex: Antoine"
                value={newTagWord}
                onChange={(e) => setNewTagWord(e.target.value)}
                className="w-full text-xs"
                disabled={options.advancedColoring.type !== 'none'}
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1 flex flex-col space-y-1">
                <label className="text-[10px] text-white/50">Style</label>
                <select
                  value={newTagStyle}
                  onChange={(e) => setNewTagStyle(e.target.value as any)}
                  className="w-full text-xs py-1"
                  disabled={options.advancedColoring.type !== 'none'}
                >
                  <option value="bold">Gras</option>
                  <option value="color">Couleur</option>
                </select>
              </div>

              {newTagStyle === 'color' && (
                <div className="flex-shrink-0 flex flex-col space-y-1 items-center">
                  <label className="text-[10px] text-white/50">Couleur</label>
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-8 h-7 p-0 border-0 rounded cursor-pointer"
                    disabled={options.advancedColoring.type !== 'none'}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!newTagWord.trim() || options.advancedColoring.type !== 'none'}
              className="w-full py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium rounded-md transition-all border border-purple-500/30"
            >
              Ajouter le mot
            </button>

            {options.advancedColoring.type !== 'none' && (
              <p className="text-[10px] text-yellow-400/80 leading-snug flex gap-1 items-start">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Désactivez la coloration avancée pour activer la surbrillance simple.
              </p>
            )}
          </form>

          {/* List of badges */}
          {options.highlightTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-white/[0.02] border border-white/5 rounded-lg">
              {options.highlightTags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    fontWeight: tag.style === 'bold' ? 'bold' : 'normal',
                    color: tag.style === 'color' ? tag.color : undefined,
                    borderColor: tag.style === 'color' ? `${tag.color}33` : undefined,
                  }}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shadow-sm"
                >
                  {tag.word}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-white/40 hover:text-white transition-all text-[9px] font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Section 8: Advanced coloring */}
        <div className="space-y-4">
          <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Coloration Avancée
          </h5>

          <div className="space-y-3 bg-white/5 p-3 rounded-lg border border-white/5">
            {/* Options list */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                <input
                  type="radio"
                  name="advColorType"
                  checked={options.advancedColoring.type === 'none'}
                  onChange={() => handleAdvancedColoringChange('none')}
                  className="cursor-pointer accent-purple-500"
                />
                Aucune
              </label>

              <label className="flex items-start gap-2 text-xs text-white/80 cursor-pointer">
                <input
                  type="radio"
                  name="advColorType"
                  checked={options.advancedColoring.type === 'sentence-bg'}
                  onChange={() => handleAdvancedColoringChange('sentence-bg')}
                  className="cursor-pointer accent-purple-500 mt-0.5"
                />
                Alternance de fond par phrase
              </label>

              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                <input
                  type="radio"
                  name="advColorType"
                  checked={options.advancedColoring.type === 'syllable'}
                  onChange={() => handleAdvancedColoringChange('syllable')}
                  className="cursor-pointer accent-purple-500"
                />
                Coloration par syllabe
              </label>

              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                <input
                  type="radio"
                  name="advColorType"
                  checked={options.advancedColoring.type === 'word'}
                  onChange={() => handleAdvancedColoringChange('word')}
                  className="cursor-pointer accent-purple-500"
                />
                Coloration par mot
              </label>

              <label className="flex items-start gap-2 text-xs text-white/80 cursor-pointer">
                <input
                  type="radio"
                  name="advColorType"
                  checked={options.advancedColoring.type === 'liaison'}
                  onChange={() => handleAdvancedColoringChange('liaison')}
                  className="cursor-pointer accent-purple-500 mt-0.5"
                />
                Continuité de couleur (liaison)
              </label>
            </div>

            {/* Custom color configuration for advanced settings */}
            {options.advancedColoring.type !== 'none' && (
              <div className="pt-2 border-t border-white/5 space-y-3.5 animate-fade-in">
                {options.advancedColoring.type !== 'liaison' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-white/50">Couleur 1</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={options.advancedColoring.colors[0]}
                          onChange={(e) => handleAdvancedColor1Change(e.target.value)}
                          className="w-7 h-7 p-0 border-0 rounded cursor-pointer"
                        />
                        <span className="text-[9px] font-mono text-white/40 truncate">
                          {options.advancedColoring.colors[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-white/50">Couleur 2</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={options.advancedColoring.colors[1]}
                          onChange={(e) => handleAdvancedColor2Change(e.target.value)}
                          className="w-7 h-7 p-0 border-0 rounded cursor-pointer"
                        />
                        <span className="text-[9px] font-mono text-white/40 truncate">
                          {options.advancedColoring.colors[1]}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-white/50">Couleur de liaison</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={options.advancedColoring.colors[0]}
                        onChange={(e) => handleAdvancedColor1Change(e.target.value)}
                        className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                      />
                      <span className="text-xs font-mono text-white/40">
                        {options.advancedColoring.colors[0]}
                      </span>
                    </div>
                  </div>
                )}
                
                {options.highlightTags.length > 0 && (
                  <p className="text-[10px] text-yellow-400/80 leading-snug flex gap-1 items-start border-t border-white/5 pt-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    Simple highlight tags were temporarily cleared to enable advanced coloring.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 9: Output Format */}
        <div className="space-y-4">
          <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Book className="w-3.5 h-3.5" /> Format de Sortie
          </h5>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-lg border border-white/5">
              {(['pdf', 'epub'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => updateOption('outputFormat', fmt)}
                  className={`text-xs py-2 rounded-md transition-all uppercase font-medium flex items-center justify-center gap-1 ${
                    options.outputFormat === fmt
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> {fmt}
                </button>
              ))}
            </div>

            {/* Conversion Warning Message */}
            {isConverting && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300 leading-relaxed animate-fade-in flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Conversion en cours</span>
                  Le document {fileType.toUpperCase()} sera converti et exporté au format {options.outputFormat.toUpperCase()}.
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};
