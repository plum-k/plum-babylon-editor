// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "lensFlarePixelShader";
const shader = `varying vec2 vUV;uniform sampler2D textureSampler;uniform vec4 color;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
vec4 baseColor=texture2D(textureSampler,vUV);gl_FragColor=baseColor*color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const lensFlarePixelShader = { name, shader };
//# sourceMappingURL=lensFlare.fragment.js.map