import JSZip from 'jszip';
import type { ParsedDocument } from './pdfParser';
import type { AppOptions } from './pdfGenerator';
import { transformParagraphToHtml } from './textTransformer';

// Helper: Convert base64 image data to Uint8Array for zip packaging
function base64ToUint8Array(base64Data: string): Uint8Array {
  const base64String = base64Data.split(',')[1];
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Fetch local font file as ArrayBuffer, accounting for base directory on GitHub Pages
async function fetchFontFile(filename: string): Promise<ArrayBuffer | null> {
  try {
    const baseUrl = (import.meta as any).env.BASE_URL || '/';
    // Clean double slashes
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const fontUrl = `${window.location.origin}${cleanBaseUrl}fonts/${filename}`;
    
    const response = await fetch(fontUrl);
    if (!response.ok) {
      console.warn(`Font fetch failed: ${fontUrl} (Status ${response.status})`);
      return null;
    }
    return await response.arrayBuffer();
  } catch (e) {
    console.error(`Error fetching font file ${filename}:`, e);
    return null;
  }
}

// Local font filename mappings for packaging in EPUB
const FONT_ASSET_MAPPING: { [family: string]: string[] } = {
  'Luciole': ['Luciole-Regular.ttf', 'Luciole-Bold.ttf'],
  'Sylexiad Serif Thin': ['SylexiadSerifThin.ttf', 'SylexiadSerifThin-Bold.ttf'],
  'TT Interphases Pro Trial Light': ['TT Interphases Pro Trial Regular.ttf', 'TT Interphases Pro Trial Bold.ttf'],
  'Caldina': ['Outfit-Variable.ttf'],
  'Squad': ['Cabin[wdth,wght].ttf']
};

export async function generateEpub(
  doc: ParsedDocument,
  options: AppOptions,
  originalFilename: string
): Promise<void> {
  const zip = new JSZip();

  // 1. mimetype: MUST be first, uncompressed (STORE)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. Process fonts to embed
  const fontsToEmbed = FONT_ASSET_MAPPING[options.fontFamily] || [];
  const embeddedFontFiles: string[] = [];

  for (const fontFile of fontsToEmbed) {
    const buffer = await fetchFontFile(fontFile);
    if (buffer) {
      zip.file(`OEBPS/fonts/${fontFile}`, buffer);
      embeddedFontFiles.push(fontFile);
    }
  }

  // 4. Process and package images
  const imageFiles: { zipPath: string; mediaType: string; originalSrc: string }[] = [];
  let imageCounter = 1;

  doc.sections.forEach((section) => {
    section.elements.forEach((el) => {
      if (el.type === 'image' && !options.suppressImages) {
        try {
          const match = el.src.match(/^data:(image\/[^;]+);base64,/);
          const mediaType = match ? match[1] : 'image/jpeg';
          const ext = mediaType.split('/')[1] || 'jpg';
          const filename = `img_${imageCounter}.${ext}`;
          const zipPath = `images/${filename}`;
          
          const binaryData = base64ToUint8Array(el.src);
          zip.file(`OEBPS/${zipPath}`, binaryData);

          imageFiles.push({
            zipPath,
            mediaType,
            originalSrc: el.src
          });

          imageCounter++;
        } catch (e) {
          console.error('Failed to convert image for EPUB package:', e);
        }
      }
    });
  });

  // 5. Generate content.css stylesheet
  let fontDeclarations = '';
  if (options.fontFamily === 'Luciole' && embeddedFontFiles.includes('Luciole-Regular.ttf')) {
    fontDeclarations += `
@font-face {
  font-family: 'Luciole';
  src: url('fonts/Luciole-Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'Luciole';
  src: url('fonts/Luciole-Bold.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
}
`;
  } else if (options.fontFamily === 'Sylexiad Serif Thin' && embeddedFontFiles.includes('SylexiadSerifThin.ttf')) {
    fontDeclarations += `
@font-face {
  font-family: 'Sylexiad Serif Thin';
  src: url('fonts/SylexiadSerifThin.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'Sylexiad Serif Thin';
  src: url('fonts/SylexiadSerifThin-Bold.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
}
`;
  } else if (options.fontFamily === 'TT Interphases Pro Trial Light' && embeddedFontFiles.includes('TT Interphases Pro Trial Regular.ttf')) {
    fontDeclarations += `
@font-face {
  font-family: 'TT Interphases Pro Trial Light';
  src: url('fonts/TT Interphases Pro Trial Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'TT Interphases Pro Trial Light';
  src: url('fonts/TT Interphases Pro Trial Bold.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
}
`;
  } else if (options.fontFamily === 'Caldina' && embeddedFontFiles.includes('Outfit-Variable.ttf')) {
    fontDeclarations += `
@font-face {
  font-family: 'Caldina';
  src: url('fonts/Outfit-Variable.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
`;
  } else if (options.fontFamily === 'Squad' && embeddedFontFiles.includes('Cabin[wdth,wght].ttf')) {
    fontDeclarations += `
@font-face {
  font-family: 'Squad';
  src: url('fonts/Cabin[wdth,wght].ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
`;
  }

  // Generate body configuration CSS
  const fontCssName = options.fontFamily;
  const alignmentCss = options.alignment;

  const contentCss = `
${fontDeclarations}

body {
  font-family: '${fontCssName}', sans-serif;
  font-size: ${options.fontSize}pt;
  line-height: ${options.lineHeight};
  letter-spacing: ${options.letterSpacing}px;
  background-color: ${options.bgColor};
  color: ${options.textColor};
  margin: 1.5em;
  text-align: ${alignmentCss};
}

h1, h2, h3, h4 {
  font-family: '${fontCssName}', sans-serif;
  color: ${options.textColor};
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  text-align: center;
}

h2 {
  font-size: 1.4em;
  border-bottom: 1px solid ${options.textColor}33;
  padding-bottom: 0.3em;
}

p {
  margin-top: 0;
  margin-bottom: ${options.paragraphSpacing}px;
  text-indent: 0;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1.5em auto;
}

span.sentence-bg {
  border-radius: 3px;
  padding: 0 3px;
}
`;
  zip.file('OEBPS/content.css', contentCss);

  // 6. Generate XHTML chapters
  const chaptersInfo: { id: string; title: string; href: string }[] = [];

  doc.sections.forEach((section, sIdx) => {
    const chapterId = `chapter_${sIdx + 1}`;
    const chapterHref = `chapter_${sIdx + 1}.xhtml`;

    let displayTitle = section.title;
    let headingStyle = '';
    
    if (options.normalizeHeadings) {
      displayTitle = `${sIdx + 1}. ${displayTitle.charAt(0).toUpperCase() + displayTitle.slice(1).toLowerCase()}`;
      headingStyle = ' style="text-decoration: underline;"';
    }

    if (options.showHeadingIcon) {
      displayTitle = `${options.headingEmoji} ${displayTitle}`;
    }

    // Build the XHTML contents
    let elementsHtml = '';
    section.elements.forEach((el) => {
      if (el.type === 'image') {
        if (options.suppressImages) return;

        // Resolve local zip path for this image
        const imgFile = imageFiles.find((f) => f.originalSrc === el.src);
        if (imgFile) {
          elementsHtml += `<div class="image-wrapper"><img src="${imgFile.zipPath}" alt="Image" /></div>\n`;
        }
      } else if (el.type === 'text') {
        const prefix = options.showParagraphIcon ? `<span style="margin-right: 8px; font-weight: bold;">${options.headingEmoji}</span>` : '';
        const formatted = transformParagraphToHtml(el.text, options.highlightTags, options.advancedColoring);
        elementsHtml += `<p>${prefix}${formatted}</p>\n`;
      }
    });

    const chapterHtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr" lang="fr">
<head>
  <title>${section.title}</title>
  <link rel="stylesheet" type="text/css" href="content.css"/>
  <meta charset="utf-8"/>
</head>
<body>
  <section>
    <h2${headingStyle}>${displayTitle}</h2>
    ${elementsHtml}
  </section>
</body>
</html>`;

    zip.file(`OEBPS/${chapterHref}`, chapterHtml);
    chaptersInfo.push({
      id: chapterId,
      title: section.title,
      href: chapterHref
    });
  });

  // 7. Generate Table of Contents (nav.xhtml)
  let tocItems = '';
  chaptersInfo.forEach((chap) => {
    tocItems += `        <li><a href="${chap.href}">${chap.title}</a></li>\n`;
  });

  const navHtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="fr" lang="fr">
<head>
  <title>Table des Matières</title>
  <link rel="stylesheet" type="text/css" href="content.css"/>
  <meta charset="utf-8"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table des Matières</h1>
    <ol>
${tocItems}    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navHtml);

  // 8. Generate OPF manifest (content.opf)
  let manifestXml = `    <!-- Stylesheets -->
    <item id="css" href="content.css" media-type="text/css"/>
    
    <!-- Navigation (TOC) -->
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
\n`;

  // Add chapters to manifest
  chaptersInfo.forEach((chap) => {
    manifestXml += `    <item id="${chap.id}" href="${chap.href}" media-type="application/xhtml+xml"/>\n`;
  });

  // Add images to manifest
  imageFiles.forEach((img, idx) => {
    manifestXml += `    <item id="img_${idx + 1}" href="${img.zipPath}" media-type="${img.mediaType}"/>\n`;
  });

  // Add fonts to manifest
  embeddedFontFiles.forEach((font, idx) => {
    manifestXml += `    <item id="font_${idx + 1}" href="fonts/${font}" media-type="font/ttf"/>\n`;
  });

  // Spine XML
  let spineXml = '';
  chaptersInfo.forEach((chap) => {
    spineXml += `    <itemref idref="${chap.id}"/>\n`;
  });

  const uniqueId = `urn:uuid:${crypto.randomUUID ? crypto.randomUUID() : '12345678-1234-5678-1234-567812345678'}`;

  const opfXml = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${uniqueId}</dc:identifier>
    <dc:title>${doc.title}</dc:title>
    <dc:language>fr</dc:language>
    <dc:creator>Adaptation Livre</dc:creator>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
${manifestXml}  </manifest>
  <spine>
${spineXml}  </spine>
</package>`;
  zip.file('OEBPS/content.opf', opfXml);

  // 9. Generate the ZIP archive and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = originalFilename.replace(/\.[^/.]+$/, '') + '_converti.epub';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
