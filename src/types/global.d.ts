import * as THREE from "three"

declare global {
    interface Window {
        devMode: () => void;
    }
}

declare module "three"{
    interface Object3D {
        isMesh?: boolean
    }
}

export { };