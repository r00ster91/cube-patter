import { Mesh } from "three";

export interface Time {
    delta: number;
    elapsed: number;
}

export interface Object {
    mesh: Mesh;
    update: (clock: Time, ...parameters: any) => void;
}
