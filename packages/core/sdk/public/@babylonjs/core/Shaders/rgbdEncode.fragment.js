// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
import "./ShadersInclude/helperFunctions.js";
const name = "rgbdEncodePixelShader";
const shader = `varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=toRGBD(texture2D(textureSampler,vUV).rgb);}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const rgbdEncodePixelShader = { name, shader };
//# sourceMappingURL=rgbdEncode.fragment.js.map