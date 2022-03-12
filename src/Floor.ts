import { ArrowHelper, Color, DoubleSide, Mesh, MeshStandardMaterial, Plane, PlaneBufferGeometry, Ray, Scene, Vector3 } from "three";
import { OBB } from "three/examples/jsm/math/OBB";
import { degToRad } from "three/src/math/MathUtils";
import * as Cube from "./cubes/Cube";

export class Floor {
    readonly size = 75;

    object: Mesh<PlaneBufferGeometry, MeshStandardMaterial>;
    /**
     * Used to make sure no objects leave the floor.
     */
    boundaries: Ray[];
    /**
     * This is a plane that extends infinitely in space and is used for tracing the mouse pointer everywhere.
     */
    plane: Plane;

    constructor(scene: Scene) {
        const geometry = new PlaneBufferGeometry(this.size, this.size);
        geometry.rotateX(degToRad(-90));
        const material = new MeshStandardMaterial({ transparent: true, opacity: 0.5, side: DoubleSide });
        this.object = new Mesh(geometry, material);
        this.object.receiveShadow = true;
        this.object.position.y = -5.01; // A small amount added to prevent z-fighting
        material.depthWrite = false;

        this.boundaries = [
            new Ray(new Vector3(this.size / 2, 0, -this.size / 2), new Vector3(0, 0, 1)),
            new Ray(new Vector3(-this.size / 2, 0, this.size / 2), new Vector3(0, 0, -1)),
            new Ray(new Vector3(-this.size / 2, 0, this.size / 2), new Vector3(1, 0, 0)),
            new Ray(new Vector3(this.size / 2, 0, -this.size / 2), new Vector3(-1, 0, 0)),
        ];

        this.visualizeBoundaries(scene);

        this.plane = new Plane(new Vector3(0, 1, 0), 0);
    }

    visualizeBoundaries(scene: Scene) {
        this.boundaries.forEach(boundary => {
            const arrowHelper = new ArrowHelper(boundary.direction, boundary.origin, this.size);
            scene.add(arrowHelper);
        });
    }

    setTimelyColor(brightness: number) {
        this.object.material.color = new Color(`hsl(0,0%,${Math.floor(brightness * 100)}%)`);
    }

    crossedBy(cube: Cube.CubeMesh): Ray | undefined {
        const obb = new OBB();
        const halfSize = cube.geometry.parameters.width / 2;
        obb.halfSize.set(halfSize, halfSize, halfSize);
        obb.applyMatrix4(cube.matrixWorld);
        return this.boundaries.find(boundary => obb.intersectsRay(boundary));
    }
}
