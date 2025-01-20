// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
import "./logDepthFragment.js";
import "./fogFragment.js";
const name = "gaussianSplattingFragmentDeclaration";
const shader = `fn gaussianColor(inColor: vec4f,inPosition: vec2f)->vec4f
{var A : f32=-dot(inPosition,inPosition);if (A>-4.0)
{var B: f32=exp(A)*inColor.a;
#include<logDepthFragment>
var color: vec3f=inColor.rgb;
#ifdef FOG
#include<fogFragment>
#endif
return vec4f(color,B);} else {return vec4f(0.0);}}
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const gaussianSplattingFragmentDeclarationWGSL = { name, shader };
//# sourceMappingURL=gaussianSplattingFragmentDeclaration.js.map