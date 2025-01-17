import {ParticleSystem} from "@babylonjs/core";

export interface IPlumParticle {
    name:string;
    capacity: number;

}

/**
 * 把 babylon 粒子系统的配置 按相关性分类
 */
export class PlumParticle {
    particleSystem: ParticleSystem;
    constructor(options: IPlumParticle) {


        this.particleSystem = new ParticleSystem(options.name, options.capacity, scene);
    }
}