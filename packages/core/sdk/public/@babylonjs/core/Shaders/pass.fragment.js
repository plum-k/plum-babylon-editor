// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "passPixelShader";
const shader = `varying vec2 vUV;uniform sampler2D textureSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const passPixelShader = { name, shader };
//# sourceMappingURL=pass.fragment.js.map