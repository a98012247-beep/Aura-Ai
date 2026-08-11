import { CHUNK_MAX_SIZE } from '../lib/constants';
import { useSettingsStore } from '../store/settings';

export function optimizeScript(text: string): string {
  const { cinematicSettings } = useSettingsStore.getState();
  let optimized = text;

  // 1. SPEED & PAUSE INTENSITY
  // Calculate pause markers based on settings
  let paragraphPause = '...\n\n';
  let sentencePause = '. ';
  
  if (cinematicSettings.pauseIntensity > 1.5) {
    paragraphPause = '......\n\n';
    sentencePause = '... ';
  } else if (cinematicSettings.pauseIntensity > 0.8) {
    paragraphPause = '....\n\n';
    sentencePause = '.. ';
  }

  if (cinematicSettings.storytellingMode === 'mystery' || cinematicSettings.storytellingMode === 'dark cinematic') {
     paragraphPause = '......\n\n';
     sentencePause = '... ';
  }

  // Apply paragraph pauses
  optimized = optimized.replace(/\n\n+/g, paragraphPause);

  // Apply sentence pauses
  if (cinematicSettings.pauseIntensity > 0.5) {
    // We only replace single spaces after punctuation to avoid multiplying existing pauses
    optimized = optimized.replace(/([.?!])\s(?!\s|\.)/g, `$1${sentencePause}`);
  }

  // 2. HUMAN IMPERFECTION SYSTEM
  if (cinematicSettings.humanImperfection) {
    // Randomly inject slight hesitations
    optimized = optimized.replace(/\b(but|however|although|suddenly)\b/gi, '... $1');
    optimized = optimized.replace(/,\s+(and|so)\b/gi, ', ... $1');
  }

  // 3. EMPHASIS ENGINE
  if (cinematicSettings.emphasisEngine) {
    // Add dramatic dashes for tension words to hint to TTS
    const emphasisWords = [
      'suddenly', 'immediately', 'shocking', 'forever', 'never', 
      'always', 'impossible', 'everything changed', 'crucial', 
      'disaster', 'truth', 'secret', 'revealed', 'danger'
    ];
    
    emphasisWords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      optimized = optimized.replace(regex, '— $1 —');
    });
  }

  // 4. CLARITY BOOST (Basic diction improvements)
  if (cinematicSettings.clarityBoost) {
     // Replace problematic contractions optionally or space out acronyms
     // Here we just ensure em-dashes and en-dashes have breathing room
     optimized = optimized.replace(/([a-zA-Z])—([a-zA-Z])/g, '$1 — $2');
  }

  return optimized;
}

export function chunkScript(text: string): string[] {
  const optimizedText = optimizeScript(text);
  const chunks: string[] = [];
  let currentStart = 0;

  while (currentStart < optimizedText.length) {
    if (optimizedText.length - currentStart <= CHUNK_MAX_SIZE) {
      chunks.push(optimizedText.substring(currentStart).trim());
      break;
    }

    let searchSpan = optimizedText.substring(currentStart, currentStart + CHUNK_MAX_SIZE);
    let splitIndex = -1;

    // Prefer splitting at paragraphs
    const lastParagraph = searchSpan.lastIndexOf('\n\n');
    if (lastParagraph > CHUNK_MAX_SIZE * 0.5) {
      splitIndex = lastParagraph;
    }

    // Try sentences
    if (splitIndex === -1) {
      // Adjusted sentence enders to allow for our custom ellipsis injections
      const sentenceEnders = ['. ', '.. ', '... ', '! ', '? ', '." ', '!" ', '?" '];
      let bestSentenceIndex = -1;
      let usedEnderLength = 0;
      
      for (const ender of sentenceEnders) {
        const idx = searchSpan.lastIndexOf(ender);
        if (idx > bestSentenceIndex) {
          bestSentenceIndex = idx;
          usedEnderLength = ender.trim().length; 
        }
      }
      if (bestSentenceIndex > CHUNK_MAX_SIZE * 0.5) {
        splitIndex = bestSentenceIndex + usedEnderLength; 
      }
    }

    // Try commas
    if (splitIndex === -1) {
      const splitComma = searchSpan.lastIndexOf(', ');
      if (splitComma > CHUNK_MAX_SIZE * 0.5) {
        splitIndex = splitComma + 1;
      }
    }

    // Hard split at max size if no good split found
    if (splitIndex === -1) {
      splitIndex = CHUNK_MAX_SIZE;
    }

    const chunk = optimizedText.substring(currentStart, currentStart + splitIndex).trim();
    if (chunk) chunks.push(chunk);
    
    currentStart += splitIndex;
  }

  return chunks.filter(c => c.length > 0);
}
