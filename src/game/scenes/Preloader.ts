import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        this.load.json('level1', 'levels/level1.json');

        // Music (User-provided)
        this.load.audio('stereo_madness', 'assets/music/stereo_madness.mp3');

        // --- Player ---
        const playerSize = 48; // Visual size (increased from 32)
        const graphics = this.make.graphics({ x: 0, y: 0 });

        // Base
        graphics.fillStyle(0xFFEB3B, 1); // Yellow
        graphics.fillRect(0, 0, playerSize, playerSize);
        // Border
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(1, 1, playerSize - 2, playerSize - 2);
        // Face (simple)
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(10, 12, 8, 8); // Left Eye (scaled)
        graphics.fillRect(30, 12, 8, 8); // Right Eye (scaled)
        graphics.fillRect(10, 30, 28, 6); // Mouth (scaled)
        graphics.generateTexture('player_sq', playerSize, playerSize);

        // --- Ground ---
        graphics.clear();
        graphics.fillStyle(0x0D47A1, 1); // Dark Blue
        graphics.fillRect(0, 0, 64, 64);
        // Top highlight
        graphics.fillStyle(0x2196F3, 1); // Lighter Blue
        graphics.fillRect(0, 0, 64, 4);
        // Grid line
        graphics.lineStyle(2, 0x1565C0, 0.5);
        graphics.strokeRect(0, 0, 64, 64);
        graphics.generateTexture('ground', 64, 64);

        // --- Spike ---
        graphics.clear();
        graphics.fillStyle(0x000000, 1);
        graphics.beginPath();
        graphics.moveTo(0, 64);
        graphics.lineTo(32, 0);
        graphics.lineTo(64, 64);
        graphics.closePath();
        graphics.fillPath();
        // Inner Red
        graphics.fillStyle(0xD50000, 1);
        graphics.beginPath();
        graphics.moveTo(4, 60);
        graphics.lineTo(32, 6);
        graphics.lineTo(60, 60);
        graphics.closePath();
        graphics.fillPath();
        graphics.fillPath();
        graphics.generateTexture('spike', 64, 64);

        // --- Ground Spike (Small) ---
        graphics.clear();
        graphics.fillStyle(0x000000, 1);
        graphics.beginPath();
        graphics.moveTo(0, 32);
        graphics.lineTo(16, 0);
        graphics.lineTo(32, 32);
        graphics.moveTo(32, 32);
        graphics.lineTo(48, 0);
        graphics.lineTo(64, 32);
        graphics.closePath();
        graphics.fillPath();
        // Inner Red
        graphics.fillStyle(0xD50000, 1);
        graphics.beginPath();
        graphics.moveTo(2, 30);
        graphics.lineTo(16, 2);
        graphics.lineTo(30, 30);
        graphics.moveTo(34, 30);
        graphics.lineTo(48, 2);
        graphics.lineTo(62, 30);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('ground_spike', 64, 32);

        // --- Jump Pad (Yellow) ---
        graphics.clear();
        // Base plate
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 50, 64, 14);
        // Pad glow
        graphics.fillStyle(0xFFEA00, 1); // Yellow
        graphics.fillRect(4, 52, 56, 10);
        // Highlight
        graphics.fillStyle(0xFFFFFF, 0.8);
        graphics.fillRect(4, 52, 56, 4);

        graphics.generateTexture('pad_jump', 64, 64);

        // --- Portals ---
        // Ship Portal (Pink)
        graphics.clear();
        graphics.lineStyle(4, 0xFF66AA, 1); // Pink Frame
        graphics.strokeRect(0, 0, 32, 96);
        graphics.fillStyle(0xFF66AA, 0.5); // Inner
        graphics.fillRect(4, 4, 24, 88);
        graphics.generateTexture('portal_ship', 32, 96);

        // Cube Portal (Green)
        graphics.clear();
        graphics.lineStyle(4, 0x00FF00, 1); // Green Frame
        graphics.strokeRect(0, 0, 32, 96);
        graphics.fillStyle(0x00FF00, 0.5);
        graphics.fillRect(4, 4, 24, 88);
        graphics.generateTexture('portal_cube', 32, 96);



        // --- Platform (Green) ---
        graphics.clear();
        graphics.fillStyle(0x00C853, 1); // Green
        graphics.fillRect(0, 0, 64, 16); // Thin platform
        // Highlight
        graphics.fillStyle(0x69F0AE, 1);
        graphics.fillRect(0, 0, 64, 4);
        graphics.generateTexture('platform', 64, 16);

        // --- Background ---
        const bgSize = 512;
        const canvas = document.createElement('canvas');
        canvas.width = bgSize;
        canvas.height = bgSize;
        const ctx = canvas.getContext('2d')!;

        // Background Base Color (Dark)
        ctx.fillStyle = '#C0C0C0'; // Base Gray for tinting
        ctx.fillRect(0, 0, bgSize, bgSize);

        // Recursive Square Pattern
        // Draw large squares with smaller squares inside
        const drawSquare = (x: number, y: number, size: number) => {
            // Outline
            ctx.lineWidth = size * 0.05;
            ctx.strokeStyle = '#FFFFFF';
            ctx.strokeRect(x, y, size, size);

            // Maybe a smaller one inside
            if (size > 64) {
                drawSquare(x + size * 0.25, y + size * 0.25, size * 0.5);
            }
        };

        // Grid of squares
        const sqSize = 128; // Large squares
        for (let x = 0; x < bgSize; x += sqSize) {
            for (let y = 0; y < bgSize; y += sqSize) {
                // Randomly decide to draw a complex square or just a simple one
                if ((x + y) % (sqSize * 2) === 0) {
                    drawSquare(x + 10, y + 10, sqSize - 20);
                } else {
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#E0E0E0';
                    ctx.strokeRect(x + 5, y + 5, sqSize - 10, sqSize - 10);
                    // Center small square
                    ctx.strokeRect(x + sqSize / 2 - 10, y + sqSize / 2 - 10, 20, 20);
                }
            }
        }

        this.textures.addCanvas('bg_grad', canvas);

        // --- Particle Texture (Square) ---
        graphics.clear();
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillRect(0, 0, 8, 8);
        graphics.generateTexture('particle', 8, 8);
    }

    create() {
        this.scene.start('LevelSelectScene');
    }
}
