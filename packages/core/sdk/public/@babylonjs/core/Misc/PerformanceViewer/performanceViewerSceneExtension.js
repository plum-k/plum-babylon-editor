import { Scene } from "../../scene.js";
import { PerformanceViewerCollector } from "./performanceViewerCollector.js";
Scene.prototype.getPerfCollector = function () {
    if (!this._perfCollector) {
        this._perfCollector = new PerformanceViewerCollector(this);
    }
    return this._perfCollector;
};
//# sourceMappingURL=performanceViewerSceneExtension.js.map