// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "gaussianSplattingVertexDeclaration";
const shader = `attribute vec2 position;uniform mat4 view;uniform mat4 projection;uniform mat4 world;uniform vec4 vEyePosition;`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const gaussianSplattingVertexDeclaration = { name, shader };
//# sourceMappingURL=gaussianSplattingVertexDeclaration.js.map