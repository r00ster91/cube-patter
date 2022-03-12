import { Clock, DirectionalLight, Mesh, MOUSE, PerspectiveCamera, PointLight, Scene, WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import * as Cube from "./cubes/Cube";
import { Hand } from "./Hand";
import { Scenes } from "./load";
import "./background";
import { Floor } from "./Floor";
import * as background from "./background";
import { getRandomNumber, getTimelyBrightness } from "./helpers";

function getCamera() {
    const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.x = 25;
    camera.position.y = 25;
    camera.position.z = 25;
    return camera;
}

function getRenderer() {
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    document.body.append(renderer.domElement);
    return renderer;
}

function getOrbitControls(camera: PerspectiveCamera) {
    const orbitControls = new OrbitControls(camera, document.body);

    // Only allow panning, using the middle mouse button
    orbitControls.mouseButtons = {
        LEFT: null as unknown as MOUSE,
        MIDDLE: MOUSE.LEFT,
        RIGHT: undefined as unknown as MOUSE
    };
    orbitControls.enablePan = false;

    orbitControls.enableDamping = true;

    return orbitControls;
}

function getLight() {
    const light = new PointLight("white", 100, 0, 0.75);
    light.position.y = 25;
    light.castShadow = true;

    // Soften the shadows
    light.shadow.radius = 5;
    // See also: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#understand_system_limits
    light.shadow.mapSize.set(8 ** 4, 8 ** 4);

    return light;
}

export class Game {
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private orbitControls: OrbitControls;
    private clock: Clock;
    private scene: Scene;
    private composer: EffectComposer;
    private css: {
        renderer: CSS2DRenderer,
        scene: Scene;
    };

    private floor: Floor;
    private cubes: Cube.Cube[];
    private hand: Hand;

    arrangeCubes(cubes: Cube.Cube[], floor: Floor) {
        cubes.forEach(cube => {
            cube.object.position.set(
                getRandomNumber(-floor.size / 2 + cube.size, floor.size / 2 - cube.size),
                0,
                getRandomNumber(-floor.size / 2 + cube.size, floor.size / 2 - cube.size),
            );
        });
        return cubes;
    }

    constructor(scenes: Scenes) {
        this.camera = getCamera();
        this.renderer = getRenderer();

        this.orbitControls = getOrbitControls(this.camera);

        this.clock = new Clock();

        this.scene = new Scene();

        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass); // The base scene

        this.floor = new Floor(this.scene);

        this.css = {
            renderer: new CSS2DRenderer(),
            scene: new Scene()
        };
        this.css.renderer.setSize(window.innerWidth, window.innerHeight);
        this.css.renderer.domElement.style.position = "absolute";
        this.css.renderer.domElement.style.top = "0";
        document.body.appendChild(this.css.renderer.domElement);
        this.css.scene.layers.enableAll();

        this.cubes = this.arrangeCubes([new Cube.Regular("YourLocalCube64", this.css.scene)], this.floor);

        const cubeMeshes = this.cubes.map(cube => cube.object as Cube.CubeMesh);

        const heartGeometry = (scenes.heart.children as Mesh[])[0].geometry;
        this.hand = new Hand(scenes.hand, this.scene, this.camera, this.composer, this.floor, cubeMeshes, heartGeometry);

        const light = getLight();
        this.camera.add(new DirectionalLight("white", 2));
        this.scene.add(
            this.floor.object,
            ...cubeMeshes,
            this.hand.object,
            light,
            this.camera, // For the camera's light
        );

        this.setTimelyColors();
        this.resize();
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    setTimelyColors() {
        const brightness = getTimelyBrightness();
        background.setTimelyColor(brightness);
        this.floor.setTimelyColor(brightness);
    }

    run() {
        // Re-set the background and floor colors every so often
        const second = 1000;
        const minute = second * 60;
        setInterval(() => this.setTimelyColors, minute);

        window.onresize = () => this.resize();

        this.renderer.setAnimationLoop(() => {
            const time = {
                delta: this.clock.getDelta(),
                elapsed: this.clock.elapsedTime
            };

            this.orbitControls.update();
            this.hand.update(time, this.cubes.map(cube => cube.object as Cube.CubeMesh));
            this.cubes.forEach(cube => {
                cube.update(time, this.floor, this.cubes.filter(filterCube => filterCube !== cube), this.camera);
            });

            this.composer.render();
            this.css.renderer.render(this.css.scene, this.camera);
        });
    }
}
