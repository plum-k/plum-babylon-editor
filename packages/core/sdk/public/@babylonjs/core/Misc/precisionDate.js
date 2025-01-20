import { IsWindowObjectExist } from "./domManagement.js";
/**
 * Class containing a set of static utilities functions for precision date
 */
export class PrecisionDate {
    /**
     * Gets either window.performance.now() if supported or Date.now() else
     */
    static get Now() {
        if (IsWindowObjectExist() && window.performance && window.performance.now) {
            return window.performance.now();
        }
        return Date.now();
    }
}
//# sourceMappingURL=precisionDate.js.map