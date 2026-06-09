import React, { useState, useRef } from 'react';
import { UploadCloud, Type, Layout, Palette, Heading, Highlighter, ArrowLeftRight } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, isAnalyzing }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ext === 'epub') {
      onFileSelect(file);
    } else {
      alert('Veuillez importer un fichier PDF ou EPUB valide.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const features = [
    {
      icon: <Type className="w-6 h-6 text-purple-400" />,
      title: "Police & Taille",
      desc: "Polices d'accessibilité (Lexend, Luciole, Sylexiad) et espacements ajustables.",
      colorClass: "bg-purple-500/10 hover:bg-purple-500/20"
    },
    {
      icon: <Layout className="w-6 h-6 text-blue-400" />,
      title: "Mise en page",
      desc: "Alignement précis du texte (justifié, gauche, centré) pour limiter la fatigue visuelle.",
      colorClass: "bg-blue-500/10 hover:bg-blue-500/20"
    },
    {
      icon: <Palette className="w-6 h-6 text-rose-400" />,
      title: "Couleurs",
      desc: "Combinaisons de couleurs fond/texte personnalisées pour améliorer le contraste.",
      colorClass: "bg-rose-500/10 hover:bg-rose-500/20"
    },
    {
      icon: <Heading className="w-6 h-6 text-emerald-400" />,
      title: "Titres normalisés",
      desc: "Numérotation automatique et émojis repères pour guider la structure du livre.",
      colorClass: "bg-emerald-500/10 hover:bg-emerald-500/20"
    },
    {
      icon: <Highlighter className="w-6 h-6 text-amber-400" />,
      title: "Surbrillance simple",
      desc: "Mise en évidence en gras ou en couleur de noms ou de mots-clés spécifiques.",
      colorClass: "bg-amber-500/10 hover:bg-amber-500/20"
    },
    {
      icon: <ArrowLeftRight className="w-6 h-6 text-cyan-400" />,
      title: "PDF ↔ EPUB",
      desc: "Conversion intelligente bidirectionnelle en conservant les images et styles.",
      colorClass: "bg-cyan-500/10 hover:bg-cyan-500/20"
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8 animate-fade-in relative">
      
      {/* Upload Panel */}
      <div
        className={`comic-panel p-10 mb-12 text-center transition-all duration-200 ${
          isDragActive 
            ? 'bg-yellow-500/5 scale-[1.005] rotate-[-0.2deg] border-yellow-400' 
            : 'bg-zinc-900/40 hover:scale-[1.002]'
        } ${isAnalyzing ? 'pointer-events-none opacity-80' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.epub"
          className="hidden"
          onChange={handleFileInput}
          disabled={isAnalyzing}
        />

        <div className="flex flex-col items-center justify-center space-y-5">
          {/* Action Badge */}
          <div className="slanted-badge comic-bubble bg-yellow-400 text-black text-xs font-bold uppercase tracking-wider mb-2">
            Importez ici !
          </div>

          <div className="p-4 bg-black/40 border-2 border-black inline-flex rounded-none shadow-[2px_2px_0px_0px_#000]">
            <UploadCloud className={`w-12 h-12 text-white/70 ${isAnalyzing ? 'animate-pulse' : ''}`} />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white uppercase comic-title mt-2 mb-1.5">
              {isAnalyzing ? "ANALYSE EN COURS..." : "GLISSER-DÉPOSER UN DOCUMENT"}
            </h3>
            <p className="text-sm text-white/60 max-w-md mx-auto font-medium">
              {isAnalyzing 
                ? "Extraction intelligente des chapitres, paragraphes et images en cours..." 
                : "Sélectionnez un livre PDF ou EPUB pour l'adapter aux besoins d'accessibilité."}
            </p>
          </div>

          {!isAnalyzing && (
            <button className="comic-btn comic-btn-secondary mt-2">
              PARCOURIR LES FICHIERS
            </button>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="space-y-6">
        <div className="flex justify-center">
          <h4 className="comic-bubble bg-white text-black text-xs font-bold uppercase tracking-widest px-4 py-1">
            OPTIONS D'ADAPTATION INCLUSES
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className={`feature-card comic-panel border-2 border-black p-5 flex gap-4 transition-all duration-150 ${feat.colorClass}`}
            >
              <div className="flex-shrink-0 p-3 rounded-none bg-black/40 border-2 border-black flex items-center justify-center h-12 w-12 shadow-[2px_2px_0px_0px_#000]">
                {feat.icon}
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-white tracking-wide text-sm uppercase">{feat.title}</h5>
                <p className="text-xs text-white/70 leading-relaxed font-medium">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
