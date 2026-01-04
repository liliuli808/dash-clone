import Phaser from 'phaser';

export class AudioManager {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    playJump() {
        this.synthTone(400, 'square', 0.1);
    }

    playExplode() {
        this.synthNoise(0.5);
    }

    startBGM() {
        if (!this.scene.sound) return;

        // Stop any existing music to prevent overlap on restart
        this.scene.sound.stopAll();

        // Check if external music is loaded
        if (this.scene.cache.audio.exists('stereo_madness')) {
            this.scene.sound.play('stereo_madness', {
                loop: true,
                volume: 0.5
            });
        } else {
            // Fallback to Synth
            // Simple 4/4 beat
            this.scene.time.addEvent({
                delay: 500, // 120 BPM
                loop: true,
                callback: () => {
                    this.synthTone(150, 'sawtooth', 0.1); // Bass
                    this.scene.time.delayedCall(250, () => {
                        this.synthNoise(0.05); // Hi-hat
                    });
                }
            });
        }
    }

    private synthTone(freq: number, type: OscillatorType, duration: number) {
        if (!this.scene.sound || !(this.scene.sound as any).context) return;
        const ctx = (this.scene.sound as any).context as AudioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq / 2, ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    private synthNoise(duration: number) {
        if (!this.scene.sound || !(this.scene.sound as any).context) return;
        const ctx = (this.scene.sound as any).context as AudioContext;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
    }
}
