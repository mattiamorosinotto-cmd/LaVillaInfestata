// Audio procedurale con Web Audio: ambiente per stanza, effetti e riverbero. Nessun file audio.

/** Profili d'ambiente per stanza; LANDING vale per la schermata iniziale e il finale. */
const PROFILES = [
  { freq: 42, wind: 360, rain: 1200, drone: 0.045 },
  { freq: 49, wind: 250, rain: 850, drone: 0.04 },
  { freq: 36.7, wind: 180, rain: 600, drone: 0.065 },
];
const LANDING = { freq: 38, wind: 520, rain: 1800, drone: 0.02 };

/**
 * @param deps.prefs        preferenze condivise (volume)
 * @param deps.notify       mostra un messaggio all'utente
 * @param deps.isLive       true quando il giocatore è in una stanza e il tempo scorre
 * @param deps.isQuiet      true durante transizioni, pausa, tempo scaduto e finale
 * @param deps.ambientRoom  stanza da usare se l'audio parte ora (-1 = esterno)
 * @param deps.onToggle     chiamata dopo ogni attivazione o disattivazione
 * @param deps.texts        messaggi di errore
 */
export function createAudioWorld({ prefs, notify, isLive, isQuiet, ambientRoom, onToggle, texts }) {
  const AudioWorld = {
    ctx: null,
    master: null,
    direct: null,
    wet: null,
    bus: null,
    sources: [],
    enabled: false,
    room: -1,
    next: 0,
    impulse: null,
    async init() {
      if (this.ctx) {
        await this.ctx.resume();
        return;
      }
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) {
        notify(texts.audioUnavailable);
        return;
      }
      this.ctx = new C();
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = 0;
      this.master.connect(c.destination);
      this.direct = c.createGain();
      this.direct.gain.value = 0.8;
      this.direct.connect(this.master);
      this.wet = c.createGain();
      this.wet.gain.value = 0.3;
      this.wet.connect(this.master);
      this.impulse = c.createConvolver();
      const len = Math.floor(c.sampleRate * 3.8),
        b = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
      this.impulse.buffer = b;
      this.impulse.connect(this.wet);
      await c.resume();
    },
    async setEnabled(v) {
      try {
        await this.init();
        if (!this.ctx) return;
        this.enabled = v;
        this.master.gain.setTargetAtTime(v ? prefs.volume : 0, this.ctx.currentTime, 0.7);
        if (v && !this.bus) this.change(ambientRoom());
        onToggle(v);
      } catch (e) {
        notify(texts.audioBlocked);
      }
    },
    /** Regola il volume generale senza scatti. */
    setVolume(volume) {
      if (this.master) this.master.gain.setTargetAtTime(this.enabled ? volume : 0, this.ctx.currentTime, 0.4);
    },
    connect(node, pan = 0, amount = 0.3) {
      const c = this.ctx,
        g = c.createGain();
      g.gain.value = amount;
      const p = c.createStereoPanner();
      p.pan.value = pan;
      node.connect(g);
      g.connect(p);
      p.connect(this.direct);
      p.connect(this.impulse);
      return g;
    },
    noise(seconds) {
      const c = this.ctx,
        b = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate),
        d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    },
    /** Cambia l'ambiente sonoro con una dissolvenza (room = -1 per l'esterno). */
    change(room) {
      this.room = room;
      this.next = performance.now() + 6000;
      if (!this.ctx) return;
      const c = this.ctx,
        t = c.currentTime;
      if (this.bus) {
        this.bus.gain.setTargetAtTime(0, t, 1.3);
        const old = this.sources.slice(),
          oldBus = this.bus;
        setTimeout(() => {
          old.forEach((n) => {
            try {
              n.stop();
              n.disconnect();
            } catch (e) {}
          });
          oldBus.disconnect();
        }, 6000);
      }
      this.sources = [];
      this.bus = c.createGain();
      this.bus.gain.value = 0;
      this.bus.connect(this.direct);
      this.bus.connect(this.impulse);
      this.bus.gain.setTargetAtTime(1, t, 1.8);
      const p = room < 0 ? LANDING : PROFILES[room];
      for (let ch = 0; ch < 2; ch++) {
        const n = c.createBufferSource(),
          f = c.createBiquadFilter(),
          g = c.createGain(),
          pan = c.createStereoPanner();
        n.buffer = this.noise(7.31 + ch * 0.87);
        n.loop = true;
        f.type = 'lowpass';
        f.frequency.value = p.wind;
        g.gain.value = room < 0 ? 0.2 : 0.12;
        pan.pan.value = ch ? 0.75 : -0.75;
        n.connect(f).connect(g).connect(pan).connect(this.bus);
        n.start();
        this.sources.push(n);
        const l = c.createOscillator(),
          lg = c.createGain();
        l.frequency.value = 0.055 + ch * 0.018;
        lg.gain.value = 0.035;
        l.connect(lg).connect(g.gain);
        l.start();
        this.sources.push(l);
      }
      const rain = c.createBufferSource(),
        rf = c.createBiquadFilter(),
        rg = c.createGain();
      rain.buffer = this.noise(5.91);
      rain.loop = true;
      rf.type = 'highpass';
      rf.frequency.value = p.rain;
      rg.gain.value = room < 0 ? 0.027 : 0.009;
      rain.connect(rf).connect(rg).connect(this.bus);
      rain.start();
      this.sources.push(rain);
      [p.freq, p.freq * 1.501, p.freq * 2.004, room === 1 ? 196 : 146.83, room === 2 ? 221.4 : 220].forEach((hz, i) => {
        const o = c.createOscillator(),
          g = c.createGain(),
          pan = c.createStereoPanner();
        o.type = 'sine';
        o.frequency.value = hz;
        g.gain.value = i < 3 ? p.drone / (i + 1) : 0.007;
        pan.pan.value = Math.max(-0.8, Math.min(0.8, (i - 2) * 0.4));
        o.connect(g).connect(pan).connect(this.bus);
        o.start();
        this.sources.push(o);
        const l = c.createOscillator(),
          lg = c.createGain();
        l.frequency.value = 0.018 + i * 0.011;
        lg.gain.value = 0.75;
        l.connect(lg).connect(o.frequency);
        l.start();
        this.sources.push(l);
      });
    },
    tone(hz, duration, pan = 0, level = 0.03, type = 'sine', delay = 0) {
      if (!this.ctx || !this.enabled) return;
      const c = this.ctx,
        t = c.currentTime + delay,
        o = c.createOscillator(),
        g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(hz, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, hz * 0.78), t + duration);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(level, t + Math.min(0.12, duration * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      o.connect(g);
      this.connect(g, pan, 1);
      o.start(t);
      o.stop(t + duration + 0.1);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
      };
    },
    texture(kind, pan = 0) {
      if (!this.ctx || !this.enabled) return;
      const c = this.ctx,
        t = c.currentTime,
        duration = kind === 'door' ? 3.8 : kind === 'paper' ? 1.25 : kind === 'step' ? 0.9 : 2.8,
        n = c.createBufferSource(),
        f = c.createBiquadFilter(),
        g = c.createGain();
      n.buffer = this.noise(duration);
      f.type = 'bandpass';
      f.frequency.setValueAtTime(kind === 'paper' ? 1800 : kind === 'step' ? 140 : 330, t);
      f.frequency.exponentialRampToValueAtTime(kind === 'paper' ? 700 : 80, t + duration);
      f.Q.value = kind === 'paper' ? 0.7 : 3;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(kind === 'door' ? 0.12 : kind === 'paper' ? 0.025 : 0.05, t + 0.16);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      n.connect(f).connect(g);
      this.connect(g, pan, 1);
      n.start();
      n.stop(t + duration);
      n.onended = () => {
        n.disconnect();
        f.disconnect();
        g.disconnect();
      };
    },
    /** Effetti: step, paper, door, success, wrong, talk, light, tick. */
    sfx(kind) {
      if (kind === 'step') {
        this.texture('step', -0.25);
        setTimeout(() => {
          if (isLive()) this.texture('step', 0.3);
        }, 360);
        return;
      }
      if (kind === 'paper') {
        this.texture('paper', -0.2);
        return;
      }
      if (kind === 'door') {
        this.texture('door', 0.15);
        this.tone(58, 3, -0.4, 0.05);
        this.tone(87, 2, 0.3, 0.02, 'sine', 0.3);
        return;
      }
      if (kind === 'success') {
        [196, 246.94, 293.66].forEach((f, i) => this.tone(f, 2, (i - 1) * 0.35, 0.025, 'sine', i * 0.2));
        return;
      }
      if (kind === 'wrong') {
        this.tone(67, 1, 0, 0.035);
        return;
      }
      if (kind === 'talk') {
        this.texture('creak', -0.5);
        return;
      }
      if (kind === 'light') {
        this.tone(290, 0.35, 0.2, 0.018);
        return;
      }
      if (kind === 'tick') {
        this.tone(780, 0.055, -0.3, 0.008);
        this.tone(520, 0.08, 0.3, 0.006, 'sine', 0.48);
        return;
      }
      this.tone(220, 0.5, 0, 0.015);
    },
    /** Suoni sparsi dell'ambiente, a intervalli irregolari. */
    update() {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running' || isQuiet() || document.hidden) return;
      const now = performance.now();
      if (now < this.next) return;
      this.next = now + 8000 + Math.random() * 9000;
      if (this.room === 0) {
        this.sfx('tick');
        if (Math.random() < 0.45) this.texture('creak', Math.random() * 1.6 - 0.8);
      } else if (this.room === 1) {
        this.texture(Math.random() < 0.55 ? 'paper' : 'creak', Math.random() * 1.6 - 0.8);
      } else if (this.room === 2) {
        this.tone(72, 5, -0.6, 0.035);
        this.tone(108.2, 5, 0.6, 0.022, 'sine', 1);
      } else {
        this.texture('creak', -0.8);
        this.tone(34, 6, 0.6, 0.025);
      }
    },
    /** Avvia i cicli dell'ambiente: suoni sparsi e ticchettio dell'atrio. */
    start() {
      setInterval(() => this.update(), 700);
      setInterval(() => {
        if (this.enabled && this.room === 0 && isLive() && !document.hidden) this.sfx('tick');
      }, 1500);
    },
  };
  return AudioWorld;
}
