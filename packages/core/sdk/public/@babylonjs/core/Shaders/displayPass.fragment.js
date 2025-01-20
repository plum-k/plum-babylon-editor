// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "displayPassPixelShader";
const shader = `varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D passSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{gl_FragColor=texture2D(passSampler,vUV);}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const displayPassPixelShader = { name, shader };
//# sourceMappingURL=displayPass.fragment.js.map