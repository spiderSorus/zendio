import { BaseGraphic } from './BaseGraphic';
import { getLoopSin, getLoopCos } from '../utils/Loop';
import { LOOP_DURATION } from '../core/Constants';

export class CircleGraphic extends BaseGraphic {
    create(config) {
        const { x = 0, y = 0, radius = 50, color = 0xffffff, alpha = 1 } = config;
        this.basePos = { x, y };
        return this.scene.add.circle(x, y, radius, color, alpha);
    }

    onUpdate(time, delta) {
        if (this.gameObject) {
            const sin = getLoopSin(time, LOOP_DURATION);
            const cos = getLoopCos(time, LOOP_DURATION);
            
            this.gameObject.x = this.basePos.x + cos * 20;
            this.gameObject.y = this.basePos.y + sin * 20;
        }
    }
}
