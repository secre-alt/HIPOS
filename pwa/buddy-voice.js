// Uses only installed local voices; no network speech service or queued chatter.
// The voice is picked for friendliness, and pitch and pace follow what Buddy is saying.

export const TONES = ['sweet', 'calm', 'bright'];
export const PACKS = ['bubbly', 'squeaky', 'sleepy', 'device'];
const BASE = { sweet: { pitch: 1.2, rate: 1.02 }, calm: { pitch: 1.05, rate: 0.94 }, bright: { pitch: 1.34, rate: 1.1 } };

// Names of installed voices that tend to sound warm and natural, and novelty voices to avoid.
const NATURAL = /natural|neural|enhanced|premium|siri/i;
const FRIENDLY = /samantha|karen|moira|tessa|zira|aria|jenny|susan|hazel|libby|sonia|catherine|fiona|victoria|allison|ava|joanna|ivy|kendra|kimberly|salli|female|google (us|uk|english)|blessica|rosa|angelo/i;
const AVOID = /compact|novelty|whisper|bad news|good news|bahh|bells|boing|bubbles|cellos|deranged|hysterical|organ|pipe|trinoids|zarvox|albert|fred|junior|ralph|superstar|wobble|jester|grandma|grandpa/i;

export function pickVoice(voices, language) {
  const match = language === 'fil' ? /^(fil|tl)(-|$)/i : /^en(-|$)/i;
  const regional = language === 'fil' ? /^(fil|tl)-PH$/i : /^en-(US|PH)$/i;
  const nearby = language === 'fil' ? /^(fil|tl)/i : /^en-(GB|AU)$/i;
  let best = null, bestScore = -Infinity;
  for (const v of voices || []) {
    if (v?.localService !== true || !match.test(v.lang || '')) continue;
    const name = v.name || '';
    const score = (NATURAL.test(name) ? 4 : 0) + (FRIENDLY.test(name) ? 3 : 0) - (AVOID.test(name) ? 6 : 0)
      + (regional.test(v.lang) ? 2 : nearby.test(v.lang) ? 1 : 0) + (v.default ? 1 : 0);
    if (score > bestScore) { best = v; bestScore = score; }
  }
  return best;
}

// Speak words, not decoration: drop emoji, arrows and separators that engines read out loud.
export function cleanForSpeech(text) {
  return String(text || '')
    .replace(/\p{Extended_Pictographic}/gu, ' ')
    .replace(/[→←↑↓·•◀▶★✓✔]/g, ' ')
    .replace(/\s*\/\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Pitch and pace follow the sentence: gentle for a retry, lively for a cheer, lifted for a question.
export function prosody(text, tone = 'sweet', random = Math.random) {
  const base = BASE[tone] || BASE.sweet;
  let pitch = base.pitch, rate = base.rate;
  if (/[!]\s*$/.test(text)) { pitch += 0.05; rate += 0.03; }
  if (/\?\s*$/.test(text)) { pitch += 0.07; rate -= 0.02; }
  if (/\b(almost|try again|breath|let the plastic|ask school staff|oops|not quite)\b/i.test(text)) { pitch -= 0.1; rate -= 0.05; }
  const wobble = () => (random() - 0.5) * 0.06;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  return { pitch: clamp(pitch + wobble(), 0.8, 1.6), rate: clamp(rate + wobble(), 0.85, 1.2) };
}

export function createBuddyVoice({ synth, Utterance, chirp, duck, babble, now = () => Date.now(), random = Math.random }) {
  let last = -Infinity, turn = 0, active = null, timer, busyUntil = -Infinity;
  const stop = () => { clearTimeout(timer); if (active) { active = null; try { synth?.cancel(); } catch {} } };
  return {
    stop,
    play(text, language, { preview = false, tone = 'sweet', pack = 'device' } = {}) {
      // Cute babble packs work on every device and never queue over each other.
      if (pack !== 'device' && babble) {
        if (!preview && now() - last < 3500) return 'quiet';
        if (now() < busyUntil) return preview ? 'quiet' : 'quiet';
        last = now();
        const length = babble(cleanForSpeech(text), pack) || 0;
        if (length > 0) { busyUntil = now() + length * 1000; duck(); return 'babble'; }
        chirp(); duck(); return 'chirp';
      }
      if (!preview && now() - last < 7000) return 'quiet';
      if (active || synth?.speaking || synth?.pending) return 'quiet';
      last = now();
      const spoken = cleanForSpeech(text);
      const voice = pickVoice(synth?.getVoices?.(), language);
      const speak = voice && Utterance && spoken && spoken.length <= 110 && (preview || turn % 2 === 0);
      turn++;
      if (!speak) { chirp(); duck(); return 'chirp'; }
      try {
        const line = new Utterance(spoken);
        const { pitch, rate } = prosody(spoken, tone, random);
        line.voice = voice; line.lang = voice.lang; line.pitch = pitch; line.rate = rate; line.volume = .75;
        active = line;
        line.onstart = () => { if (active === line) duck(); };
        line.onend = line.onerror = () => { if (active === line) { active = null; clearTimeout(timer); } };
        synth.speak(line);
        timer = setTimeout(stop, 6500);
        return 'speech';
      } catch { stop(); chirp(); duck(); return 'chirp'; }
    }
  };
}
