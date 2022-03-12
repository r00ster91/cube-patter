import { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Game } from "./Game";

export interface Scenes {
    hand: {
        normal: Group;
        grab: Group;
    };
    heart: Group;
}

export async function load() {
    const loader = new GLTFLoader();

    const [normalHand, grabbingHand, heart] = await Promise.all([
        loader.loadAsync("hand.glb").then(gltf => gltf.scene),
        loader.loadAsync("grabbingHand.glb").then(gltf => gltf.scene),
        loader.loadAsync("heart.glb").then(gltf => gltf.scene),
    ]);
    const scenes: Scenes = { hand: { normal: normalHand, grab: grabbingHand }, heart };

    return new Game(scenes);
}
