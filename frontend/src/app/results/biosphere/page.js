'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { captureAndShare } from '@/lib/screenshot';
import { buildShareText } from '@/lib/shareText';

// Dynamic import of Three.js EcoWorld scene to bypass Next SSR errors
const EcoWorld = dynamic(() => import('@/components/three/EcoWorld'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ background: '#0f172a' }}>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'rgba(52,168,83,0.15)' }} />
        <div className="absolute inset-0 rounded-full animate-spin" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'transparent', borderTopColor: '#34a853' }} />
      </div>
      <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#34a853' }}>
        Rendering 3D Biosphere...
      </p>
    </div>
  ),
});

// Procedural Web Audio API Soundscape Synthesizer
class BiosphereAudio {
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
    // Pentatonic notes (Hz): C4 E4 G4 A4 C5
    this.pianoNotes = [261.63, 329.63, 392.0, 440.0, 523.25];
    this.pianoNoteIndex = 0;
  }

  init() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // 1. Create a white noise node for wind sounds
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
      this.windGain.gain.value = 0.0; // Muted by default

      this.noiseNode.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.ctx.destination);
      this.noiseNode.start(0);

      // 2. Create factory low-frequency industrial drone
      this.factoryOsc = this.ctx.createOscillator();
      this.factoryOsc.type = 'sawtooth';
      this.factoryOsc.frequency.value = 55; // Low A Hum

      this.factoryFilter = this.ctx.createBiquadFilter();
      this.factoryFilter.type = 'lowpass';
      this.factoryFilter.frequency.value = 110;

      this.factoryGain = this.ctx.createGain();
      this.factoryGain.gain.value = 0.0;

      this.factoryOsc.connect(this.factoryFilter);
      this.factoryFilter.connect(this.factoryGain);
      this.factoryGain.connect(this.ctx.destination);
      this.factoryOsc.start(0);

      // 3. Master gain for global muting
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      // Re-route existing to masterGain
      this.windGain.disconnect();
      this.windGain.connect(this.masterGain);
      this.factoryGain.disconnect();
      this.factoryGain.connect(this.masterGain);

      // 4. Water stream — brown noise (low-pass at 220Hz)
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

    // Set volumes & sound frequencies dynamically based on carbon score
    if (score <= 33) {
      // Gentle wind + birds + piano arpeggios + water stream
      this.windGain.gain.setTargetAtTime(0.06, this.ctx.currentTime, 0.4);
      this.windFilter.frequency.setTargetAtTime(650, this.ctx.currentTime, 0.8);
      this.factoryGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.4);
      if (this.waterGain) this.waterGain.gain.setTargetAtTime(0.04, this.ctx.currentTime, 0.8);
      this.startBirdScheduler(2000, 4500);
      this.startPianoArpeggio(2800, 4500);
      this.stopWarningBleeps();
      this.stopCrickets();
    } else if (score <= 66) {
      // Hazy wind + occasional bird + faint factory
      this.windGain.gain.setTargetAtTime(0.10, this.ctx.currentTime, 0.4);
      this.windFilter.frequency.setTargetAtTime(450, this.ctx.currentTime, 0.8);
      this.factoryGain.gain.setTargetAtTime(0.03, this.ctx.currentTime, 0.4);
      if (this.waterGain) this.waterGain.gain.setTargetAtTime(0.01, this.ctx.currentTime, 0.8);
      this.startBirdScheduler(5500, 9000);
      this.startPianoArpeggio(6000, 9000);
      this.stopWarningBleeps();
      this.stopCrickets();
    } else {
      // Industrial storm + factory drone + cricket eerie ambience + warning bleeps
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
    } catch (e) {}
  }

  startWarningBleeps() {
    if (this.alarmTimer) return;
    
    const bleep = () => {
      if (!this.isPlaying || !this.ctx || this.ctx.state === 'suspended') return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(980, this.ctx.currentTime); // High pitch bleep
        
        gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
      } catch (e) {}
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
    } catch (e) {}
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
      } catch (e) {}
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
    } catch (e) {}
  }
}

export default function BiospherePage() {
  const router = useRouter();
  const [actualScore, setActualScore] = useState(null);
  const [simulatedScore, setSimulatedScore] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const synthRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    
    // Create synthesizer ref on client side
    synthRef.current = new BiosphereAudio();
    
    const saved = localStorage.getItem('ecomirror_results');
    if (!saved) {
      router.push('/chat');
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      const s = parsed.calculation.score;
      setActualScore(s);
      setSimulatedScore(s);
    } catch (e) {
      console.error(e);
      router.push('/chat');
    }

    // Cleanup audio nodes on unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.close();
      }
    };
  }, [router]);

  // Update audio synth when score or mute toggled
  useEffect(() => {
    if (synthRef.current && simulatedScore !== null) {
      synthRef.current.update(simulatedScore, isMuted);
    }
  }, [simulatedScore, isMuted]);

  // Bypasses browser autoplay block on first click/pointerdown gesture
  useEffect(() => {
    const handleUserGesture = () => {
      if (synthRef.current && !synthRef.current.isPlaying && !isMuted) {
        synthRef.current.init();
        synthRef.current.update(simulatedScore, false);
      }
    };

    window.addEventListener('click', handleUserGesture, { once: true });
    window.addEventListener('pointerdown', handleUserGesture, { once: true });
    
    return () => {
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('pointerdown', handleUserGesture);
    };
  }, [isMuted, simulatedScore]);

  const handleToggleSound = () => {
    if (synthRef.current) {
      if (!synthRef.current.isPlaying) {
        synthRef.current.init();
      }
      setIsMuted(prev => !prev);
    }
  };

  const [snapToast, setSnapToast] = useState(null);
  const [shareStatus, setShareStatus] = useState(null);

  const handleCaptureScreenshot = async () => {
    try {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `ecomirror_biosphere_score_${simulatedScore}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      let clipboardOk = false;
      try {
        const blob = await (await fetch(dataUrl)).blob();
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          clipboardOk = true;
        }
      } catch (e) {
        console.error('Clipboard copy failed:', e);
      }

      setSnapToast(clipboardOk ? 'Screenshot downloaded and copied to clipboard!' : 'Screenshot downloaded!');
      setTimeout(() => setSnapToast(null), 3500);
    } catch (e) {
      console.error("Failed to capture screenshot:", e);
      setSnapToast('Could not capture screenshot. Please try again.');
      setTimeout(() => setSnapToast(null), 3500);
    }
  };

  const handleShareWithSnap = async () => {
    setShareStatus('capturing');

    const saved = localStorage.getItem('ecomirror_results');
    let shareText = '';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const calc = parsed.calculation || {};
        const lifestyle = parsed.lifestyle || {};
        const nudges = parsed.context?.nudges || [];
        shareText = buildShareText({
          score: calc.score ?? actualScore,
          totalCo2Kg: calc.total_co2_kg_per_year ?? 0,
          firstNudgeAction: nudges[0]?.action || '',
          breakdown: calc.breakdown,
        });
      } catch (e) {
        console.error('Failed to build share text:', e);
      }
    }

    const result = await captureAndShare(actualScore, shareText);

    if (!result.success) {
      setShareStatus('error');
      setSnapToast('Could not capture screenshot. Please try again.');
      setTimeout(() => { setShareStatus(null); setSnapToast(null); }, 3500);
      return;
    }

    setShareStatus(result.clipboardOk ? 'copied' : 'downloaded');
    setSnapToast(result.clipboardOk
      ? 'Image copied to clipboard! Opening LinkedIn — paste (Ctrl+V) the image into your post.'
      : 'Image downloaded! Opening LinkedIn — please attach it to your post.');
    setTimeout(() => { setShareStatus(null); setSnapToast(null); }, 6000);
  };

  if (!mounted || actualScore === null || simulatedScore === null) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0f172a' }}>
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-3" style={{ borderColor: 'rgba(52,168,83,0.2)', borderWidth: '3px' }} />
          <div className="absolute inset-0 rounded-full animate-spin" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'transparent', borderTopColor: '#34a853' }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: '#34a853' }}>INITIALIZING BIOSPHERE</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>Loading 3D environment...</p>
        </div>
      </div>
    );
  }

  // Determine environmental description and status badge
  let statusText = "";
  let statusColor = "";
  let description = "";

  if (simulatedScore <= 33) {
    statusText = "Vibrant & Lush (Healthy)";
    statusColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    description = "A thriving natural habitat. Clear blue skies, vibrant blooming flowers, and lush green pine/broadleaf trees. Simple low-poly residents enjoy a healthy carbon-neutral world. Factory is completely inactive.";
  } else if (simulatedScore <= 66) {
    statusText = "Fading Ecosystem (Degrading)";
    statusColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
    description = "Environmental decline. The sky turns hazy orange-amber, and the sun dims. Forest vegetation yellows, flowers vanish, and light smoke begins to puff out of active factory chimneys. Only one resident remains.";
  } else {
    statusText = "Ecological Crisis (Severe)";
    statusColor = "text-rose-400 border-rose-500/30 bg-rose-500/10";
    description = "Deforested industrial wasteland. Dark toxic smog chokes out the sun entirely. Living trees disappear, leaving dead trunks and fallen logs. Heavy black smoke pours from factory chimneys. All residents have evacuated.";
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-slate-950">
      {/* Dynamic 3D Scene (Full screen) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <EcoWorld score={simulatedScore} />
      </div>

      {/* Screenshot Toast */}
      {snapToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-lg animate-fade-in-up" style={{ background: 'rgba(30,142,62,0.95)', backdropFilter: 'blur(8px)' }}>
          {snapToast}
        </div>
      )}

      {/* Floating Instructions */}
      <div className="absolute bottom-6 right-6 glass-panel px-4 py-2 rounded-xl border-slate-800 text-xs text-slate-300 pointer-events-none font-mono flex items-center gap-2 z-10 hidden sm:flex">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
        DRAG TO ROTATE · SCROLL TO ZOOM
      </div>

      {/* Mobile rotate hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-panel px-3 py-1.5 rounded-xl text-[10px] text-slate-400 pointer-events-none font-mono z-10 flex sm:hidden items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        DRAG TO ROTATE
      </div>

      {/* Dynamic Floating Panel (Left Side) */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 w-full max-w-[320px] sm:max-w-[360px] md:max-w-[400px] z-10 flex flex-col gap-3">
        {/* Header */}
        <div className="glass-panel p-3.5 rounded-xl border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1e8e3e, #34a853)' }}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
              </svg>
            </div>
            <span className="text-sm font-extrabold text-white">
              Eco<span style={{ color: '#34a853' }}>Mirror</span>
            </span>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Home
          </button>
        </div>

        {/* Biosphere Control Center */}
        <div className="glass-panel p-5 md:p-6 rounded-2xl border-slate-800/80 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">INTERACTIVE SIMULATION</span>
              <h1 className="text-xl font-black text-white">Virtual Biosphere</h1>
            </div>
            
            {/* Audio Toggle Button */}
            <button
              onClick={handleToggleSound}
              className={`p-2.5 rounded-xl border transition-all duration-300 ${
                isMuted 
                  ? 'border-slate-800 text-slate-500 hover:text-slate-300 bg-slate-900/40' 
                  : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
              }`}
              title={isMuted ? "Unmute Environment Sound" : "Mute Environment Sound"}
            >
              {isMuted ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          </div>

          {/* Score details */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Biosphere Carbon Score:</span>
              <span className="font-bold text-white text-sm">{simulatedScore} / 100</span>
            </div>
            
            {/* Status Badge */}
            <div className={`text-center py-1.5 px-3 rounded-lg border text-xs font-bold ${statusColor}`}>
              {statusText}
            </div>

            {/* Description */}
            <p className="text-xs text-slate-400 leading-relaxed min-h-[72px] mt-1 bg-slate-950/30 p-2.5 rounded-lg border border-slate-900/40">
              {description}
            </p>
          </div>

          {/* Simulator Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Healthy (0)</span>
              <span>Crisis (100)</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={simulatedScore}
              onChange={(e) => setSimulatedScore(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
            {simulatedScore !== actualScore && (
              <button
                onClick={() => setSimulatedScore(actualScore)}
                className="mt-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 text-left transition-colors flex items-center gap-1 self-start"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.706 8H18.5" />
                </svg>
                Reset to your actual score ({actualScore})
              </button>
            )}

            {/* Capture 3D Snap Button */}
            <button
              onClick={handleCaptureScreenshot}
              className="mt-2.5 w-full text-center text-xs font-mono py-3.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capture Biosphere Snap 📸
            </button>

            {/* Share to LinkedIn with 3D Snap */}
            <button
              onClick={handleShareWithSnap}
              disabled={shareStatus === 'capturing'}
              className="w-full text-center text-xs font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              style={{
                background: shareStatus === 'error' ? '#7f1d1d' : 'linear-gradient(135deg, #0a66c2, #004182)',
                color: '#fff',
                opacity: shareStatus === 'capturing' ? 0.7 : 1,
                boxShadow: '0 1px 3px rgba(10,102,194,0.35)',
              }}
            >
              <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              {shareStatus === 'capturing' ? 'Capturing & Sharing...' : shareStatus === 'copied' ? 'Copied! Opening LinkedIn...' : shareStatus === 'downloaded' ? 'Downloaded! Opening LinkedIn...' : 'Share to LinkedIn with 3D Snap'}
            </button>
          </div>

          <div className="border-t border-slate-900 pt-4 flex flex-col gap-2">
            <button
              onClick={() => router.push('/results')}
              className="w-full text-center text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 py-3 rounded-xl transition-all duration-300 font-sans shadow-lg shadow-emerald-500/20"
            >
              ← Back to Carbon Dashboard
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
