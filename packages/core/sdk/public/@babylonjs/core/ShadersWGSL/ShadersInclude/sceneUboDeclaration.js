// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "sceneUboDeclaration";
const shader = `struct Scene {viewProjection : mat4x4<f32>,
#ifdef MULTIVIEW
viewProjectionR : mat4x4<f32>,
#endif 
view : mat4x4<f32>,
projection : mat4x4<f32>,
vEyePosition : vec4<f32>,};
#define SCENE_UBO
var<uniform> scene : Scene;
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const sceneUboDeclarationWGSL = { name, shader };
//# sourceMappingURL=sceneUboDeclaration.js.map