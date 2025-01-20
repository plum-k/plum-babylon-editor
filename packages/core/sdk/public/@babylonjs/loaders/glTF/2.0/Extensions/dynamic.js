/* eslint-disable @typescript-eslint/naming-convention */
import { registerGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
/**
 * Registers the built-in glTF 2.0 extension async factories, which dynamically imports and loads each glTF extension on demand (e.g. only when a glTF model uses the extension).
 */
export function registerBuiltInGLTFExtensions() {
    registerGLTFExtension("EXT_lights_image_based", true, async (loader) => {
        const { EXT_lights_image_based } = await import("./EXT_lights_image_based.js");
        return new EXT_lights_image_based(loader);
    });
    registerGLTFExtension("EXT_mesh_gpu_instancing", true, async (loader) => {
        const { EXT_mesh_gpu_instancing } = await import("./EXT_mesh_gpu_instancing.js");
        return new EXT_mesh_gpu_instancing(loader);
    });
    registerGLTFExtension("EXT_meshopt_compression", true, async (loader) => {
        const { EXT_meshopt_compression } = await import("./EXT_meshopt_compression.js");
        return new EXT_meshopt_compression(loader);
    });
    registerGLTFExtension("EXT_texture_avif", true, async (loader) => {
        const { EXT_texture_avif } = await import("./EXT_texture_avif.js");
        return new EXT_texture_avif(loader);
    });
    registerGLTFExtension("EXT_texture_webp", true, async (loader) => {
        const { EXT_texture_webp } = await import("./EXT_texture_webp.js");
        return new EXT_texture_webp(loader);
    });
    registerGLTFExtension("ExtrasAsMetadata", false, async (loader) => {
        const { ExtrasAsMetadata } = await import("./ExtrasAsMetadata.js");
        return new ExtrasAsMetadata(loader);
    });
    registerGLTFExtension("KHR_animation_pointer", true, async (loader) => {
        const { KHR_animation_pointer } = await import("./KHR_animation_pointer.js");
        return new KHR_animation_pointer(loader);
    });
    registerGLTFExtension("KHR_draco_mesh_compression", true, async (loader) => {
        const { KHR_draco_mesh_compression } = await import("./KHR_draco_mesh_compression.js");
        return new KHR_draco_mesh_compression(loader);
    });
    registerGLTFExtension("KHR_interactivity", true, async (loader) => {
        const { KHR_interactivity } = await import("./KHR_interactivity.js");
        return new KHR_interactivity(loader);
    });
    registerGLTFExtension("KHR_lights_punctual", true, async (loader) => {
        const { KHR_lights } = await import("./KHR_lights_punctual.js");
        return new KHR_lights(loader);
    });
    registerGLTFExtension("EXT_lights_ies", true, async (loader) => {
        const { EXT_lights_ies } = await import("./EXT_lights_ies.js");
        return new EXT_lights_ies(loader);
    });
    registerGLTFExtension("KHR_materials_anisotropy", true, async (loader) => {
        const { KHR_materials_anisotropy } = await import("./KHR_materials_anisotropy.js");
        return new KHR_materials_anisotropy(loader);
    });
    registerGLTFExtension("KHR_materials_clearcoat", true, async (loader) => {
        const { KHR_materials_clearcoat } = await import("./KHR_materials_clearcoat.js");
        return new KHR_materials_clearcoat(loader);
    });
    registerGLTFExtension("KHR_materials_diffuse_transmission", true, async (loader) => {
        const { KHR_materials_diffuse_transmission } = await import("./KHR_materials_diffuse_transmission.js");
        return new KHR_materials_diffuse_transmission(loader);
    });
    registerGLTFExtension("KHR_materials_dispersion", true, async (loader) => {
        const { KHR_materials_dispersion } = await import("./KHR_materials_dispersion.js");
        return new KHR_materials_dispersion(loader);
    });
    registerGLTFExtension("KHR_materials_emissive_strength", true, async (loader) => {
        const { KHR_materials_emissive_strength } = await import("./KHR_materials_emissive_strength.js");
        return new KHR_materials_emissive_strength(loader);
    });
    registerGLTFExtension("KHR_materials_ior", true, async (loader) => {
        const { KHR_materials_ior } = await import("./KHR_materials_ior.js");
        return new KHR_materials_ior(loader);
    });
    registerGLTFExtension("KHR_materials_iridescence", true, async (loader) => {
        const { KHR_materials_iridescence } = await import("./KHR_materials_iridescence.js");
        return new KHR_materials_iridescence(loader);
    });
    registerGLTFExtension("KHR_materials_pbrSpecularGlossiness", true, async (loader) => {
        const { KHR_materials_pbrSpecularGlossiness } = await import("./KHR_materials_pbrSpecularGlossiness.js");
        return new KHR_materials_pbrSpecularGlossiness(loader);
    });
    registerGLTFExtension("KHR_materials_sheen", true, async (loader) => {
        const { KHR_materials_sheen } = await import("./KHR_materials_sheen.js");
        return new KHR_materials_sheen(loader);
    });
    registerGLTFExtension("KHR_materials_specular", true, async (loader) => {
        const { KHR_materials_specular } = await import("./KHR_materials_specular.js");
        return new KHR_materials_specular(loader);
    });
    registerGLTFExtension("KHR_materials_transmission", true, async (loader) => {
        const { KHR_materials_transmission } = await import("./KHR_materials_transmission.js");
        return new KHR_materials_transmission(loader);
    });
    registerGLTFExtension("KHR_materials_unlit", true, async (loader) => {
        const { KHR_materials_unlit } = await import("./KHR_materials_unlit.js");
        return new KHR_materials_unlit(loader);
    });
    registerGLTFExtension("KHR_materials_variants", true, async (loader) => {
        const { KHR_materials_variants } = await import("./KHR_materials_variants.js");
        return new KHR_materials_variants(loader);
    });
    registerGLTFExtension("KHR_materials_volume", true, async (loader) => {
        const { KHR_materials_volume } = await import("./KHR_materials_volume.js");
        return new KHR_materials_volume(loader);
    });
    registerGLTFExtension("KHR_mesh_quantization", true, async (loader) => {
        const { KHR_mesh_quantization } = await import("./KHR_mesh_quantization.js");
        return new KHR_mesh_quantization(loader);
    });
    registerGLTFExtension("KHR_texture_basisu", true, async (loader) => {
        const { KHR_texture_basisu } = await import("./KHR_texture_basisu.js");
        return new KHR_texture_basisu(loader);
    });
    registerGLTFExtension("KHR_texture_transform", true, async (loader) => {
        const { KHR_texture_transform } = await import("./KHR_texture_transform.js");
        return new KHR_texture_transform(loader);
    });
    registerGLTFExtension("KHR_xmp_json_ld", true, async (loader) => {
        const { KHR_xmp_json_ld } = await import("./KHR_xmp_json_ld.js");
        return new KHR_xmp_json_ld(loader);
    });
    registerGLTFExtension("MSFT_audio_emitter", true, async (loader) => {
        const { MSFT_audio_emitter } = await import("./MSFT_audio_emitter.js");
        return new MSFT_audio_emitter(loader);
    });
    registerGLTFExtension("MSFT_lod", true, async (loader) => {
        const { MSFT_lod } = await import("./MSFT_lod.js");
        return new MSFT_lod(loader);
    });
    registerGLTFExtension("MSFT_minecraftMesh", true, async (loader) => {
        const { MSFT_minecraftMesh } = await import("./MSFT_minecraftMesh.js");
        return new MSFT_minecraftMesh(loader);
    });
    registerGLTFExtension("MSFT_sRGBFactors", true, async (loader) => {
        const { MSFT_sRGBFactors } = await import("./MSFT_sRGBFactors.js");
        return new MSFT_sRGBFactors(loader);
    });
    registerGLTFExtension("KHR_node_visibility", true, async (loader) => {
        const { KHR_node_visibility } = await import("./KHR_node_visibility.js");
        return new KHR_node_visibility(loader);
    });
    registerGLTFExtension("KHR_node_hoverability", true, async (loader) => {
        const { KHR_node_hoverability } = await import("./KHR_node_hoverability.js");
        return new KHR_node_hoverability(loader);
    });
}
//# sourceMappingURL=dynamic.js.map