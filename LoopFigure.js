class SyncClock {
  constructor() {
    this.ctx = new AudioContext();
    this.startTime = this.ctx.currentTime; // läuft ab jetzt durch
  }
  get masterOffset() {
    return this.ctx.currentTime - this.startTime;
  }
}

class LoopFigure extends Figure {
  constructor(audioFile, start, end, index, clock) {
    super(index);
    this.audioFile = audioFile;
    this.loopLength = 0;
    this.buffer = null; // nach fetch/decodeAudioData
    this.source = null;
    this.clock = clock;
    this.is_playing = false;
  }
  initPlayer() {}
  play(forceSeek = false, bounce = true) {
    if (bounce) {
      this.img.classList.add("played");
    }
    if (!this.buffer) return;
    this.loopLength = this.buffer.duration;
    const phase = this.clock.masterOffset % this.loopLength;
    if (this.is_playing == false) {
      const gain = this.clock.ctx.createGain();

      this.is_playing = true;
      gain.gain.setValueAtTime(0, this.clock.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, this.clock.ctx.currentTime + 0.08); // 80ms rein
      gain.connect(this.clock.ctx.destination);
      if (!this.source) {
        this.source = this.clock.ctx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.loop = true;
        this.source.loopEnd = this.loopLength;
        this.source.connect(gain);
        this.source.start(this.clock.ctx.currentTime, phase);
      }
      this.gainNode = gain;
      this.callback_play();
      this.button.textContent = "Pause";
    } else {
      this.button.textContent = "Play";
      this.is_playing = false;
      this.pause();
    }
  }
  stopTimer() {}

  extractVideoID() {}

  pause() {
    if (!this.source) return;
    const g = this.gainNode.gain;
    g.setValueAtTime(g.value, this.clock.ctx.currentTime);
    g.linearRampToValueAtTime(0, this.clock.ctx.currentTime + 0.08); // 80ms raus
    this.source.stop(this.clock.ctx.currentTime + 0.09);
    this.source = null;
    this.gainNode = null;
    super.reset_border();
  }
}
