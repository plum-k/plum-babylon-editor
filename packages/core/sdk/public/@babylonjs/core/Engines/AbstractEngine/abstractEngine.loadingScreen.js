import { IsWindowObjectExist } from "../../Misc/domManagement.js";
import { AbstractEngine } from "../abstractEngine.js";
AbstractEngine.prototype.displayLoadingUI = function () {
    if (!IsWindowObjectExist()) {
        return;
    }
    const loadingScreen = this.loadingScreen;
    if (loadingScreen) {
        loadingScreen.displayLoadingUI();
    }
};
AbstractEngine.prototype.hideLoadingUI = function () {
    if (!IsWindowObjectExist()) {
        return;
    }
    const loadingScreen = this._loadingScreen;
    if (loadingScreen) {
        loadingScreen.hideLoadingUI();
    }
};
Object.defineProperty(AbstractEngine.prototype, "loadingScreen", {
    get: function () {
        if (!this._loadingScreen && this._renderingCanvas) {
            this._loadingScreen = AbstractEngine.DefaultLoadingScreenFactory(this._renderingCanvas);
        }
        return this._loadingScreen;
    },
    set: function (value) {
        this._loadingScreen = value;
    },
    enumerable: true,
    configurable: true,
});
Object.defineProperty(AbstractEngine.prototype, "loadingUIText", {
    set: function (value) {
        this.loadingScreen.loadingUIText = value;
    },
    enumerable: true,
    configurable: true,
});
Object.defineProperty(AbstractEngine.prototype, "loadingUIBackgroundColor", {
    set: function (value) {
        this.loadingScreen.loadingUIBackgroundColor = value;
    },
    enumerable: true,
    configurable: true,
});
//# sourceMappingURL=abstractEngine.loadingScreen.js.map