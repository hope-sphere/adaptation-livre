import JSZip from 'jszip';
import type { ParsedDocument, Section, SectionElement } from './pdfParser';

// Helper: Resolve relative paths (e.g. "text/ch1.xhtml" + "../images/img.jpg" -> "images/img.jpg")
function resolveRelativePath(baseFile: string, relativePath: string): string {
  const baseDir = baseFile.substring(0, baseFile.lastIndexOf('/') + 1);
  const parts = (baseDir + relativePath).split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

export async function parseEpub(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Read container.xml to locate the OPF file path
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Invalid EPUB: META-INF/container.xml missing.');
  }
  const containerText = await containerFile.async('text');
  const domParser = new DOMParser();
  const containerDom = domParser.parseFromString(containerText, 'application/xml');
  const rootfileEl = containerDom.querySelector('rootfile');
  const opfPath = rootfileEl?.getAttribute('full-path');

  if (!opfPath) {
    throw new Error('Invalid EPUB: full-path attribute missing in container.xml.');
  }

  // Determine base folder inside zip for OPF elements (usually OEBPS/ or EPUB/ or empty)
  const basePath = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Parse OPF file (metadata, manifest, spine)
  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}.`);
  }
  const opfText = await opfFile.async('text');
  const opfDom = domParser.parseFromString(opfText, 'application/xml');

  // Extract Metadata: Title
  const titleEl = opfDom.getElementsByTagName('dc:title')[0] || opfDom.querySelector('title');
  const bookTitle = titleEl?.textContent || file.name.replace(/\.epub$/i, '').replace(/[_-]/g, ' ');

  // Extract Manifest: Map of ID -> { href, mediaType }
  const manifestItems: { [id: string]: { href: string; mediaType: string } } = {};
  const itemElements = opfDom.querySelectorAll('manifest > item');
  itemElements.forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type');
    if (id && href && mediaType) {
      manifestItems[id] = { href, mediaType };
    }
  });

  // Extract Spine: Order of itemref IDs
  const spineElements = opfDom.querySelectorAll('spine > itemref');
  const spineIds: string[] = [];
  spineElements.forEach((itemref) => {
    const idref = itemref.getAttribute('idref');
    if (idref) {
      spineIds.push(idref);
    }
  });

  const sections: Section[] = [];
  let chapterIndex = 1;

  // 3. Process each HTML file in the spine order
  for (const spineId of spineIds) {
    const manifestItem = manifestItems[spineId];
    if (!manifestItem) continue;

    const htmlPath = manifestItem.href;
    const fullHtmlPath = basePath + htmlPath;
    const htmlFile = zip.file(fullHtmlPath);
    if (!htmlFile) continue;

    const htmlText = await htmlFile.async('text');
    const htmlDom = domParser.parseFromString(htmlText, 'text/html');

    // Resolve and extract images inside this HTML chapter
    const imgEls = htmlDom.querySelectorAll('img');
    for (let i = 0; i < imgEls.length; i++) {
      const imgEl = imgEls[i];
      const src = imgEl.getAttribute('src');
      if (src && !src.startsWith('data:') && !src.startsWith('http')) {
        const resolvedImgPath = resolveRelativePath(htmlPath, src);
        const fullImgPath = basePath + resolvedImgPath;
        const zipImageFile = zip.file(fullImgPath);

        if (zipImageFile) {
          try {
            // Read image as base64
            const imgBase64 = await zipImageFile.async('base64');
            // Try to find the correct media-type from manifest
            const imgManifestItem = Object.values(manifestItems).find(
              (item) => item.href === resolvedImgPath || basePath + item.href === fullImgPath
            );
            const mediaType = imgManifestItem?.mediaType || 'image/jpeg';
            imgEl.setAttribute('src', `data:${mediaType};base64,${imgBase64}`);
          } catch (e) {
            console.error(`Error resolving EPUB image: ${fullImgPath}`, e);
          }
        }
      }
    }

    // Resolve SVG <image> tags (common in children's books or special EPUB formatting)
    const svgImgEls = htmlDom.querySelectorAll('image');
    for (let i = 0; i < svgImgEls.length; i++) {
      const svgImgEl = svgImgEls[i];
      const href = svgImgEl.getAttribute('href') || svgImgEl.getAttribute('xlink:href');
      if (href && !href.startsWith('data:') && !href.startsWith('http')) {
        const resolvedImgPath = resolveRelativePath(htmlPath, href);
        const fullImgPath = basePath + resolvedImgPath;
        const zipImageFile = zip.file(fullImgPath);

        if (zipImageFile) {
          try {
            const imgBase64 = await zipImageFile.async('base64');
            const imgManifestItem = Object.values(manifestItems).find(
              (item) => item.href === resolvedImgPath || basePath + item.href === fullImgPath
            );
            const mediaType = imgManifestItem?.mediaType || 'image/jpeg';
            
            // Replace SVG image tag with normal img element inside a div or inline base64
            svgImgEl.setAttribute('href', `data:${mediaType};base64,${imgBase64}`);
          } catch (e) {
            console.error(`Error resolving SVG image: ${fullImgPath}`, e);
          }
        }
      }
    }

    // 4. Extract section title
    // Look for first <h1>, <h2>, etc. or fall back to <title> or "Chapitre X"
    const headingEl = htmlDom.querySelector('h1, h2, h3, h4');
    let chapterTitle = headingEl?.textContent?.trim() || '';
    if (!chapterTitle) {
      const titleTag = htmlDom.querySelector('title');
      chapterTitle = titleTag?.textContent?.trim() || '';
    }
    if (!chapterTitle) {
      chapterTitle = `Chapitre ${chapterIndex}`;
    }

    // 5. Extract content elements (text paragraphs and inline images)
    const elements: SectionElement[] = [];
    const bodyEl = htmlDom.querySelector('body') || htmlDom.documentElement;

    // Traverse body elements in preorder to preserve sequential order of paragraphs and images
    const walkNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();

        if (tagName === 'p' || tagName === 'blockquote' || el.classList.contains('paragraph')) {
          const text = el.textContent?.trim() || '';
          if (text) {
            elements.push({ type: 'text', text });
          }
          // Do not recurse inside paragraph elements to avoid double counting nested spans
          return;
        }

        if (tagName === 'img') {
          const src = el.getAttribute('src');
          if (src) {
            elements.push({ type: 'image', src });
          }
          return;
        }

        if (tagName === 'image' && el.namespaceURI === 'http://www.w3.org/2000/svg') {
          const href = el.getAttribute('href') || el.getAttribute('xlink:href');
          if (href) {
            elements.push({ type: 'image', src: href });
          }
          return;
        }

        // Recurse children for general container elements (div, section, article, etc.)
        for (let i = 0; i < el.childNodes.length; i++) {
          walkNode(el.childNodes[i]);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Handle standalone text nodes in body if any
        const text = node.textContent?.trim();
        if (text && node.parentElement === bodyEl) {
          elements.push({ type: 'text', text });
        }
      }
    };

    // Parse children of body
    for (let i = 0; i < bodyEl.childNodes.length; i++) {
      walkNode(bodyEl.childNodes[i]);
    }

    // If we have elements, save this as a section
    if (elements.length > 0) {
      sections.push({
        title: chapterTitle,
        elements
      });
      chapterIndex++;
    }
  }

  return {
    title: bookTitle,
    sections
  };
}
