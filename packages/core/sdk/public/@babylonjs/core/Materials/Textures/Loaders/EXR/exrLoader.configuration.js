export var EXROutputType;
(function (EXROutputType) {
    EXROutputType[EXROutputType["Float"] = 0] = "Float";
    EXROutputType[EXROutputType["HalfFloat"] = 1] = "HalfFloat";
})(EXROutputType || (EXROutputType = {}));
/**
 * Class used to store configuration of the exr loader
 */
export class ExrLoaderGlobalConfiguration {
}
/**
 * Defines the default output type to use (Half float by default)
 */
ExrLoaderGlobalConfiguration.DefaultOutputType = EXROutputType.HalfFloat;
/**
 * Url to use to load the fflate library (for zip decompression)
 */
ExrLoaderGlobalConfiguration.FFLATEUrl = "https://unpkg.com/fflate@0.8.2";
//# sourceMappingURL=exrLoader.configuration.js.map