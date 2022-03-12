import { Euler } from "three";
import { degToRad } from "three/src/math/MathUtils";
import { Floor } from "../Floor";
import { getRandomNumber, getRandomSign } from "../helpers";
import { Time } from "../Time";
import * as Cube from "./Cube";

export class Idle {
    private direction?: Euler;
    private newDirectionTimer: number;

    constructor(private cube: Cube.Cube) {
        this.newDirectionTimer = -1;
    }

    faceNewDirection(floor: Floor) {
        this.direction = this.cube.object.rotation.clone();
        this.direction.y += getRandomSign() * degToRad(getRandomNumber(30, 90));

        this.newDirectionTimer = getRandomNumber(floor.size * 0.15, floor.size * 0.5);
    }

    faceOppositeDirection(floor: Floor) {
        this.newDirectionTimer = getRandomNumber(floor.size * 0.15, floor.size * 0.75);
    }

    update(time: Time, floor: Floor, otherCubes: Cube.Cube[]) {
        // Move into the direction
        this.cube.object.translateZ(5 * time.delta);

        this.cube.wobble(time, 5, 5);

        this.newDirectionTimer -= 10 * time.delta;
        if (this.newDirectionTimer < 0) {
            this.faceNewDirection(floor);
        } else {
            const intersectingCube = this.cube.intersectsWith(otherCubes);
            if (intersectingCube) {
                this.faceOppositeDirection(floor);
            }
        }

        if (this.direction) {
            if (this.cube.object.rotation.y > this.direction.y) {
                this.cube.object.rotation.y -= 2.5 * time.delta;
                if (this.cube.object.rotation.y < this.direction.y) {
                    this.cube.object.rotation.copy(this.direction);
                }
            } else if (this.cube.object.rotation.y < this.direction.y) {
                this.cube.object.rotation.y += 2.5 * time.delta;
                if (this.cube.object.rotation.y > this.direction.y) {
                    this.cube.object.rotation.copy(this.direction);
                }
            }
        }
    }
}
