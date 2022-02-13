import { BoxBufferGeometry, Mesh, MeshStandardMaterial } from "three";
import { Time, Object } from "./Object";

export enum CubeType {
    Regular,
    Tofu,
    Robot
}

export class Cube implements Object {
    private type: CubeType;
    private name: string;
    readonly mesh: Mesh;

    constructor(type: CubeType, name: string) {
        this.type = type;
        this.name = name;
        const geometry = new BoxBufferGeometry(10, 10, 10, 1, 10);
        const material = new MeshStandardMaterial();
        this.mesh = new Mesh(geometry, material);
    }

    update(time: Time) {
        const position = this.mesh.geometry.attributes.position;
        const wobbliness = Math.cos(time.elapsed) / 1000;
        // document.getElementById("value")!.innerText = "aAAAA";
        for (let index = 0; index < position.count; index += 1) {
            let x = position.getX(index);
            x += wobbliness * position.getY(index) ** 2;
            position.setX(index, x);
        }
        position.needsUpdate = true;
    }
}
