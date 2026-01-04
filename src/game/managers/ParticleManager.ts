import Phaser from 'phaser';

export class ParticleManager {
    // private scene: Phaser.Scene;
    private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private deathEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene) {
        // this.scene = scene;

        // Trail - Updated for Phaser 3.60+ syntax
        this.trailEmitter = scene.add.particles(0, 0, 'particle', {
            speed: { min: -50, max: -100 }, // Move left opposite to player
            angle: { min: 180, max: 180 },
            scale: { start: 0.5, end: 0 },
            lifespan: 300,
            frequency: 50,
            quantity: 1,
            tint: 0xFFEB3B, // Match player color
            blendMode: 'ADD'
        });
        this.trailEmitter.stop();

        // Death Explosion
        this.deathEmitter = scene.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            gravityY: 500,
            quantity: 30,
            tint: [0xFF0000, 0xFF7D00],
            emitting: false
        });
    }

    startTrail(target: Phaser.GameObjects.Sprite) {
        this.trailEmitter.start();
        this.trailEmitter.startFollow(target);
    }

    stopTrail() {
        this.trailEmitter.stop();
    }

    explode(x: number, y: number) {
        this.deathEmitter.explode(30, x, y);
    }
}
