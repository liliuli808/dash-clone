import Phaser from 'phaser';
import { CONSTS } from '../consts';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private isFlying: boolean = false;
    private isDead: boolean = false;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player_sq');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.initPhysics();
        this.cursors = scene.input.keyboard!.createCursorKeys();
    }

    private initPhysics() {
        this.setGravityY(CONSTS.GRAVITY);
        this.setCollideWorldBounds(false); // Enable world bounds if we want death on fall
        this.setVelocityX(CONSTS.PLAYER_SPEED);
        // Slightly smaller hitbox to be forgiving
        this.body?.setSize(44, 44);
    }

    public setMode(mode: 'cube' | 'ship') {
        if (mode === 'ship') {
            this.isFlying = true;
            this.setGravityY(CONSTS.GRAVITY * 0.5); // Lower gravity for ship
            this.setTexture('player_sq'); // Could change texture here
            // Reset rotation logic or set specific visual
        } else {
            this.isFlying = false;
            this.setGravityY(CONSTS.GRAVITY);
            this.angle = 0; // Reset angle
        }
    }

    update() {
        if (this.isDead) return;

        // Constant forward speed
        this.setVelocityX(CONSTS.PLAYER_SPEED);
        const onFloor = this.body?.touching.down;

        // Input State
        // We need to check scene input for touch as well, but for now specific to keys
        // We will assume PlayScene passes an "isHoldingJump" state via a method or property if we want full touch support here,
        // but for now let's check keys directly.
        const isHoldingJump = this.cursors.space.isDown || this.cursors.up.isDown || this.scene.input.activePointer.isDown;

        if (this.isFlying) {
            // SHIP PHYSICS
            if (isHoldingJump) {
                // Fly Up
                this.setVelocityY(-300); // Constant upward force (or acceleration?)
                // Acceleration feels better: this.setAccelerationY(-1000) ? 
                // Simple version: override velocity
            } else {
                // Fall naturally (Gravity handles it, maybe cap speed?)
            }

            // Screen Bounds clamping (Optional but good)
            if (this.y < 0) { this.setY(0); this.setVelocityY(0); }

            // Rotation: Point towards velocity
            const velAngle = Math.atan2(this.body!.velocity.y, this.body!.velocity.x) * (180 / Math.PI);
            this.angle = velAngle * 0.5; // Dampen it a bit
        }
        else {
            // CUBE PHYSICS
            // Jump
            if (isHoldingJump && onFloor) {
                // Only jump if JUST pressed? Or hold? Cube is "Just Pressed".
                // In Update loop, isDown is true every frame. We need "JustDown" logic or check onFloor.
                // If we are on floor, we can jump.
                this.setVelocityY(CONSTS.JUMP_STRENGTH);
                // Note: If holding, it will bunny hop. That's fine for now, or use JustDown check in Scene.
                // Actually, standard GD allows holding to auto-jump on landing.
            }

            // Rotation Logic
            if (onFloor) {
                // Snap to nearest 90 degrees
                const nearest90 = Math.round(this.angle / 90) * 90;
                this.angle = Phaser.Math.Linear(this.angle, nearest90, 0.2);
            } else {
                // Rotate continuously in air
                this.angle += 380 * (1 / 60); // Approx 380 deg per second
            }
        }
    }

    public die() {
        if (this.isDead) return;
        this.isDead = true;
        this.setVisible(false); // Hide sprite to simulate explosion
        this.setVelocity(0, 0);
        this.setGravityY(0);
        // Dispatch event or callback for level reset
        this.scene.events.emit('player-dead');
    }
}
