/** @internal */
export class PerformanceConfigurator {
    /**
     * @internal
     */
    static SetMatrixPrecision(use64bits) {
        PerformanceConfigurator.MatrixTrackPrecisionChange = false;
        if (use64bits && !PerformanceConfigurator.MatrixUse64Bits) {
            if (PerformanceConfigurator.MatrixTrackedMatrices) {
                for (let m = 0; m < PerformanceConfigurator.MatrixTrackedMatrices.length; ++m) {
                    const matrix = PerformanceConfigurator.MatrixTrackedMatrices[m];
                    const values = matrix._m;
                    matrix._m = new Array(16);
                    for (let i = 0; i < 16; ++i) {
                        matrix._m[i] = values[i];
                    }
                }
            }
        }
        PerformanceConfigurator.MatrixUse64Bits = use64bits;
        PerformanceConfigurator.MatrixCurrentType = PerformanceConfigurator.MatrixUse64Bits ? Array : Float32Array;
        PerformanceConfigurator.MatrixTrackedMatrices = null; // reclaim some memory, as we don't need _TrackedMatrices anymore
    }
}
/** @internal */
PerformanceConfigurator.MatrixUse64Bits = false;
/** @internal */
PerformanceConfigurator.MatrixTrackPrecisionChange = true;
/** @internal */
PerformanceConfigurator.MatrixCurrentType = Float32Array;
/** @internal */
PerformanceConfigurator.MatrixTrackedMatrices = [];
//# sourceMappingURL=performanceConfigurator.js.map