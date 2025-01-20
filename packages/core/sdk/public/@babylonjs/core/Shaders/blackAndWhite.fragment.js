// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "blackAndWhitePixelShader";
const shader = `varying vec2 vUV;uniform sampler2D textureSampler;uniform float degree;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{vec3 color=texture2D(textureSampler,vUV).rgb;float luminance=dot(color,vec3(0.3,0.59,0.11)); 
vec3 blackAndWhite=vec3(luminance,luminance,luminance);gl_FragColor=vec4(color-((color-blackAndWhite)*degree),1.0);}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const blackAndWhitePixelShader = { name, shader };
//# sourceMappingURL=blackAndWhite.fragment.js.map