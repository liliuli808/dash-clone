import Phaser from 'phaser';
import { CONSTS } from './game/consts';
import { Preloader } from './game/scenes/Preloader';
import { PlayScene } from './game/scenes/PlayScene';
import { UIScene } from './game/scenes/UIScene';
import { LevelSelectScene } from './game/scenes/LevelSelectScene';
import { LevelEditorScene } from './game/scenes/LevelEditorScene';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CONSTS.WINDOW_WIDTH,
  height: CONSTS.WINDOW_HEIGHT,
  backgroundColor: '#1a1a1a',
  parent: 'app',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [Preloader, LevelSelectScene, PlayScene, UIScene, LevelEditorScene]
};

new Phaser.Game(config);
