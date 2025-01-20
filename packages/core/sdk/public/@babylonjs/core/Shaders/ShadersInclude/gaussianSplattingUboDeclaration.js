// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
import "./sceneUboDeclaration.js";
import "./meshUboDeclaration.js";
const name = "gaussianSplattingUboDeclaration";
const shader = `#include<sceneUboDeclaration>
#include<meshUboDeclaration>
attribute vec2 position;`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const gaussianSplattingUboDeclaration = { name, shader };
//# sourceMappingURL=gaussianSplattingUboDeclaration.js.map