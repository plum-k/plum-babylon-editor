// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "filterPixelShader";
const shader = `varying vec2 vUV;uniform sampler2D textureSampler;uniform mat4 kernelMatrix;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec3 baseColor=texture2D(textureSampler,vUV).rgb;vec3 updatedColor=(kernelMatrix*vec4(baseColor,1.0)).rgb;gl_FragColor=vec4(updatedColor,1.0);}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const filterPixelShader = { name, shader };
//# sourceMappingURL=filter.fragment.js.map