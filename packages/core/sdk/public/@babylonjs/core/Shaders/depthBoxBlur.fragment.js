// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "depthBoxBlurPixelShader";
const shader = `varying vec2 vUV;uniform sampler2D textureSampler;uniform vec2 screenSize;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec4 colorDepth=vec4(0.0);for (int x=-OFFSET; x<=OFFSET; x++)
for (int y=-OFFSET; y<=OFFSET; y++)
colorDepth+=texture2D(textureSampler,vUV+vec2(x,y)/screenSize);gl_FragColor=(colorDepth/float((OFFSET*2+1)*(OFFSET*2+1)));}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const depthBoxBlurPixelShader = { name, shader };
//# sourceMappingURL=depthBoxBlur.fragment.js.map