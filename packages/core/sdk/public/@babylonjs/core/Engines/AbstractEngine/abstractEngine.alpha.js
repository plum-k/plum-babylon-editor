import { AbstractEngine } from "../abstractEngine.js";

AbstractEngine.prototype.setAlphaEquation = function (equation) {
    if (this._alphaEquation === equation) {
        return;
    }
    switch (equation) {
        case 0:
            this._alphaState.setAlphaEquationParameters(32774, 32774);
            break;
        case 1:
            this._alphaState.setAlphaEquationParameters(32778, 32778);
            break;
        case 2:
            this._alphaState.setAlphaEquationParameters(32779, 32779);
            break;
        case 3:
            this._alphaState.setAlphaEquationParameters(32776, 32776);
            break;
        case 4:
            this._alphaState.setAlphaEquationParameters(32775, 32775);
            break;
        case 5:
            this._alphaState.setAlphaEquationParameters(32775, 32774);
            break;
    }
    this._alphaEquation = equation;
};
//# sourceMappingURL=abstractEngine.alpha.js.map