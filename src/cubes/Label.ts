import "./Label.css";
import { Scene, Vector3 } from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";

export class Label {
    private element: HTMLDivElement;
    private object: CSS2DObject;

    constructor(text: string, cssScene: Scene) {
        this.element = document.createElement("div");
        this.element.className = "label";
        this.element.textContent = text;

        const arrow = document.createElement("div");
        arrow.className = "label-arrow";
        arrow.textContent = "🭭";
        this.element.innerHTML += arrow.outerHTML;

        this.object = new CSS2DObject(this.element);
        this.object.scale.set(0.1, 0.1, 0.1);
        cssScene.add(this.object);
    }

    update(position: Vector3) {
        this.object.position.set(position.x, 7.5, position.z);
    }
}
