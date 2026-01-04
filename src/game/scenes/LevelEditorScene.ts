import Phaser from 'phaser';
import { CONSTS } from '../consts';

export class LevelEditorScene extends Phaser.Scene {
    private marker!: Phaser.GameObjects.Graphics;
    private currentTool: string = 'block';
    private levelData: any[] = [];
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private uiText!: Phaser.GameObjects.Text;
    private spritesGroup!: Phaser.GameObjects.Group;
    private jumpGuide!: Phaser.GameObjects.Graphics;
    private showJumpGuide: boolean = false;

    // Mobile/Touch UI State
    private isPanMode: boolean = false;
    private panStartX: number = 0;
    private panStartY: number = 0;
    private camStartX: number = 0;

    private toolButtons: Phaser.GameObjects.Container[] = [];

    constructor() {
        super('LevelEditorScene');
    }

    create() {
        // Grid background
        this.add.grid(0, 0, 20000, CONSTS.WINDOW_HEIGHT, CONSTS.TILE_SIZE, CONSTS.TILE_SIZE, 0x000000, 1, 0x222222, 1).setOrigin(0);

        this.spritesGroup = this.add.group();

        // Load existing data from Cache (level1.json) or LocalStorage if desired
        // For now, let's load level1.json as base
        const existingData = this.cache.json.get('level1');
        if (existingData && existingData.data) {
            // Deep copy to avoid modifying cache
            this.levelData = JSON.parse(JSON.stringify(existingData.data));
            this.refreshVisuals();
        }

        // Inputs
        this.cursors = this.input.keyboard!.createCursorKeys();

        this.input.keyboard!.on('keydown-ONE', () => { this.currentTool = 'block'; this.updateUI(); });
        this.input.keyboard!.on('keydown-TWO', () => { this.currentTool = 'spike'; this.updateUI(); });
        this.input.keyboard!.on('keydown-THREE', () => { this.currentTool = 'delete'; this.updateUI(); });
        this.input.keyboard!.on('keydown-FOUR', () => { this.currentTool = 'ground_spike'; this.updateUI(); });
        this.input.keyboard!.on('keydown-FIVE', () => { this.currentTool = 'pad_jump'; this.updateUI(); });
        this.input.keyboard!.on('keydown-SIX', () => { this.currentTool = 'portal_ship'; this.updateUI(); });
        this.input.keyboard!.on('keydown-SEVEN', () => { this.currentTool = 'portal_cube'; this.updateUI(); });
        this.input.keyboard!.on('keydown-EIGHT', () => { this.currentTool = 'platform'; this.updateUI(); });

        // Jump Guide
        this.input.keyboard!.on('keydown-J', () => { this.showJumpGuide = !this.showJumpGuide; this.updateUI(); });

        // Save & Download
        this.input.keyboard!.on('keydown-S', () => { this.saveLevel(); });
        // Play
        this.input.keyboard!.on('keydown-P', () => { this.playLevel(); });

        // Mouse
        this.marker = this.add.graphics();
        this.jumpGuide = this.add.graphics();

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.isPanMode) {
                this.panStartX = pointer.x;
                this.panStartY = pointer.y;
                this.camStartX = this.cameras.main.scrollX;
                return;
            }
            // Check if clicking on UI (Top or Bottom bars)
            if (pointer.y < 60 || pointer.y > CONSTS.WINDOW_HEIGHT - 60) return;

            this.placeObject(pointer.worldX, pointer.worldY);
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isPanMode && pointer.isDown) {
                const dx = pointer.x - this.panStartX;
                this.cameras.main.scrollX = this.camStartX - dx;
            }
        });

        // UI
        this.createMobileUI();

        // Initial Floor Line
        this.add.line(0, CONSTS.WINDOW_HEIGHT - 32, 0, 0, 20000, 0, 0x0000ff).setOrigin(0);
    }

    update() {
        // Camera Move
        const speed = 15;
        const cursors = this.cursors;
        const keys = this.input.keyboard!;

        if (cursors.left.isDown || keys.checkDown(keys.addKey('A'), 0)) {
            this.cameras.main.scrollX -= speed;
        } else if (cursors.right.isDown || keys.checkDown(keys.addKey('D'), 0)) {
            this.cameras.main.scrollX += speed;
        }

        // Marker follow mouse
        const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
        const pointerTileX = Math.floor(worldPoint.x / CONSTS.TILE_SIZE);

        // Snap Y to grid relative to floor
        const floorY = CONSTS.WINDOW_HEIGHT - 32;
        const distFromFloor = floorY - worldPoint.y;
        const pointerGridY = Math.max(1, Math.round(distFromFloor / CONSTS.TILE_SIZE));
        const renderY = CONSTS.WINDOW_HEIGHT - 32 - (pointerGridY * CONSTS.TILE_SIZE);

        this.marker.clear();
        if (this.currentTool === 'delete') {
            this.marker.lineStyle(2, 0xff0000, 1);
        } else {
            this.marker.lineStyle(2, 0x00ff00, 1);
        }

        // Draw rect at grid pos
        this.marker.strokeRect(pointerTileX * CONSTS.TILE_SIZE, renderY, CONSTS.TILE_SIZE, CONSTS.TILE_SIZE);

        // Jump Guide
        this.jumpGuide.clear();
        if (this.showJumpGuide) {
            this.drawJumpGuide(worldPoint.x, worldPoint.y);
        }
    }

    private drawJumpGuide(startX: number, startY: number) {
        this.jumpGuide.lineStyle(2, 0x00FFFF, 0.8);
        this.jumpGuide.beginPath();
        this.jumpGuide.moveTo(startX, startY);

        let simX = 0;
        let simY = 0;
        let velX = CONSTS.PLAYER_SPEED;
        let velY = CONSTS.JUMP_STRENGTH;
        const dt = 1 / 60;

        // Player Hitbox Size (from Player.ts)
        const hboxW = 44;
        const hboxH = 44;
        // Assuming guide starts at "Feet" (Bottom Center), offset Y for Top-Left of Rect
        // If sim point is Bottom-Center:
        // Rect X = simX - W/2
        // Rect Y = simY - H

        // Simulate
        for (let i = 0; i < 90; i++) {
            // Phaser Arcade Physics Step: Velocity THEN Position (Symplectic Euler)
            velY += CONSTS.GRAVITY * dt;

            simX += velX * dt;
            simY += velY * dt;

            const currX = startX + simX;
            const currY = startY + simY;

            this.jumpGuide.lineTo(currX, currY);

            // Draw Hitbox outline every 10 frames to visualize clearance
            if (i % 10 === 0) {
                this.jumpGuide.lineStyle(1, 0xFFFFFF, 0.3);
                this.jumpGuide.strokeRect(currX - hboxW / 2, currY - hboxH, hboxW, hboxH);
                this.jumpGuide.lineStyle(2, 0x00FFFF, 0.8); // Restore
                this.jumpGuide.moveTo(currX, currY);
            }

            // If hits floor (relative to startY isn't quite right, needs absolute floor)
            if (currY > CONSTS.WINDOW_HEIGHT - 32) {
                break;
            }
        }
        this.jumpGuide.strokePath();
    }

    private refreshVisuals() {
        this.spritesGroup.clear(true, true);
        this.levelData.forEach(obj => {
            this.createObjSprite(obj);
        });
    }

    private createObjSprite(obj: any) {
        const renderY = CONSTS.WINDOW_HEIGHT - 32 - (obj.y * CONSTS.TILE_SIZE);
        const x = obj.x * CONSTS.TILE_SIZE;

        let texture = 'ground';
        let xOff = 0;
        let yOff = 0;
        let origin = 0;

        // Visual alignment to match game logic
        if (obj.type === 'block') {
            texture = 'ground';
            origin = 0; // Top-Left
        }
        else if (obj.type === 'spike') {
            texture = 'spike';
            xOff = 32;
            yOff = 32;
            origin = 0.5;
        }
        else if (obj.type === 'ground_spike') {
            texture = 'ground_spike';
            xOff = 32;
            yOff = 48; // Lower center
            origin = 0.5;
        }
        else if (obj.type === 'pad_jump') {
            texture = 'pad_jump';
            xOff = 32;
            yOff = 48;
            origin = 0.5;
        }
        else if (obj.type === 'portal_ship') {
            texture = 'portal_ship';
            xOff = 32;
            yOff = 16;
            origin = 0.5;
        }
        else if (obj.type === 'portal_cube') {
            texture = 'portal_cube';
            xOff = 32;
            yOff = 16;
            origin = 0.5;
        }
        else if (obj.type === 'platform') {
            texture = 'platform';
            origin = 0.5;
            // Platform height is 16. Center it?
            // Logic in LevelManager uses y.
            // If texture is 64x16.
        }

        const sprite = this.add.sprite(x + xOff, renderY + yOff, texture).setOrigin(origin);
        this.spritesGroup.add(sprite);
    }

    private placeObject(worldX: number, worldY: number) {
        const gridX = Math.floor(worldX / CONSTS.TILE_SIZE);
        const floorY = CONSTS.WINDOW_HEIGHT - 32;
        const distFromFloor = floorY - worldY;
        const gridY = Math.round(distFromFloor / CONSTS.TILE_SIZE);

        if (gridY < 1) return; // Don't place below floor

        // Remove existing at this slot
        const existingIdx = this.levelData.findIndex(d => d.x === gridX && d.y === gridY);
        if (existingIdx !== -1) {
            this.levelData.splice(existingIdx, 1);
        }

        if (this.currentTool !== 'delete') {
            const obj = { x: gridX, y: gridY, type: this.currentTool, id: Date.now() };
            this.levelData.push(obj);
        }

        this.refreshVisuals();
    }

    private saveLevel() {
        // Format
        const levelObj = {
            name: "Custom Level",
            length: 300,
            background: "bg_grad",
            music: "stereo_madness",
            data: this.levelData.sort((a, b) => a.x - b.x)
        };
        const json = JSON.stringify(levelObj, null, 2);

        console.log("--- COPIED TO CONSOLE ---");
        console.log(json);

        // Save to LocalStorage for PlayScene (Concept)
        localStorage.setItem('editor_level', json);

        // Save to Server
        fetch('/api/save-level', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: 'level1.json',
                data: levelObj
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Success! Level saved to disk via Server.");
                } else {
                    alert("Error saving: " + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Failed to save to server. Is it running?");
            });
    }

    private playLevel() {
        // We need a way to pass data to PlayScene. 
        // Simplest: Registry or Global
        this.registry.set('custom_level_data', {
            name: "Editor Test",
            length: 300,
            background: "bg_grad",
            music: "stereo_madness",
            data: this.levelData
        });

        // Quick Play: Start from current camera X
        const startX = this.cameras.main.scrollX;

        this.scene.start('PlayScene', { fromEditor: true, startX: startX });
        this.scene.stop('LevelEditorScene');
    }

    // --- Mobile UI Construction ---

    private createMobileUI() {
        // 1. Top Bar (Actions)
        const topBarY = 30;

        // Save
        this.createUIButton(40, topBarY, '保存', 0x00AA00, () => this.saveLevel());
        // Play
        this.createUIButton(120, topBarY, '试玩', 0x00AA00, () => this.playLevel());
        // Guide
        this.createUIButton(200, topBarY, '辅助', 0x008888, () => {
            this.showJumpGuide = !this.showJumpGuide;
        });
        // Pan Toggle
        this.createUIButton(280, topBarY, '平移', 0xFF5500, () => {
            this.isPanMode = !this.isPanMode;
            this.uiText.setText(this.isPanMode ? "模式: 平移" : "模式: 编辑");
        });

        // Status Text
        this.uiText = this.add.text(350, 15, '工具: 方块', {
            fontSize: '16px', color: '#fff'
        }).setScrollFactor(0).setDepth(100);

        // 2. Bottom Bar (Tools)
        const bottomY = CONSTS.WINDOW_HEIGHT - 30;
        // Map types to Chinese map
        const toolMap: { [key: string]: string } = {
            'block': '方块',
            'spike': '尖刺',
            'delete': '删除',
            'ground_spike': '地刺',
            'pad_jump': '跳板',
            'portal_ship': '飞船',
            'portal_cube': '立方',
            'platform': '平台'
        };
        const tools = Object.keys(toolMap);
        const colors = [0x555555, 0xAA0000, 0xFF0000, 0x880000, 0xAA00AA, 0x00AAAA, 0x00AA00, 0x00FF00];

        const spacing = 70;
        let startX = 40;

        tools.forEach((tool, idx) => {
            const btn = this.createToolButton(startX + (idx * spacing), bottomY, tool, toolMap[tool], colors[idx] || 0x555555);
            this.toolButtons.push(btn);
        });
    }

    private createUIButton(x: number, y: number, text: string, color: number, onClick: () => void) {
        const btn = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 70, 40, color).setStrokeStyle(2, 0xffffff);
        const lbl = this.add.text(0, 0, text, { fontSize: '12px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        btn.add([bg, lbl]);
        btn.setScrollFactor(0).setDepth(100);

        bg.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { onClick(); });
    }

    private createToolButton(x: number, y: number, tool: string, labelText: string, color: number) {
        const btn = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 60, 50, color).setStrokeStyle(2, 0xffffff);

        const lbl = this.add.text(0, 0, labelText, { fontSize: '12px', color: '#fff' }).setOrigin(0.5);
        btn.add([bg, lbl]);
        btn.setScrollFactor(0).setDepth(100);

        // Store tool name for highlight logic
        btn.setData('tool', tool);

        bg.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.currentTool = tool;
                this.updateUI();
            });

        return btn;
    }

    private updateUI() {
        const toolMap: { [key: string]: string } = {
            'block': '方块', 'spike': '尖刺', 'delete': '删除', 'ground_spike': '地刺',
            'pad_jump': '跳板', 'portal_ship': '飞船', 'portal_cube': '立方', 'platform': '平台'
        };
        const currentName = toolMap[this.currentTool] || this.currentTool;

        if (this.uiText) {
            this.uiText.setText(`工具: ${currentName} | 辅助: ${this.showJumpGuide ? '开' : '关'}`);
        }
        // Highlight active tool
        this.toolButtons.forEach(btn => {
            const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
            if (btn.getData('tool') === this.currentTool) {
                bg.setStrokeStyle(4, 0xFFFF00);
            } else {
                bg.setStrokeStyle(2, 0xFFFFFF);
            }
        });
    }
}
