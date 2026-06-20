// Procedural Web Audio API Soundscape Synthesizer
export default class BiosphereAudio {
  constructor() {
    this.ctx = null;
    this.noiseNode = null;
    this.windFilter = null;
    this.windGain = null;
    this.factoryOsc = null;
    this.factoryFilter = null;
    this.factoryGain = null;
    this.birdTimer = null;
    this.alarmTimer = null;
    this.pianoTimer = null;
    this.cricketTimer = null;
    this.waterGain = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.pianoNotes = [261.63, 329.63, 392.0, 440.0, 523.25];
    this.pianoNoteIndex = 0;
  }

  init() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.value = 450;
      this.windFilter.Q.value = 3.5;

      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0.0;

      this.noiseNode.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.ctx.destination);
      this.noiseNode.start(0);

      this.factoryOsc = this.ctx.createOscillator();
      this.factoryOsc.type = 'sawtooth';
      this.factoryOsc.frequency.value = 55;

      this.factoryFilter = this.ctx.createBiquadFilter();
      this.factoryFilter.type = 'lowpass';
      this.factoryFilter.frequency.value = 110;

      this.factoryGain = this.ctx.createGain();
      this.factoryGain.gain.value = 0.0;

      this.factoryOsc.connect(this.factoryFilter);
      this.factoryFilter.connect(this.factoryGain);
      this.factoryGain.connect(this.ctx.destination);
      this.factoryOsc.start(0);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      this.windGain.disconnect();
      this.windGain.connect(this.masterGain);
      this.factoryGain.disconnect();
      this.factoryGain.connect(this.masterGain);

      const waterBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const waterData = waterBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        waterData[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = waterData[i];
      }
      this.waterNode = this.ctx.createBufferSource();
      this.waterNode.buffer = waterBuffer;
      this.waterNode.loop = true;
      this.waterFilter = this.ctx.createBiquadFilter();
      this.waterFilter.type = 'lowpass';
      this.waterFilter.frequency.value = 220;
      this.waterGain = this.ctx.createGain();
      this.waterGain.gain.value = 0.0;
      this.waterNode.connect(this.waterFilter);
      this.waterFilter.connect(this.waterGain);
      this.waterGain.connect(this.masterGain);
      this.waterNode.start(0);

      this.isPlaying = true;
    } catch (e) {
      console.error('Failed to initialize Web Audio API Synth:', e);
    }
  }

  update(score, isMuted) {
    if (!this.isPlaying || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (isMuted) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
      this.stopBirdScheduler();
      this.stopWarningBleeps();
      this.stopPianoArpeggio();
      this.stopCrickets();
      return;
    }
    this.masterGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.3);

    if (score <= 33) {
      this.windGain.gain.setTargetAtTime(0.06, this.ctx.currentTime, 0.4);
      this.windFilter.frequency.setTargetAtTime(650, this.ctx.currentTime, 0.8);
      this.factoryGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.4);
      if (this.waterGain) this.waterGain.gain.setTargetAtTime(0.04, this.ctx.currentTime, 0.8);
      this.startBirdScheduler(2000, 4500);
      this.startPianoArpeggio(2800, 4500);
      this.stopWarningBleeps();
      this.stopCrickets();
    } else if (score <= 66) {
      this.windGain.gain.setTargetAtTime(0.10, this.ctx.currentTime, 0.4);
      this.windFilter.frequency.setTargetAtTime(450, this.ctx.currentTime, 0.8);
      this.factoryGain.gain.setTargetAtTime(0.03, this.ctx.currentTime, 0.4);
      if (this.waterGain) this.waterGain.gain.setTargetAtTime(0.01, this.ctx.currentTime, 0.8);
      this.startBirdScheduler(5500, 9000);
      this.startPianoArpeggio(6000, 9000);
      this.stopWarningBleeps();
      this.stopCrickets();
    } else {
      this.windGain.gain.setTargetAtTime(0.18, this.ctx.currentTime, 0.4);
      this.windFilter.frequency.setTargetAtTime(280, this.ctx.currentTime, 0.8);
      this.factoryGain.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.4);
      if (this.waterGain) this.waterGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.4);
      this.stopBirdScheduler();
      this.stopPianoArpeggio();
      this.startWarningBleeps();
      this.startCrickets();
    }
  }

  startBirdScheduler(minDelay, maxDelay) {
    this.stopBirdScheduler();

    const scheduleNext = () => {
      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      this.birdTimer = setTimeout(() => {
        this.playBirdChirp();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }

  stopBirdScheduler() {
    if (this.birdTimer) {
      clearTimeout(this.birdTimer);
      this.birdTimer = null;
    }
  }

  playBirdChirp() {
    if (!this.isPlaying || !this.ctx || this.ctx.state === 'suspended') return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1900 + Math.random() * 500, this.ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.012, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) { /* audio node creation failed, ignore */ }
  }

  startWarningBleeps() {
    if (this.alarmTimer) return;

    const bleep = () => {
      if (!this.isPlaying || !this.ctx || this.ctx.state === 'suspended') return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(980, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
      } catch (e) { /* audio node creation failed, ignore */ }
    };

    this.alarmTimer = setInterval(bleep, 2500);
  }

  stopWarningBleeps() {
    if (this.alarmTimer) {
      clearInterval(this.alarmTimer);
      this.alarmTimer = null;
    }
  }

  startPianoArpeggio(minDelay, maxDelay) {
    this.stopPianoArpeggio();
    const scheduleNext = () => {
      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      this.pianoTimer = setTimeout(() => {
        this.playPianoNote();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  stopPianoArpeggio() {
    if (this.pianoTimer) {
      clearTimeout(this.pianoTimer);
      this.pianoTimer = null;
    }
  }

  playPianoNote() {
    if (!this.isPlaying || !this.ctx || this.ctx.state === 'suspended') return;
    try {
      const freq = this.pianoNotes[this.pianoNoteIndex % this.pianoNotes.length];
      this.pianoNoteIndex = (this.pianoNoteIndex + 1) % this.pianoNotes.length;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gainNode.gain.setValueAtTime(0.0, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.016, this.ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);
      osc.connect(gainNode);
      gainNode.connect(this.masterGain);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 1.8);
    } catch (e) { /* audio node creation failed, ignore */ }
  }

  startCrickets() {
    if (this.cricketTimer) return;
    const chirp = () => {
      if (!this.isPlaying || !this.ctx || this.ctx.state === 'suspended') return;
      try {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3200 + Math.random() * 800, this.ctx.currentTime);
        g.gain.setValueAtTime(0.008, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 0.05);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.055);
      } catch (e) { /* audio node creation failed, ignore */ }
    };
    const loop = () => {
      chirp();
      this.cricketTimer = setTimeout(loop, 800 + Math.random() * 700);
    };
    loop();
  }

  stopCrickets() {
    if (this.cricketTimer) {
      clearTimeout(this.cricketTimer);
      this.cricketTimer = null;
    }
  }

  close() {
    try {
      this.stopBirdScheduler();
      this.stopWarningBleeps();
      this.stopPianoArpeggio();
      this.stopCrickets();
      if (this.noiseNode) this.noiseNode.disconnect();
      if (this.waterNode) this.waterNode.disconnect();
      if (this.factoryOsc) this.factoryOsc.disconnect();
      if (this.ctx) this.ctx.close();
    } catch (e) { /* cleanup failed, ignore */ }
  }
}
