import { BoxBufferGeometry, BufferAttribute, InterleavedBufferAttribute, Material, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene } from "three";
import { OBB } from "three/examples/jsm/math/OBB";
import { Floor } from "../Floor";
import { Time } from "../Time";
import * as State from "./State";
import { Label } from "./Label";

export type CubeMesh = Mesh<BoxBufferGeometry, Material>;

export abstract class Cube {
    readonly object: Mesh;
    private readonly originalPositionAttribute: InterleavedBufferAttribute | BufferAttribute;
    protected readonly state: State.Idle;
    protected readonly label: Label;
    abstract update(time: Time, floor: Floor, otherCubes: Cube[], camera: PerspectiveCamera): void;

    constructor(name: string, readonly size: number, sideSegments: number, material: Material, cssScene: Scene) {
        const geometry = new BoxBufferGeometry(size, size, size, 1, sideSegments);
        this.object = new Mesh(geometry, material);
        this.object.castShadow = true;
        this.object.receiveShadow = true;
        this.originalPositionAttribute = this.object.geometry.attributes.position.clone();
        this.state = new State.Idle(this);
        this.label = new Label(name, cssScene);
    }

    /**
     * Sets the wobbliness of the cube's sides.
     */
    setWobbliness(wobbliness: number) {
        const positionAttribute = this.originalPositionAttribute.clone();
        for (let index = 0; index < positionAttribute.count; index += 1) {
            let x = positionAttribute.getX(index);
            x += positionAttribute.getY(index) ** 2 * wobbliness;
            positionAttribute.setX(index, x);
        }
        positionAttribute.needsUpdate = true;

        this.object.geometry.attributes.position = positionAttribute;
    }

    wobble(time: Time, speed: number, range: number) {
        this.setWobbliness(Math.cos(time.elapsed * speed) * range / 100);
    }

    /**
     * Returns if there was an intersection between this cube and any of the given cubes.
     *
     * For collision detection there are a few ways:
     * 1. Cast rays from the cube's origin to all vertices in its geometry.
     *    If any of those rays while on their way hit another cube, that's a collision.
     *    => Very accurate (segments incorporated), very slow.
     * 2. Same as above but with the vertices of the additional segments omitted.
     *    => Accurate, slow.
     * 3. Using `Box3`s and `intersectsBox`.
     *    => Inaccurate (rotation ignored), very fast.
     * 4. Using `OBB`s and `intersectsOBB`.
     *    => Accurate, fast.
     *
     * Of these, 4. is the most preferable.
     */
    intersectsWith(cubes: this[]) {
        const obb = new OBB();
        const halfSize = this.size / 2;
        obb.halfSize.set(halfSize, halfSize, halfSize);
        obb.applyMatrix4(this.object.matrixWorld);
        return cubes.some(cube => {
            const otherObb = new OBB();
            const halfSize = this.size / 2;
            otherObb.halfSize.set(halfSize, halfSize, halfSize);
            otherObb.applyMatrix4(cube.object.matrixWorld);
            return obb.intersectsOBB(otherObb);
        });
    }
}

export class Regular extends Cube {
    constructor(name: string, cssScene: Scene) {
        super(name, 10, 15, new MeshStandardMaterial(), cssScene);
    }

    update(time: Time, floor: Floor, otherCubes: Cube[]) {
        if (!this.object.userData.grabbed)
            this.state.update(time, floor, otherCubes);
        this.label.update(this.object.position);
    }
}
