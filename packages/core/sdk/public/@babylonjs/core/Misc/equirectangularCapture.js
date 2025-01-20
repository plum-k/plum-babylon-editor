import { ReflectionProbe } from "../Probes/reflectionProbe.js";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.js";
import { CustomProceduralTexture } from "../Materials/Textures/Procedurals/customProceduralTexture.js";
import { DumpData } from "./dumpTools.js";
import "../Shaders/equirectangularPanorama.fragment.js";
/**
 * @param scene This refers to the scene which would be rendered in the given equirectangular capture
 * @param options This refers to the options for a given equirectangular capture
 * @returns the requested capture's pixel-data or auto downloads the file if options.filename is specified
 */
export async function captureEquirectangularFromScene(scene, options) {
    const probe = options.probe ?? new ReflectionProbe("tempProbe", options.size, scene);
    const wasProbeProvided = !!options.probe;
    if (!wasProbeProvided) {
        if (options.position) {
            probe.position = options.position.clone();
        }
        else if (scene.activeCamera) {
            probe.position = scene.activeCamera.position.clone();
        }
    }
    const meshesToConsider = options.meshesFilter ? scene.meshes.filter(options.meshesFilter) : scene.meshes;
    probe.renderList?.push(...meshesToConsider);
    probe.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    probe.cubeTexture.render();
    const dumpTexture = new CustomProceduralTexture("tempProceduralTexture", "equirectangularPanorama", { width: options.size * 2, height: options.size }, scene);
    dumpTexture.setTexture("cubeMap", probe.cubeTexture);
    return new Promise((resolve, reject) => {
        dumpTexture.onGeneratedObservable.addOnce(() => {
            const pixelDataPromise = dumpTexture.readPixels();
            if (!pixelDataPromise) {
                reject(new Error("No Pixel Data found on procedural texture"));
                dumpTexture.dispose();
                if (!wasProbeProvided) {
                    probe.dispose();
                }
                return;
            }
            pixelDataPromise.then((pixelData) => {
                dumpTexture.dispose();
                if (!wasProbeProvided) {
                    probe.dispose();
                }
                if (options.filename) {
                    DumpData(options.size * 2, options.size, pixelData, undefined, "image/png", options.filename);
                    resolve(null);
                }
                else {
                    resolve(pixelData);
                }
            });
        });
    });
}
//# sourceMappingURL=equirectangularCapture.js.map