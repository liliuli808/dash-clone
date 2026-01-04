import Phaser from 'phaser';
import { CONSTS } from '../consts';

export class UIScene extends Phaser.Scene {
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressText!: Phaser.GameObjects.Text;
    // private playerRef: any;

    constructor() {
        super('UIScene');
    }

    create() {
        // Bar Info
        const barWidth = 400;
        const x = (CONSTS.WINDOW_WIDTH - barWidth) / 2;
        const y = 50;

        this.progressBar = this.add.graphics();
        this.progressText = this.add.text(x + barWidth + 10, y, '0%', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });

        // Listen for progress updates
        const playScene = this.scene.get('PlayScene');
        playScene.events.on('update-progress', this.updateProgress, this);

        // Edit Button (Top Right)
        const editBtn = this.add.text(CONSTS.WINDOW_WIDTH - 60, 20, '编辑', {
            fontSize: '20px', backgroundColor: '#333', padding: { x: 5, y: 5 }
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.start('LevelEditorScene');
                this.scene.stop('PlayScene');
                this.scene.stop('UIScene');
            });
    }

    private updateProgress(percent: number) {
        const barWidth = 400;
        const barHeight = 20;
        const x = (CONSTS.WINDOW_WIDTH - barWidth) / 2;
        const y = 50;

        this.progressBar.clear();

        // Background
        this.progressBar.fillStyle(0x000000, 0.5);
        this.progressBar.fillRect(x, y, barWidth, barHeight);

        // Fill
        this.progressBar.fillStyle(0x00ff00, 1);
        this.progressBar.fillRect(x, y, barWidth * percent, barHeight);

        this.progressText.setText(`${Math.floor(percent * 100)}%`);
    }
}
