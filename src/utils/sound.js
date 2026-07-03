class SoundManager {
  constructor() {
    this.ctx = null;
    this.robotTimer = null;
    this.applauseAudio = new Audio("/sounds/applause.mp3");
    this.mooAudio = new Audio("/sounds/moo.mp3");
    this.applauseAudio.volume = 0.8;
    this.mooAudio.volume = 0.95;
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

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
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

    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, startAt);
    filter.Q.setValueAtTime(q, startAt);
    gain.gain.setValueAtTime(volume, startAt);
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

  playMoo() {
    if (this.muted) return;
    if (this.tryAudio(this.mooAudio)) return;
    this.playGeneratedMoo();
  }

  tryAudio(audio) {
    if (!audio) return false;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {
        if (audio === this.applauseAudio) this.playGeneratedApplause();
        if (audio === this.mooAudio) this.playGeneratedMoo();
      });
      return true;
    } catch {
      return false;
    }
  }

  playGeneratedMoo() {
    this.unlock();
    if (!this.ctx) return;

    const startAt = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const lowOscillator = this.ctx.createOscillator();
    const noseOscillator = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();
    const lowGain = this.ctx.createGain();
    const noseGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const formant = this.ctx.createBiquadFilter();
    const nasal = this.ctx.createBiquadFilter();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(148, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(76, startAt + 3.65);
    lowOscillator.type = "triangle";
    lowOscillator.frequency.setValueAtTime(74, startAt);
    lowOscillator.frequency.exponentialRampToValueAtTime(48, startAt + 3.9);
    noseOscillator.type = "sine";
    noseOscillator.frequency.setValueAtTime(214, startAt);
    noseOscillator.frequency.exponentialRampToValueAtTime(138, startAt + 2.9);
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(4.2, startAt);
    lfoGain.gain.setValueAtTime(8, startAt);
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(680, startAt);
    filter.frequency.exponentialRampToValueAtTime(360, startAt + 3.4);
    formant.type = "bandpass";
    formant.frequency.setValueAtTime(520, startAt);
    formant.frequency.exponentialRampToValueAtTime(720, startAt + 0.7);
    formant.frequency.exponentialRampToValueAtTime(440, startAt + 3.2);
    formant.Q.setValueAtTime(5.5, startAt);
    nasal.type = "bandpass";
    nasal.frequency.setValueAtTime(1180, startAt);
    nasal.frequency.exponentialRampToValueAtTime(850, startAt + 2.4);
    nasal.Q.setValueAtTime(7, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.36, startAt + 0.16);
    gain.gain.setValueAtTime(0.36, startAt + 2.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 4.15);
    lowGain.gain.setValueAtTime(0.0001, startAt);
    lowGain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.22);
    lowGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 4.05);
    noseGain.gain.setValueAtTime(0.0001, startAt);
    noseGain.gain.exponentialRampToValueAtTime(0.1, startAt + 0.1);
    noseGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 3.4);

    oscillator.connect(filter);
    filter.connect(formant);
    formant.connect(gain);
    gain.connect(this.ctx.destination);
    lowOscillator.connect(lowGain);
    lowGain.connect(this.ctx.destination);
    noseOscillator.connect(nasal);
    nasal.connect(noseGain);
    noseGain.connect(this.ctx.destination);
    oscillator.start(startAt);
    lowOscillator.start(startAt);
    noseOscillator.start(startAt);
    lfo.start(startAt);
    oscillator.stop(startAt + 4.25);
    lowOscillator.stop(startAt + 4.25);
    noseOscillator.stop(startAt + 4.25);
    lfo.stop(startAt + 4.25);
  }
}

export const soundManager = new SoundManager();
