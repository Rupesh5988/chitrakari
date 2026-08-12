class AudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = true;

  constructor() {
    // We defer creation until a user interaction to satisfy browser auto-play policies
  }

  private getCtx() {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playTick() {
    const ctx = this.getCtx();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  public playCorrect() {
    const ctx = this.getCtx();
    if (!ctx) return;

    const playTone = (freq: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.5);
    };

    playTone(523.25, 0);    // C5
    playTone(659.25, 0.1);  // E5
    playTone(783.99, 0.2);  // G5
  }

  public playTurnStart() {
    const ctx = this.getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  public playFanfare() {
    const ctx = this.getCtx();
    if (!ctx) return;

    const playTone = (freq: number, delay: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    playTone(523.25, 0, 0.2);    
    playTone(523.25, 0.2, 0.2);  
    playTone(523.25, 0.4, 0.2);  
    playTone(783.99, 0.6, 0.6);  
  }

  public speak(text: string) {
    if (this.isMuted) return;
    if (!('speechSynthesis' in window)) return;
    
    // Cancel ongoing speech to avoid backlog
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster for game pacing
    utterance.pitch = 1.0;
    
    // Try to find a natural sounding English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en-') && (v.name.includes('Google') || v.name.includes('Natural')));
    if (preferredVoice) {
       utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}

export const audioEngine = new AudioEngine();
