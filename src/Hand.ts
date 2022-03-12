import { BufferGeometry, Color, Group, Intersection, Mesh, MeshStandardMaterial, NormalBlending, Object3D, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import * as Cube from "./cubes/Cube";
import { Floor } from "./Floor";
import { normalizeInRange } from "./helpers";
import { Time } from "./Time";

export class Hand {
    readonly object: Mesh<BufferGeometry, MeshStandardMaterial>;
    private raycaster: Raycaster;
    private intersections: Intersection[];
    private grabbedCube?: Cube.CubeMesh;
    private previousPoint?: Vector3;
    private mouseMovement?: boolean;
    private distanceAccumulator: number;
    private scene: Scene;
    private hearts: Mesh<BufferGeometry, MeshStandardMaterial>[];

    constructor(model: { normal: Group, grab: Group; }, scene: Scene, camera: PerspectiveCamera, composer: EffectComposer, floor: Floor, cubes: Cube.CubeMesh[], heartGeometry: BufferGeometry) {
        const material = new MeshStandardMaterial({ emissive: "white", emissiveIntensity: 0.25 });
        const normalGeometry = (model.normal.children as Mesh[])[0].geometry;
        const grabbingGeometry = (model.grab.children as Mesh[])[0].geometry;
        this.object = new Mesh(normalGeometry, material);
        this.object.visible = false;
        this.raycaster = new Raycaster();
        this.intersections = [];
        this.distanceAccumulator = 0;
        this.scene = scene;
        this.hearts = [];

        document.addEventListener("mousedown", event => {
            // Find objects to grab
            if (event.button === 0) {
                this.intersections.length = 0;
                this.raycaster.intersectObjects(cubes, false, this.intersections);
                if (this.intersections.length > 0) {
                    const intersection = this.intersections[0];
                    this.grabbedCube = intersection.object as Cube.CubeMesh;
                    intersection.object.userData.grabbed = true;
                    this.object.geometry = grabbingGeometry;
                    this.object.material.depthTest = false; // Make the grabbed hand always visible
                }
            }
        });

        const pointerPosition = new Vector2();
        document.addEventListener("mousemove", event => {
            this.mouseMovement = true;

            // Normalize the coordinates
            pointerPosition.x = normalizeInRange(event.clientX, window.innerWidth);
            pointerPosition.y = normalizeInRange(event.clientY, window.innerHeight) * -1;

            this.raycaster.setFromCamera(pointerPosition, camera);

            if (this.grabbedCube) {
                this.dragCube(floor, this.grabbedCube, camera);
            } else {
                this.intersections.length = 0;
                this.raycaster.intersectObjects(cubes, false, this.intersections);
                if (this.intersections.length > 0) {
                    const intersection = this.intersections[0];

                    if (this.previousPoint) {
                        const love = (this.previousPoint.distanceTo(intersection.point) - this.distanceAccumulator);
                        if (love > 1) {
                            const heartMaterial = new MeshStandardMaterial({ color: "red" });
                            heartMaterial.transparent = true;
                            const newHeart = new Mesh(heartGeometry, heartMaterial);
                            const scale = Math.min(0.75, love / 4);
                            newHeart.scale.set(scale, scale, scale);
                            newHeart.position.copy(intersection.point);

                            this.placeOnto(newHeart, intersection);

                            const normal = intersection.face!.normal;
                            if (normal.x === 0 && normal.y === 1 && normal.z === 0) {
                                newHeart.rotation.x = 0;
                                newHeart.rotation.y = 0;
                            }

                            this.hearts.push(newHeart);
                            scene.add(newHeart);
                        }
                        if (this.distanceAccumulator) {
                            this.distanceAccumulator = 0;
                        }
                    }

                    this.previousPoint = intersection.point.clone();
                }
            }
        });

        document.addEventListener("mouseup", () => {
            if (this.grabbedCube) {
                this.grabbedCube.position.setY(0);
                this.grabbedCube.userData.grabbed = false;
                this.grabbedCube = undefined;
            }
            this.object.geometry = normalGeometry;
            this.object.material.depthTest = true;
        });

        const outlinePass = new OutlinePass(new Vector2(window.innerWidth, window.innerHeight), scene, camera);
        outlinePass.visibleEdgeColor = new Color("black");
        outlinePass.hiddenEdgeColor = new Color("black");
        outlinePass.overlayMaterial.blending = NormalBlending; // Without this, the outline is not visible
        outlinePass.edgeStrength = 1000;
        outlinePass.selectedObjects.push(this.object);
        composer.addPass(outlinePass);
    }

    /**
     * Sticks the object to the object of the intersection.
     * I.e. it places the object into the object of the intersection's object.
     * It sets the object's rotation and position such that it looks at the intersected face.
     */
    placeOnto(object: Object3D, intersection: Intersection) {
        // Set the object's position
        object.position.copy(intersection.point);

        // Set the object's rotation such that it looks at the intersected face
        const vector = intersection.face!.normal.clone();
        vector.transformDirection(intersection.object.matrixWorld);
        vector.add(intersection.point);
        object.lookAt(vector);
    }

    /**
     * Sets the position of the hand on the cubes if possible.
     */
    setPosition(cubes: Mesh[]) {
        this.intersections.length = 0;
        this.raycaster.intersectObjects(cubes, false, this.intersections);
        if (this.intersections.length > 0) {
            document.body.style.cursor = "none";

            const intersection = this.intersections[0];
            this.placeOnto(this.object, intersection);

            this.object.visible = true;
        } else {
            document.body.style.cursor = "";
            this.object.visible = false;
        }
    }

    /**
     * Drags the given object around.
     */
    dragCube(floor: Floor, cube: Cube.CubeMesh, camera: PerspectiveCamera) {
        this.intersections.length = 0;
        this.raycaster.intersectObject(floor.object, false, this.intersections);
        if (this.intersections.length > 0) {
            const intersection = this.intersections[0];

            // Drag the object
            cube.position.setX(intersection.point.x);
            cube.position.setZ(intersection.point.z);
            cube.position.setY(1);

            // Place the hand in the center of the cube
            this.object.position.copy(intersection.point);
            this.object.position.y += cube.geometry.parameters.width / 2 + 1;
            this.object.lookAt(camera.position);
        } else {
            // Smoothly translate the cube if it is dragged outside the boundaries
            const point = new Vector3();
            if (this.raycaster.ray.intersectPlane(floor.plane, point)) {
                const boundary = floor.crossedBy(cube);
                if (boundary?.direction.x) {
                    cube.position.x = point.x;
                    this.object.position.x = point.x;
                    this.object.lookAt(camera.position);
                } else if (boundary?.direction.z) {
                    cube.position.z = point.z;
                    this.object.position.z = point.z;
                    this.object.lookAt(camera.position);
                }
            }
        }
    }

    update(time: Time, cubes: Cube.CubeMesh[]) {
        if (this.raycaster.camera && // Otherwise the hand could sometimes shortly be visible before the first mouse input
            !this.grabbedCube) {
            this.setPosition(cubes);
        }

        if (!this.mouseMovement && this.previousPoint) {
            this.distanceAccumulator = this.previousPoint.distanceTo(this.object.position);
        }
        this.mouseMovement = false;

        const toDelete: number[] = [];
        for (const [index, heart] of this.hearts.entries()) {
            if (heart) {
                heart.position.y += 10 * time.delta;
                heart.material.opacity -= time.delta;
                if (heart.material.opacity < 0) {
                    this.scene.remove(heart);
                    toDelete.push(index);
                }
            }
        }
        this.hearts = this.hearts.filter((_, index) => !toDelete.includes(index));
    }
}
