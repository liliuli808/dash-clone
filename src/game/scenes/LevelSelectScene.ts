import Phaser from 'phaser';
import { CONSTS } from '../consts';

export class LevelSelectScene extends Phaser.Scene {
    private bg!: Phaser.GameObjects.TileSprite;
    private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor() {
        super('LevelSelectScene');
    }

    create() {
        // --- Animated Background ---
        this.bg = this.add.tileSprite(0, 0, CONSTS.WINDOW_WIDTH, CONSTS.WINDOW_HEIGHT, 'bg_grad')
            .setOrigin(0, 0)
            .setTint(0x220055); // Deep Purple start

        // --- Particles ---
        // Simple ambient floating particles
        this.particles = this.add.particles(0, 0, 'particle', {
            x: { min: 0, max: CONSTS.WINDOW_WIDTH },
            y: { min: CONSTS.WINDOW_HEIGHT, max: CONSTS.WINDOW_HEIGHT + 50 },
            lifespan: 4000,
            speedY: { min: -50, max: -100 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            frequency: 100,
            tint: 0xffffff,
            blendMode: 'ADD'
        });

        // --- Title with Bounce ---
        const title = this.add.text(CONSTS.WINDOW_WIDTH / 2, 100, '几何冲刺\n(Web Clone)', {
            fontSize: '48px',
            color: '#fff',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- Buttons ---
        this.createCoolButton(CONSTS.WINDOW_WIDTH / 2, 280, '第一关: 立体狂乱', 0x00AAFF, () => {
            this.scene.start('PlayScene', { levelKey: 'level1' });
        });

        this.createCoolButton(CONSTS.WINDOW_WIDTH / 2, 380, '关卡编辑器', 0xFFAA00, () => {
            this.scene.start('LevelEditorScene');
        });

        // --- Instructions ---
        this.add.text(CONSTS.WINDOW_WIDTH / 2, 520, '操作:\n空格 / 点击屏幕跳跃\n编辑器: 1-8 选择工具, S 保存', {
            fontSize: '18px', color: '#ccc', align: 'center', fontStyle: 'italic'
        }).setOrigin(0.5);
    }

    update() {
        // Scroll BG
        this.bg.tilePositionX += 0.5;
        this.bg.tilePositionY += 0.5;

        // Color Shift
        const time = this.time.now / 3000;
        const hue = 0.7 + Math.sin(time) * 0.1; // Purple/Blue range
        const color = Phaser.Display.Color.HSLToColor(hue, 0.6, 0.4);
        this.bg.setTint(color.color);
    }

    private createCoolButton(x: number, y: number, text: string, baseColor: number, onClick: () => void) {
        const container = this.add.container(x, y);

        // Glow
        const glow = this.add.rectangle(0, 0, 420, 70, baseColor, 0.3)
            .setBlendMode(Phaser.BlendModes.ADD);

        // Main Box
        const bg = this.add.rectangle(0, 0, 400, 60, 0x111111)
            .setStrokeStyle(3, baseColor);

        // Gradient approx (using graphics) - or just simple fill for now
        // Let's stick to simple but clean

        const label = this.add.text(0, 0, text, {
            fontSize: '24px',
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([glow, bg, label]);

        // Interactive
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setFillStyle(0x333333);
                glow.setScale(1.1);
            })
            .on('pointerout', () => {
                bg.setFillStyle(0x111111);
                glow.setScale(1);
            })
            .on('pointerdown', () => {
                bg.setFillStyle(baseColor);
                label.setColor('#000');
            })
            .on('pointerup', () => {
                label.setColor('#fff');
                bg.setFillStyle(0x333333);
                onClick();
            });

        return container;
    }
}
