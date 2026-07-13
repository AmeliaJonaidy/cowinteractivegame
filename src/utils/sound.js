class SoundManager {
  constructor() {
    this.ctx = null;
    this.robotTimer = null;
    this.effectVolumeMultiplier = 3;
    this.applauseAudio = new Audio("/sounds/applause.mp3");
    this.applauseAudio.volume = Math.min(1, 0.8 * this.effectVolumeMultiplier);
    this.muted = false;
  }

  unlock() {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  setMuted(muted) {
    this.muted = muted;
  }

  playAmbient() {
    this.startRoboticLoop();
  }

  pauseAmbient() {
    this.stopRoboticLoop();
  }

  playTone({ frequency, duration = 0.15, type = "sine", volume = 0.08, when = 0 }) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;

    const startAt = this.ctx.currentTime + when;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const effectVolume = volume * this.effectVolumeMultiplier;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(effectVolume, startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(this.ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.03);
  }

  playNoiseBurst({
    duration = 0.12,
    volume = 0.18,
    when = 0,
    filterType = "bandpass",
    frequency = 2200,
    q = 0.8,
  }) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;

    const startAt = this.ctx.currentTime + when;
    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const effectVolume = volume * this.effectVolumeMultiplier;

    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, startAt);
    filter.Q.setValueAtTime(q, startAt);
    gain.gain.setValueAtTime(effectVolume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start(startAt);
  }

  startRoboticLoop() {
    if (this.muted || this.robotTimer) return;
    this.unlock();
    this.playRobotPhrase();
    this.robotTimer = window.setInterval(() => this.playRobotPhrase(), 360);
  }

  stopRoboticLoop() {
    if (!this.robotTimer) return;
    window.clearInterval(this.robotTimer);
    this.robotTimer = null;
  }

  playRobotPhrase() {
    const base = 160 + Math.random() * 120;
    const steps = [1, 2.4, 0.75, 3.1, 1.35];

    steps.forEach((step, index) => {
      this.playTone({
        frequency: base * step,
        duration: 0.045 + Math.random() * 0.035,
        type: index % 2 === 0 ? "square" : "sawtooth",
        volume: 0.035 + Math.random() * 0.025,
        when: index * 0.055,
      });
    });
    this.playNoiseBurst({ duration: 0.035, volume: 0.035, when: 0.16 });
  }

  playApplause() {
    if (this.muted) return;
    if (this.tryAudio(this.applauseAudio)) return;
    this.playGeneratedApplause();
  }

  playGeneratedApplause() {
    for (let i = 0; i < 44; i += 1) {
      this.playNoiseBurst({
        duration: 0.045 + Math.random() * 0.055,
        volume: 0.07 + Math.random() * 0.1,
        when: i * 0.035 + Math.random() * 0.12,
        filterType: "bandpass",
        frequency: 950 + Math.random() * 2600,
        q: 0.5 + Math.random() * 1.4,
      });
    }
    for (let i = 0; i < 10; i += 1) {
      this.playNoiseBurst({
        duration: 0.18 + Math.random() * 0.16,
        volume: 0.03 + Math.random() * 0.035,
        when: i * 0.16,
        filterType: "highpass",
        frequency: 650 + Math.random() * 500,
        q: 0.35,
      });
    }
  }

  // Kept as `playMoo()` so useRevealMachine.js doesn't need any changes —
  // it's called at the finale moment, now plays a spaceship victory fanfare
  // instead of a cow moo.
  playMoo() {
    if (this.muted) return;
    this.playVictoryFanfare();
  }

  playVictoryFanfare() {
    this.unlock();
    if (!this.ctx) return;

    const startAt = this.ctx.currentTime;

    // --- Rocket whoosh: rising filtered noise sweep ---
    const whooshDuration = 0.9;
    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, sampleRate * whooshDuration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const whooshSource = this.ctx.createBufferSource();
    whooshSource.buffer = buffer;
    const whooshFilter = this.ctx.createBiquadFilter();
    whooshFilter.type = "bandpass";
    whooshFilter.Q.setValueAtTime(1.2, startAt);
    whooshFilter.frequency.setValueAtTime(300, startAt);
    whooshFilter.frequency.exponentialRampToValueAtTime(3800, startAt + whooshDuration);
    const whooshGain = this.ctx.createGain();
    whooshGain.gain.setValueAtTime(0.0001, startAt);
    whooshGain.gain.exponentialRampToValueAtTime(0.22 * this.effectVolumeMultiplier, startAt + 0.35);
    whooshGain.gain.exponentialRampToValueAtTime(0.0001, startAt + whooshDuration);
    whooshSource.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(this.ctx.destination);
    whooshSource.start(startAt);

    // --- Ascending triumphant chord stab (the "YAYYY!") ---
    const chordNotes = [523.25, 659.25, 784.0, 1046.5]; // C5 E5 G5 C6 - bright major chord
    chordNotes.forEach((freq, i) => {
      const noteStart = startAt + 0.55 + i * 0.06;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, noteStart);
      noteGain.gain.setValueAtTime(0.0001, noteStart);
      noteGain.gain.exponentialRampToValueAtTime(0.18 * this.effectVolumeMultiplier, noteStart + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.4);
      osc.connect(noteGain);
      noteGain.connect(this.ctx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + 1.5);
    });

    // --- Sparkle: quick high bell-like flourish ---
    const sparkleFreqs = [1568, 1975, 2349, 3136];
    sparkleFreqs.forEach((freq, i) => {
      this.playTone({
        frequency: freq,
        duration: 0.25,
        type: "sine",
        volume: 0.06,
        when: 0.9 + i * 0.08,
      });
    });
  }

  tryAudio(audio) {
    if (!audio) return false;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {
        if (audio === this.applauseAudio) this.playGeneratedApplause();
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const soundManager = new SoundManager();
