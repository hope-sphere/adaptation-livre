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
      desc: "Polices d'accessibilité (Lexend, Luciole, Sylexiad) et espacements ajustables."
    },
    {
      icon: <Layout className="w-6 h-6 text-blue-400" />,
      title: "Mise en page",
      desc: "Alignement précis du texte (justifié, gauche, centré) pour limiter la fatigue visuelle."
    },
    {
      icon: <Palette className="w-6 h-6 text-pink-400" />,
      title: "Couleurs",
      desc: "Combinaisons de couleurs fond/texte personnalisées pour améliorer le contraste."
    },
    {
      icon: <Heading className="w-6 h-6 text-emerald-400" />,
      title: "Titres normalisés",
      desc: "Numérotation automatique et émojis repères pour guider la structure du livre."
    },
    {
      icon: <Highlighter className="w-6 h-6 text-yellow-400" />,
      title: "Surbrillance simple",
      desc: "Mise en évidence en gras ou en couleur de noms ou de mots-clés spécifiques."
    },
    {
      icon: <ArrowLeftRight className="w-6 h-6 text-cyan-400" />,
      title: "PDF ↔ EPUB",
      desc: "Conversion intelligente bidirectionnelle en conservant les images et styles."
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Upload Panel */}
      <div
        className={`glass-panel rounded-2xl p-10 mb-12 text-center border-2 border-dashed transition-all duration-300 ${
          isDragActive 
            ? 'border-purple-500 bg-purple-500/5 scale-[1.01]' 
            : 'border-white/10 hover:border-white/20'
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

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-full bg-white/5 border border-white/10">
            <UploadCloud className={`w-12 h-12 text-white/60 ${isAnalyzing ? 'animate-pulse' : ''}`} />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-1">
              {isAnalyzing ? "Analyse du document..." : "Glissez-déposez votre document"}
            </h3>
            <p className="text-sm text-white/50 max-w-md mx-auto">
              {isAnalyzing 
                ? "Nous extrayons le texte, les chapitres et les images..." 
                : "Sélectionnez un fichier PDF ou EPUB pour l'adapter aux besoins d'accessibilité de lecture."}
            </p>
          </div>

          {!isAnalyzing && (
            <button className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-950/30">
              Parcourir les fichiers
            </button>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="space-y-6">
        <h4 className="text-sm font-semibold text-white/40 tracking-wider uppercase text-center mb-6">
          Fonctionnalités incluses
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className="feature-card glass-panel rounded-xl p-5 border border-white/5 flex gap-4"
            >
              <div className="flex-shrink-0 p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center h-12 w-12">
                {feat.icon}
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-white/90">{feat.title}</h5>
                <p className="text-xs text-white/50 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
