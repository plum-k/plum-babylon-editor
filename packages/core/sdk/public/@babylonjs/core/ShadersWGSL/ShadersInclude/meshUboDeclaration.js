// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "meshUboDeclaration";
const shader = `struct Mesh {world : mat4x4<f32>,
visibility : f32,};var<uniform> mesh : Mesh;
#define WORLD_UBO
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const meshUboDeclarationWGSL = { name, shader };
//# sourceMappingURL=meshUboDeclaration.js.map