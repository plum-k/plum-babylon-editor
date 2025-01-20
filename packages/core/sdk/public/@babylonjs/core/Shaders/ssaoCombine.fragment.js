// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "ssaoCombinePixelShader";
const shader = `uniform sampler2D textureSampler;uniform sampler2D originalColor;uniform vec4 viewport;varying vec2 vUV;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
vec4 ssaoColor=texture2D(textureSampler,viewport.xy+vUV*viewport.zw);vec4 sceneColor=texture2D(originalColor,vUV);gl_FragColor=sceneColor*ssaoColor;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const ssaoCombinePixelShader = { name, shader };
//# sourceMappingURL=ssaoCombine.fragment.js.map