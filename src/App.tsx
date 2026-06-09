import { useState } from 'react';
import { BookOpen, Download, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { Sidebar } from './components/Sidebar';
import { Preview } from './components/Preview';
import { parsePdf } from './utils/pdfParser';
import type { ParsedDocument } from './utils/pdfParser';
import { parseEpub } from './utils/epubParser';
import { generatePdf } from './utils/pdfGenerator';
import type { AppOptions } from './utils/pdfGenerator';
import { generateEpub } from './utils/epubGenerator';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

const DEFAULT_OPTIONS: AppOptions = {
  fontFamily: 'Lexend',
  fontSize: 16,
  lineHeight: 1.6,
  letterSpacing: 1,
  paragraphSpacing: 16,
  alignment: 'left',
  normalizeHeadings: false,
  showHeadingIcon: false,
  headingEmoji: '📌',
  showParagraphIcon: false,
  suppressImages: false,
  bgColor: '#1e1e24',
  textColor: '#f1f1f6',
  maxPhrases: 0,
  highlightTags: [],
  advancedColoring: { type: 'none', colors: [] },
  outputFormat: 'pdf',
  headingBold: true,
  headingItalic: false,
  useHeadingCustomColor: false,
  headingColor: '#a855f7',
  useHeadingBgColor: false,
  headingBgColor: '#e0f2fe',
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fileSize, setFileSize] = useState<string>('');
  const [fileType, setFileType] = useState<'pdf' | 'epub' | null>(null);
  const [document, setDocument] = useState<ParsedDocument | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [options, setOptions] = useState<AppOptions>(DEFAULT_OPTIONS);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast notifier helper
  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically remove after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Helper: Format file size to Mo
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Octets';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} Mo`;
  };

  const handleFileSelect = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'epub') {
      addToast("Format de fichier non supporté. PDF ou EPUB requis.", "error");
      return;
    }

    setFile(selectedFile);
    setFileSize(formatBytes(selectedFile.size));
    const type = ext as 'pdf' | 'epub';
    setFileType(type);
    setDocument(null);
    setIsAnalyzing(true);
    addToast("Début de l'analyse du document...", "info");

    try {
      let parsedDoc: ParsedDocument;
      if (type === 'pdf') {
        parsedDoc = await parsePdf(selectedFile);
      } else {
        parsedDoc = await parseEpub(selectedFile);
      }

      setDocument(parsedDoc);
      setOptions((prev) => ({
        ...prev,
        outputFormat: type
      }));

      addToast("Conversion réussie !", "success");
      addToast(`${parsedDoc.sections.length} sections trouvées avec succès.`, "success");
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || "Erreur lors de l'analyse du document.", "error");
      setFile(null);
      setFileSize('');
      setFileType(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteFile = () => {
    setFile(null);
    setFileSize('');
    setFileType(null);
    setDocument(null);
    setOptions(DEFAULT_OPTIONS);
    addToast("Document supprimé.", "info");
  };

  const handleExport = async () => {
    if (!document || !file) {
      addToast("Aucun document chargé.", "error");
      return;
    }

    addToast("Préparation de l'exportation...", "info");

    try {
      if (options.outputFormat === 'pdf') {
        await generatePdf(document, options, file.name);
      } else {
        await generateEpub(document, options, file.name);
      }
      addToast("Téléchargement démarré !", "success");
    } catch (err: any) {
      console.error(err);
      addToast("Erreur lors de la génération de l'export.", "error");
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-zinc-950 text-zinc-100 relative">
      <div className="absolute inset-0 halftone-overlay pointer-events-none opacity-[0.03] z-0"></div>
      
      {/* App Header */}
      <header className="h-16 border-b-[3px] border-black bg-zinc-900 flex items-center justify-between px-6 flex-shrink-0 z-10 select-none relative">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500 border-2 border-black text-black shadow-[2px_2px_0px_#000]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-widest text-white comic-title">ADAPTATION LIVRE</h1>
            <p className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-widest mt-0.5">Reformatage &amp; Accessibilité</p>
          </div>
        </div>

        {/* Action Button: appears only when document is loaded */}
        {document && (
          <button
            onClick={handleExport}
            className="comic-btn comic-btn-secondary py-1.5 px-4 text-xs font-bold gap-2"
          >
            <Download className="w-3.5 h-3.5" /> CONVERTIR &amp; TÉLÉCHARGER
          </button>
        )}
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden relative z-10 flex">
        {isAnalyzing && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
            <div className="comic-panel p-6 bg-yellow-400 text-black border-3 border-black shadow-[6px_6px_0px_#000] flex flex-col items-center space-y-3 max-w-xs text-center">
              <Loader2 className="w-8 h-8 text-black animate-spin" />
              <h4 className="font-extrabold text-sm uppercase tracking-wide">ANALYSE DU DOCUMENT...</h4>
              <p className="text-[11px] font-bold text-black/70">Extraction intelligente de la structure, des chapitres et des illustrations en cours...</p>
            </div>
          </div>
        )}

        {!document ? (
          /* Landing Page / File Uploader */
          <div className="h-full w-full overflow-y-auto">
            <div className="py-12">
              <Dropzone onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} />
            </div>
          </div>
        ) : (
          /* Editor Split Layout (Side-by-side columns: left sidebar, right preview) */
          <div className="h-full w-full flex overflow-hidden">
            <Sidebar
              options={options}
              onChangeOptions={setOptions}
              fileName={file ? file.name : ''}
              fileSize={fileSize}
              fileType={fileType || 'pdf'}
              onDeleteFile={handleDeleteFile}
            />
            <Preview document={document} options={options} />
          </div>
        )}
      </main>

      {/* Toast Notification Container */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm w-full select-none pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 border-2 border-black shadow-[4px_4px_0px_#000] animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-400 text-black'
                : toast.type === 'error'
                ? 'bg-rose-400 text-black'
                : 'bg-cyan-300 text-black'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5 bg-black/10 p-1 rounded-none border border-black/20">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-black" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-black" />
              ) : (
                <Info className="w-4 h-4 text-black" />
              )}
            </div>
            <div>
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-black/60 mb-0.5">
                {toast.type === 'success' ? 'SUCCÈS !' : toast.type === 'error' ? 'ERREUR !' : 'INFO !'}
              </span>
              <p className="text-xs font-bold leading-normal">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
