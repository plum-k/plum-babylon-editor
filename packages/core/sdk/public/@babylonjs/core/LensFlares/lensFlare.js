import { Color3 } from "../Maths/math.color.js";
import { Texture } from "../Materials/Textures/texture.js";

import { DrawWrapper } from "../Materials/drawWrapper.js";
import { VertexBuffer } from "../Buffers/buffer.js";
/**
 * This represents one of the lens effect in a `lensFlareSystem`.
 * It controls one of the individual texture used in the effect.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/lenseFlare
 */
export class LensFlare {
    /**
     * Creates a new Lens Flare.
     * This represents one of the lens effect in a `lensFlareSystem`.
     * It controls one of the individual texture used in the effect.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/lenseFlare
     * @param size Define the size of the lens flare (a floating value between 0 and 1)
     * @param position Define the position of the lens flare in the system. (a floating value between -1 and 1). A value of 0 is located on the emitter. A value greater than 0 is beyond the emitter and a value lesser than 0 is behind.
     * @param color Define the lens color
     * @param imgUrl Define the lens texture url
     * @param system Define the `lensFlareSystem` this flare is part of
     * @returns The newly created Lens Flare
     */
    static AddFlare(size, position, color, imgUrl, system) {
        return new LensFlare(size, position, color, imgUrl, system);
    }
    /**
     * Instantiates a new Lens Flare.
     * This represents one of the lens effect in a `lensFlareSystem`.
     * It controls one of the individual texture used in the effect.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/lenseFlare
     * @param size Define the size of the lens flare in the system (a floating value between 0 and 1)
     * @param position Define the position of the lens flare in the system. (a floating value between -1 and 1). A value of 0 is located on the emitter. A value greater than 0 is beyond the emitter and a value lesser than 0 is behind.
     * @param color Define the lens color
     * @param imgUrl Define the lens texture url
     * @param system Define the `lensFlareSystem` this flare is part of
     */
    constructor(
    /**
     * Define the size of the lens flare in the system (a floating value between 0 and 1)
     */
    size, 
    /**
     * Define the position of the lens flare in the system. (a floating value between -1 and 1). A value of 0 is located on the emitter. A value greater than 0 is beyond the emitter and a value lesser than 0 is behind.
     */
    position, color, imgUrl, system) {
        this.size = size;
        this.position = position;
        /**
         * Define the alpha mode to render this particular lens.
         */
        this.alphaMode = 6;
        this.color = color || new Color3(1, 1, 1);
        this.texture = imgUrl ? new Texture(imgUrl, system.getScene(), true) : null;
        this._system = system;
        const engine = system.scene.getEngine();
        system._onShadersLoaded.addOnce(() => {
            this._drawWrapper = new DrawWrapper(engine);
            this._drawWrapper.effect = engine.createEffect("lensFlare", [VertexBuffer.PositionKind], ["color", "viewportMatrix"], ["textureSampler"], "", undefined, undefined, undefined, undefined, system.shaderLanguage);
        });
        system.lensFlares.push(this);
    }
    /**
     * Dispose and release the lens flare with its associated resources.
     */
    dispose() {
        if (this.texture) {
            this.texture.dispose();
        }
        // Remove from scene
        const index = this._system.lensFlares.indexOf(this);
        this._system.lensFlares.splice(index, 1);
    }
}
//# sourceMappingURL=lensFlare.js.map