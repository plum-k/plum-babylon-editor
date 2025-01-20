// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
import "./ShadersInclude/boundingBoxRendererFragmentDeclaration.js";
import "./ShadersInclude/boundingBoxRendererUboDeclaration.js";
const name = "boundingBoxRendererPixelShader";
const shader = `#include<__decl__boundingBoxRendererFragment>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const boundingBoxRendererPixelShader = { name, shader };
//# sourceMappingURL=boundingBoxRenderer.fragment.js.map