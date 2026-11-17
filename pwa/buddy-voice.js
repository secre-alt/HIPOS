// Uses only installed local voices; no network speech service or queued chatter.
export function createBuddyVoice({ synth, Utterance, chirp, duck, now = () => Date.now() }) {
  let last = -Infinity, turn = 0, active = null, timer;
  const stop = () => { clearTimeout(timer); if (active) { active = null; try { synth?.cancel(); } catch {} } };
  return {
    stop,
    play(text, language, { preview = false } = {}) {
      if (!preview && now() - last < 7000) return 'quiet';
      if (active || synth?.speaking || synth?.pending) return 'quiet';
      last = now();
      const voices = synth?.getVoices?.() || [];
      const match = language === 'fil' ? /^(fil|tl)(-|$)/i : /^en(-|$)/i;
      const voice = voices.find(v => v.localService === true && match.test(v.lang));
      const speak = voice && Utterance && text.length <= 110 && (preview || turn % 2 === 0);
      turn++;
      if (!speak) { chirp(); duck(); return 'chirp'; }
      try {
        const line = new Utterance(text);
        line.voice = voice; line.lang = voice.lang; line.pitch = 1.35; line.rate = 1.08; line.volume = .7;
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
