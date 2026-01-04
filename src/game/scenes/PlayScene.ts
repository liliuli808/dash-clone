import Phaser from 'phaser';
import { CONSTS } from '../consts';
import { Player } from '../objects/Player';
import { ParticleManager } from '../managers/ParticleManager';
import { LevelManager } from '../managers/LevelManager';
import { AudioManager } from '../managers/AudioManager';

export class PlayScene extends Phaser.Scene {
    private player!: Player;
    private particleManager!: ParticleManager;
    private levelManager!: LevelManager;
    private audioManager!: AudioManager;
    private bg!: Phaser.GameObjects.TileSprite;

    // Progress
    private levelLength: number = 100; // Tiles
    private currentLevelKey: string = 'level1';

    // Debug
    private isDebug: boolean = false;
    private debugText!: Phaser.GameObjects.Text;

    // Start Pos
    private startX: number = 200;
    private fromEditor: boolean = false; // Track if from editor

    constructor() {
        super('PlayScene');
    }

    init(data: any) {
        if (data && data.levelKey) {
            this.currentLevelKey = data.levelKey;
        }
        if (data && data.fromEditor) {
            this.fromEditor = true;
        } else {
            this.fromEditor = false;
        }

        if (data && data.debug) {
            this.isDebug = true;
        }
        if (data && data.startX) {
            this.startX = Math.max(200, data.startX + 200);
        } else {
            this.startX = 200;
        }
    }

    create() {
        // --- Managers ---
        this.particleManager = new ParticleManager(this);
        this.audioManager = new AudioManager(this);
        this.levelManager = new LevelManager(this);

        // --- Background ---
        this.bg = this.add.tileSprite(0, 0, CONSTS.WINDOW_WIDTH, CONSTS.WINDOW_HEIGHT, 'bg_grad')
            .setOrigin(0, 0)
            .setScrollFactor(0); // Fixed to camera, we scroll texture manually

        // Load Level
        if (this.fromEditor) {
            const customData = this.registry.get('custom_level_data');
            if (customData) {
                this.levelManager.setLevelData(customData);
            } else {
                console.warn('From Editor but no custom data! Loading default.');
                this.levelManager.loadLevel(this.currentLevelKey);
            }
        } else {
            this.levelManager.loadLevel(this.currentLevelKey);
        }

        this.levelLength = this.levelManager.getLevelLength();

        // Player
        this.player = new Player(this, this.startX, CONSTS.WINDOW_HEIGHT - 200);

        // Trail
        this.particleManager.startTrail(this.player);

        // Audio BGM
        this.audioManager.startBGM();

        // Collisions
        this.physics.add.collider(this.player, this.levelManager.getFloors(), undefined, undefined, this);
        this.physics.add.overlap(this.player, this.levelManager.getSpikes(), this.handleSpikeCollision, undefined, this);
        this.physics.add.overlap(this.player, this.levelManager.getPads(), this.handlePadCollision, undefined, this);
        this.physics.add.overlap(this.player, this.levelManager.getPortals(), this.handlePortalCollision, undefined, this);

        // Camera
        this.cameras.main.startFollow(this.player, true, 1, 0, -200, 0);

        // Listen for death
        this.events.on('player-dead', this.handlePlayerDeath, this);

        // Editor Switch
        this.input.keyboard!.on('keydown-E', () => {
            this.scene.start('LevelEditorScene');
            this.scene.stop('UIScene');
            this.scene.stop('PlayScene');
        });

        // Debug Toggle (Key 0)
        this.input.keyboard!.on('keydown-ZERO', () => {
            this.toggleDebug();
        });

        // Debug Text
        this.debugText = this.add.text(10, 50, '调试模式', {
            fontSize: '24px', color: '#ff0000', fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(100).setVisible(this.isDebug);

        if (this.isDebug) {
            this.toggleDebug(true); // Force enable visual
        }

        // Pointer Input (Touch Optimization)
        this.input.on('pointerdown', () => {
            if (this.player.body?.touching.down) {
                this.player.setVelocityY(CONSTS.JUMP_STRENGTH);
                this.audioManager.playJump();
            }
        });
    }

    private toggleDebug(forceState?: boolean) {
        if (forceState !== undefined) this.isDebug = forceState;
        else this.isDebug = !this.isDebug;

        this.debugText.setVisible(this.isDebug);

        if (this.isDebug) {
            this.physics.world.createDebugGraphic();
            this.physics.world.drawDebug = true;
        } else {
            this.physics.world.debugGraphic.clear();
            this.physics.world.drawDebug = false;
        }
    }

    update() {
        this.player.update();
        this.bg.tilePositionX = this.cameras.main.scrollX * 0.5;
        this.bg.tilePositionY = this.cameras.main.scrollY * 0.5;

        // Stereo Madness Background Style
        // Deep Blue <-> Purple Shift
        const time = this.time.now / 4000;
        const hue = 0.65 + Math.sin(time) * 0.1; // 0.55 to 0.75 range (Blue to Purple)
        const color = Phaser.Display.Color.HSLToColor(hue, 0.6, 0.5);
        this.bg.setTint(color.color);

        // Update UI
        const currentTile = Math.floor(this.player.x / CONSTS.TILE_SIZE);
        const progress = Math.min(Math.max(currentTile / this.levelLength, 0), 1);
        this.events.emit('update-progress', progress);

        // Check if falls off world
        if (this.player.y > CONSTS.WINDOW_HEIGHT + 100) {
            if (this.isDebug) {
                // Respawn without restart
                this.player.setY(CONSTS.WINDOW_HEIGHT - 200);
                this.player.setVelocityY(0);
            } else {
                this.player.die();
            }
        }

        // Keyboard Jump SFX Helper
        const cursors = this.input.keyboard!.createCursorKeys();
        if ((Phaser.Input.Keyboard.JustDown(cursors.space) || Phaser.Input.Keyboard.JustDown(cursors.up)) && this.player.body?.touching.down) {
            this.audioManager.playJump();
        }
    }

    private handleSpikeCollision(playerGO: any, _spikeGO: any) {
        // God Mode Check
        const scene = (playerGO as Player).scene as PlayScene;
        if (scene.isDebug) return;

        (playerGO as Player).die();
    }

    private handlePadCollision(playerGO: any, _padGO: any) {
        const player = playerGO as Player;
        // Super Jump
        player.setVelocityY(CONSTS.JUMP_STRENGTH * 1.5);
        this.audioManager.playJump(); // Maybe different sound later?
    }

    private handlePortalCollision(playerGO: any, portalGO: any) {
        const player = playerGO as Player;
        const type = portalGO.getData('portalType');

        if (type === 'ship') {
            player.setMode('ship');
        } else if (type === 'cube') {
            player.setMode('cube'); // Back to normal
        }
    }

    private handlePlayerDeath() {
        this.audioManager.playExplode();
        this.particleManager.explode(this.player.x, this.player.y);
        this.particleManager.stopTrail();
        this.cameras.main.shake(200, 0.05);
        this.time.delayedCall(1000, () => {
            if (this.scene.isActive()) {
                this.scene.restart();
            }
        });
    }
}
