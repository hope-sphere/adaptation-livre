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
    addToast("Analyse du document...", "info");

    try {
      let parsedDoc: ParsedDocument;
      if (type === 'pdf') {
        parsedDoc = await parsePdf(selectedFile);
      } else {
        parsedDoc = await parseEpub(selectedFile);
      }

      setDocument(parsedDoc);
      // Synchronize initial output format with input format
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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      
      {/* App Header */}
      <header className="h-16 border-b border-white/5 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">Adaptation Livre</h1>
            <p className="text-[10px] text-white/40 font-medium">Reformatage &amp; Accessibilité de lecture</p>
          </div>
        </div>

        {/* Action Button: appears only when document is loaded */}
        {document && (
          <button
            onClick={handleExport}
            className="glow-btn px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-900/10 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Convertir &amp; Télécharger
          </button>
        )}
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden relative">
        {isAnalyzing && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-white">Analyse du document...</h4>
              <p className="text-xs text-white/40 mt-1">Extraction de la structure et du contenu...</p>
            </div>
          </div>
        )}

        {!document ? (
          /* Landing Page / File Uploader */
          <div className="h-full overflow-y-auto">
            <div className="py-12">
              <Dropzone onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} />
            </div>
          </div>
        ) : (
          /* Editor Split Layout */
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
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full select-none pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-950/80 border-red-500/30 text-red-200'
                : 'bg-zinc-900/90 border-white/10 text-zinc-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <Info className="w-4 h-4 text-purple-400" />
              )}
            </div>
            <p className="text-xs font-medium leading-normal">{toast.message}</p>
          </div>
        ))}
      </div>
      
    </div>
  );
}
