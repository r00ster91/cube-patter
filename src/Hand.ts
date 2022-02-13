import { Color, Group, Mesh, MeshStandardMaterial, NormalBlending, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { Cube } from "./Cube";
import { Object, Time } from "./Object";

export class Hand implements Object {
    readonly mesh: Mesh;
    private pointer: Vector2;
    private raycaster: Raycaster;
    private outlinePass: OutlinePass;

    constructor(object: Group, scene: Scene, camera: PerspectiveCamera, composer: EffectComposer) {
        const material = new MeshStandardMaterial({ emissive: "white", emissiveIntensity: 0.5 });
        this.mesh = new Mesh((object.children as Mesh[])[0].geometry, material);

        this.pointer = new Vector2();
        document.addEventListener("mousemove", event => {
            // Normalize the coordinates
            this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        this.raycaster = new Raycaster();

        this.outlinePass = new OutlinePass(new Vector2(window.innerWidth, window.innerHeight), scene, camera);
        this.outlinePass.visibleEdgeColor = new Color("black");
        this.outlinePass.hiddenEdgeColor = new Color("black");
        this.outlinePass.overlayMaterial.blending = NormalBlending; // Without this, the outline is not visible
        this.outlinePass.edgeStrength = 1000;
        this.outlinePass.selectedObjects.push(this.mesh);
        composer.addPass(this.outlinePass);
    }

    resize() {
        this.outlinePass.setSize(window.innerWidth, window.innerHeight);
    }

    update(_: Time, renderer: WebGLRenderer, camera: PerspectiveCamera, cubes: Cube[]) {
        this.raycaster.setFromCamera(this.pointer, camera);

        const intersections = this.raycaster.intersectObjects(cubes.map(cube => cube.mesh));

        if (intersections.length > 0) {
            renderer.domElement.style.cursor = "none";
            this.mesh.visible = true;

            const intersection = intersections[0];

            // Set the hand's rotation such that it faces the hovered face
            this.mesh.position.set(0, 0, 0); // Place the hand flatly onto the face
            this.mesh.lookAt(intersection.face!.normal);

            this.mesh.position.set(
                intersection.point.x,
                intersection.point.y,
                intersection.point.z,
            );
        } else {
            renderer.domElement.style.cursor = "auto";
            this.mesh.visible = false;
        }
    }
}
