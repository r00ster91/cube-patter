import { Clock, DirectionalLight, MOUSE, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { Cube } from "./Cube";
import { Hand } from "./Hand";
import { Scenes } from "./load";

function createCamera() {
    const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 20;
    const light = new DirectionalLight("white", 2);
    camera.add(light);

    return camera;
}

function createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.physicallyCorrectLights = true;
    document.body.append(renderer.domElement);

    return renderer;
}

function createOrbitControls(camera: PerspectiveCamera, renderer: WebGLRenderer) {
    const orbitControls = new OrbitControls(camera, renderer.domElement);

    // Switch left and right mouse button and then disable the left one
    orbitControls.mouseButtons = { ...orbitControls.mouseButtons, LEFT: MOUSE.RIGHT, RIGHT: MOUSE.LEFT };
    orbitControls.enablePan = false;

    orbitControls.enableDamping = true;

    return orbitControls;
}

export class Game {
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private orbitControls: OrbitControls;
    private clock: Clock;
    private scene: Scene;
    private composer: EffectComposer;

    private hand: Hand;
    private cubes: Cube[];

    constructor(cubes: Cube[], scenes: Scenes) {
        this.camera = createCamera();
        this.renderer = createRenderer();

        this.orbitControls = createOrbitControls(this.camera, this.renderer);

        this.clock = new Clock();

        this.scene = new Scene();

        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass); // The base scene

        this.hand = new Hand(scenes.hand, this.scene, this.camera, this.composer);

        this.cubes = cubes;
        this.scene.add(...cubes.map(cube => cube.mesh), this.camera, this.hand.mesh);

        this.resize();
        window.onresize = () => this.resize();
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    run() {
        this.renderer.setAnimationLoop(() => {
            const time = {
                delta: this.clock.getDelta(),
                elapsed: this.clock.elapsedTime
            };

            this.orbitControls.update();
            this.hand.update(time, this.renderer, this.camera, this.cubes);
            for (const cube of this.cubes) {
                cube.update(time);
            }

            this.composer.render();
        });
    }
}
