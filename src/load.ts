import { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Cube, CubeType } from "./Cube";
import { Game } from "./Game";

export interface Scenes {
    hand: Group;
}

export async function load() {
    const loader = new GLTFLoader();

    const [hand] = await Promise.all([
        loader.loadAsync("hand.glb").then(gltf => gltf.scene),
    ]);
    const scenes: Scenes = { hand };

    const cubes = [
        new Cube(CubeType.Regular, "a")
    ];
    return new Game(cubes, scenes);
}
