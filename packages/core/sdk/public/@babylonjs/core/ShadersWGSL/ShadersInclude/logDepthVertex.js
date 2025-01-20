// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "logDepthVertex";
const shader = `#ifdef LOGARITHMICDEPTH
vertexOutputs.vFragmentDepth=1.0+vertexOutputs.position.w;vertexOutputs.position.z=log2(max(0.000001,vertexOutputs.vFragmentDepth))*uniforms.logarithmicDepthConstant;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const logDepthVertexWGSL = { name, shader };
//# sourceMappingURL=logDepthVertex.js.map