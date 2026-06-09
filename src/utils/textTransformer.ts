export interface HighlightTag {
  word: string;
  style: 'bold' | 'color';
  color: string;
}

export type AdvancedColoringType = 'none' | 'sentence-bg' | 'syllable' | 'word' | 'liaison';

export interface AdvancedColoringConfig {
  type: AdvancedColoringType;
  colors: string[]; // [color1, color2] or [liaisonColor]
}

// Split text into French sentences
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  // Match characters until . ! or ? and trailing spaces or quotes/brackets
  const regex = /[^.!?]+(?:[.!?]+["»'\s]*|(?=$))/g;
  const matches = text.match(regex);
  if (!matches) return [text];
  return matches.map(s => s.trim()).filter(Boolean);
}

// Split a paragraph into sub-paragraphs containing max phrases
export function splitParagraphIntoBlocks(text: string, maxPhrases: number): string[] {
  if (maxPhrases <= 0) return [text];
  const sentences = splitIntoSentences(text);
  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += maxPhrases) {
    groups.push(sentences.slice(i, i + maxPhrases).join(' '));
  }
  return groups;
}

// French Syllabification heuristic algorithm
export function getSyllables(word: string): string[] {
  // If word is very short, no need to split
  if (word.length <= 3) return [word];
  
  const vowels = /[aeiouyàâéèêëîïôûùüÿœæAEIOUYÀÂÉÈÊËÎÏÔÛÙÜŸŒÆ]/;
  const isVowel = (char: string) => vowels.test(char);
  
  const syllables: string[] = [];
  let current = '';
  
  for (let i = 0; i < word.length; i++) {
    current += word[i];
    
    if (isVowel(word[i])) {
      // Look ahead for the next vowel to determine the division point
      let nextVowelIndex = -1;
      for (let j = i + 1; j < word.length; j++) {
        if (isVowel(word[j])) {
          nextVowelIndex = j;
          break;
        }
      }
      
      if (nextVowelIndex !== -1) {
        const consonantsBetween = word.substring(i + 1, nextVowelIndex);
        const numConsonants = consonantsBetween.length;
        
        if (numConsonants === 1) {
          // Rule: V-CV. Split before the consonant (e.g. a-mi)
          syllables.push(current);
          current = '';
        } else if (numConsonants === 2) {
          // Rule: V-CCV. Split in between consonants unless it's an inseparable cluster
          const cluster = consonantsBetween;
          const isInseparable = /^(tr|dr|pr|br|cr|gr|fr|vr|ch|ph|th|gn|cl|pl|bl|gl|fl|lh|rh)$/i.test(cluster);
          if (isInseparable) {
            // Split before the cluster (e.g. ta-bleau)
            syllables.push(current);
            current = '';
          } else {
            // Split in between (e.g. ac-teur)
            current += consonantsBetween[0];
            i++; // Skip the first consonant in next iteration
            syllables.push(current);
            current = '';
          }
        } else if (numConsonants >= 3) {
          // Rule: V-CCCV. Split after the first or second consonant depending on clusters
          const clusterOfTwo = consonantsBetween.substring(1);
          const isInseparable = /^(tr|dr|pr|br|cr|gr|fr|vr|ch|ph|th|gn|cl|pl|bl|gl|fl|lh|rh)$/i.test(clusterOfTwo);
          if (isInseparable) {
            // Split: C1-C2C3 (e.g. ins-truire)
            current += consonantsBetween[0];
            i++;
            syllables.push(current);
            current = '';
          } else {
            // Split: C1C2-C3 (e.g. obs-ti-né)
            current += consonantsBetween.substring(0, 2);
            i += 2;
            syllables.push(current);
            current = '';
          }
        }
      }
    }
  }
  
  if (current) {
    if (syllables.length > 0) {
      // If the remaining part has no vowels, append to the last syllable
      const hasVowel = [...current].some(c => isVowel(c));
      if (!hasVowel) {
        syllables[syllables.length - 1] += current;
      } else {
        syllables.push(current);
      }
    } else {
      syllables.push(current);
    }
  }
  
  return syllables;
}

// Tokenize text into words (alphanumeric/accented) and non-words (punctuation/spaces)
function tokenize(text: string): string[] {
  // Split keeping matches in the array
  return text.split(/([a-zA-Z0-9à-öø-ÿÀ-ÖØ-ßœŒÆæ]+)/g);
}

const wordRegex = /^[a-zA-Z0-9à-öø-ÿÀ-ÖØ-ßœŒÆæ]+$/;

// Apply simple keyword highlighting to text
function applySimpleHighlighting(text: string, highlightTags: HighlightTag[]): string {
  if (highlightTags.length === 0) return escapeHtml(text);

  let html = escapeHtml(text);

  // Apply each highlight tag
  for (const tag of highlightTags) {
    if (!tag.word.trim()) continue;
    const escapedWord = tag.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // Match word with boundary check supporting French characters/apostrophes
    const regex = new RegExp(
      `(?<=^|[^a-zA-Z0-9à-öø-ÿÀ-ÖØ-ßœŒÆæ])(${escapedWord})(?=$|[^a-zA-Z0-9à-öø-ÿÀ-ÖØ-ßœŒÆæ])`,
      'gi'
    );
    
    const styleAttr = tag.style === 'color' ? ` style="color: ${tag.color};"` : '';
    const classAttr = tag.style === 'bold' ? ' style="font-weight: bold;"' : styleAttr;
    
    // We use a replacement function to preserve case of matched word
    html = html.replace(regex, (match) => `<span${classAttr}>${match}</span>`);
  }

  return html;
}

// Simple HTML escaping helper
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Main transform function: converts a paragraph text to HTML string
export function transformParagraphToHtml(
  text: string,
  highlightTags: HighlightTag[],
  config: AdvancedColoringConfig
): string {
  if (!text) return '';

  const { type, colors } = config;

  // 1. Alternating background colors per sentence
  if (type === 'sentence-bg') {
    const sentences = splitIntoSentences(text);
    const bg1 = colors[0] || 'rgba(170, 59, 255, 0.08)';
    const bg2 = colors[1] || 'rgba(59, 130, 246, 0.08)';

    return sentences
      .map((sentence, idx) => {
        const bg = idx % 2 === 0 ? bg1 : bg2;
        // Simple highlighting inside sentences is allowed since they do not conflict
        const highlighted = applySimpleHighlighting(sentence, highlightTags);
        return `<span style="background-color: ${bg}; padding: 2px 4px; border-radius: 4px; margin-right: 4px; display: inline-block;">${highlighted}</span>`;
      })
      .join(' ');
  }

  // 2. Alternating text colors per word
  if (type === 'word') {
    const c1 = colors[0] || '#a855f7';
    const c2 = colors[1] || '#3b82f6';
    const tokens = tokenize(text);
    let wordCount = 0;

    return tokens
      .map((token) => {
        if (wordRegex.test(token)) {
          const color = wordCount % 2 === 0 ? c1 : c2;
          wordCount++;
          return `<span style="color: ${color};">${escapeHtml(token)}</span>`;
        }
        return escapeHtml(token);
      })
      .join('');
  }

  // 3. Alternating text colors per syllable
  if (type === 'syllable') {
    const c1 = colors[0] || '#a855f7';
    const c2 = colors[1] || '#10b981';
    const tokens = tokenize(text);

    return tokens
      .map((token) => {
        if (wordRegex.test(token)) {
          const syllables = getSyllables(token);
          return syllables
            .map((syllable, sIdx) => {
              const color = sIdx % 2 === 0 ? c1 : c2;
              return `<span style="color: ${color};">${escapeHtml(syllable)}</span>`;
            })
            .join('');
        }
        return escapeHtml(token);
      })
      .join('');
  }

  // 4. Continuity (liaison) between sentences
  if (type === 'liaison') {
    const liaisonColor = colors[0] || '#ef4444';
    const sentences = splitIntoSentences(text);

    return sentences
      .map((sentence, sIdx) => {
        const tokens = tokenize(sentence);
        
        // Find indices of word tokens
        const wordIndices: number[] = [];
        tokens.forEach((t, tIdx) => {
          if (wordRegex.test(t)) {
            wordIndices.push(tIdx);
          }
        });

        if (wordIndices.length === 0) {
          return tokens.map(escapeHtml).join('');
        }

        const firstWordIdx = wordIndices[0];
        const lastWordIdx = wordIndices[wordIndices.length - 1];

        return tokens
          .map((token, tIdx) => {
            const isFirstWord = tIdx === firstWordIdx;
            const isLastWord = tIdx === lastWordIdx;
            
            // Color first word if it links with a previous sentence
            const colorFirst = isFirstWord && sIdx > 0;
            // Color last word if it links with a next sentence
            const colorLast = isLastWord && sIdx < sentences.length - 1;

            if (colorFirst || colorLast) {
              return `<span style="color: ${liaisonColor}; font-weight: 500;">${escapeHtml(token)}</span>`;
            }

            return escapeHtml(token);
          })
          .join('');
      })
      .join(' ');
  }

  // Default: Apply simple highlight tags if no advanced coloring is selected
  return applySimpleHighlighting(text, highlightTags);
}
