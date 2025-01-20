// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
import "./ShadersInclude/imageProcessingDeclaration.js";
import "./ShadersInclude/helperFunctions.js";
import "./ShadersInclude/imageProcessingFunctions.js";
const name = "imageProcessingPixelShader";
const shader = `varying vec2 vUV;uniform sampler2D textureSampler;
#include<imageProcessingDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec4 result=texture2D(textureSampler,vUV);
#ifdef IMAGEPROCESSING
#ifndef FROMLINEARSPACE
result.rgb=toLinearSpace(result.rgb);
#endif
result=applyImageProcessing(result);
#else
#ifdef FROMLINEARSPACE
result=applyImageProcessing(result);
#endif
#endif
gl_FragColor=result;}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const imageProcessingPixelShader = { name, shader };
//# sourceMappingURL=imageProcessing.fragment.js.map