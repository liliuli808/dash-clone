import Phaser from 'phaser';
import { CONSTS } from '../consts';

interface LevelData {
    name: string;
    length: number; // In percentage or tile units? Tile units usually.
    data: LevelObject[];
}

interface LevelObject {
    x: number; // Grid X
    y: number; // Grid Y (0 = floor, 1 = 1st block up)
    type: string;
}

export class LevelManager {
    private scene: Phaser.Scene;
    private floors: Phaser.Physics.Arcade.StaticGroup;
    private spikes: Phaser.Physics.Arcade.StaticGroup;
    private pads: Phaser.Physics.Arcade.StaticGroup;
    private portals: Phaser.Physics.Arcade.StaticGroup;
    private levelData: LevelData | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.floors = scene.physics.add.staticGroup();
        this.spikes = scene.physics.add.staticGroup();
        this.pads = scene.physics.add.staticGroup();
        this.portals = scene.physics.add.staticGroup();
    }
    // ...

    // ...

    private spawnObject(gridX: number, gridY: number, type: string) {
        const x = gridX * CONSTS.TILE_SIZE;
        let y = CONSTS.WINDOW_HEIGHT - 32 - (gridY * CONSTS.TILE_SIZE);

        if (type === 'ground' || type === 'block') {
            this.floors.create(x, y, 'ground');
        } else if (type === 'spike') {
            this.spikes.create(x, y, 'spike').setOrigin(0.5, 0.5).refreshBody();
        } else if (type === 'ground_spike') {
            const gSpike = this.spikes.create(x, y + 16, 'ground_spike');
            gSpike.setOrigin(0.5, 0.5);
            gSpike.body.setSize(40, 20);
            gSpike.body.setOffset(12, 12);
        } else if (type === 'pad_jump') {
            const pad = this.pads.create(x, y + 16, 'pad_jump');
            pad.setOrigin(0.5, 0.5);
            pad.body.setSize(40, 20);
            pad.body.setOffset(12, 44);
        } else if (type === 'portal_ship') {
            const portal = this.portals.create(x, y - 16, 'portal_ship');
            portal.setOrigin(0.5, 0.5);
            portal.setData('portalType', 'ship');
        } else if (type === 'portal_cube') {
            const portal = this.portals.create(x, y - 16, 'portal_cube');
            portal.setOrigin(0.5, 0.5);
            portal.setData('portalType', 'cube');
        } else if (type === 'platform') {
            // Platforms are floors but thinner/higher?
            // "Green ground board" logic.
            // If it acts as a floor, we add it to floors group?
            // Yes, so player can run on it.
            // Adjust Y. Texture is 64x16.
            // If gridY=1, y = floor - 32. Center is y+8?
            // Let's place it aligned with top of grid cell or center?
            // Standard blocks are 64x64. This is 64x16.
            // Let's align it to top of the grid cell for "platform" feel?
            // Or just center. "Green ground board" implies just a block.
            // Let's spawn it.
            const plat = this.floors.create(x, y, 'platform');
            // Default floor physics is full square 64x64?
            // No, floors group uses texture size by default?
            // Let's ensure body matches visual.
            plat.setOrigin(0.5, 0.5);
            plat.body.setSize(64, 16);
            plat.body.setOffset(0, 0); // Re-center if needed
        }
    }

    public getFloors() { return this.floors; }
    public getSpikes() { return this.spikes; }
    public getPads() { return this.pads; }
    public getPortals() { return this.portals; }

    public loadLevel(key: string) {
        this.levelData = this.scene.cache.json.get(key);
        if (this.levelData) {
            this.spawnInitial();
        }
    }

    public setLevelData(data: any) {
        this.levelData = data;
        if (this.levelData) {
            this.spawnInitial();
        }
    }

    private spawnInitial() {
        if (!this.levelData) return;

        // Base Floor
        for (let i = 0; i < 300; i++) {
            this.spawnObject(i, 0, 'ground');
        }

        this.levelData.data.forEach(obj => {
            this.spawnObject(obj.x, obj.y, obj.type);
        });
    }

    public getLevelLength() {
        return this.levelData?.length || 100;
    }
}
