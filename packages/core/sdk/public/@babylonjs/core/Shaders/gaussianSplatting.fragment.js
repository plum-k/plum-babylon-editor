// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
import "./ShadersInclude/clipPlaneFragmentDeclaration.js";
import "./ShadersInclude/logDepthDeclaration.js";
import "./ShadersInclude/fogFragmentDeclaration.js";
import "./ShadersInclude/gaussianSplattingFragmentDeclaration.js";
import "./ShadersInclude/clipPlaneFragment.js";
const name = "gaussianSplattingPixelShader";
const shader = `#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
varying vec4 vColor;varying vec2 vPosition;
#include<gaussianSplattingFragmentDeclaration>
void main () { 
#include<clipPlaneFragment>
gl_FragColor=gaussianColor(vColor);}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const gaussianSplattingPixelShader = { name, shader };
//# sourceMappingURL=gaussianSplatting.fragment.js.map