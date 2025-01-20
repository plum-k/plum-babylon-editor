// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
import "./ShadersInclude/helperFunctions.js";
const name = "copyTextureToTexturePixelShader";
const shader = `uniform float conversion;uniform sampler2D textureSampler;varying vec2 vUV;
#include<helperFunctions>
void main(void) 
{vec4 color=texture2D(textureSampler,vUV);
#ifdef DEPTH_TEXTURE
gl_FragDepth=color.r;
#else
if (conversion==1.) {color=toLinearSpace(color);} else if (conversion==2.) {color=toGammaSpace(color);}
gl_FragColor=color;
#endif
}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const copyTextureToTexturePixelShader = { name, shader };
//# sourceMappingURL=copyTextureToTexture.fragment.js.map