// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "fogVertex";
const shader = `#ifdef FOG
#ifdef SCENE_UBO
vertexOutputs.vFogDistance=(scene.view*worldPos).xyz;
#else
vertexOutputs.vFogDistance=(uniforms.view*worldPos).xyz;
#endif
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const fogVertexWGSL = { name, shader };
//# sourceMappingURL=fogVertex.js.map