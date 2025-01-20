const FitStrategyContain = {
    wrapElement(element) {
        const sizingElement = document.createElement("div");
        sizingElement.style.display = "flex";
        sizingElement.style.justifyContent = "center";
        sizingElement.style.alignItems = "center";
        const scalingElement = document.createElement("div");
        scalingElement.style.visibility = "hidden";
        scalingElement.appendChild(element);
        sizingElement.appendChild(scalingElement);
        return sizingElement;
    },
    updateSize(sizingElement, width, height) {
        const scalingElement = sizingElement.firstElementChild;
        sizingElement.style.width = `${width}px`;
        sizingElement.style.height = `${height}px`;
        const [childWidth, childHeight] = [scalingElement.offsetWidth, scalingElement.offsetHeight];
        const scale = Math.min(width / childWidth, height / childHeight);
        scalingElement.style.transform = `scale(${scale})`;
        scalingElement.style.visibility = "visible";
    },
};
const FitStrategyCover = {
    wrapElement(element) {
        const sizingElement = document.createElement("div");
        sizingElement.style.display = "flex";
        sizingElement.style.justifyContent = "center";
        sizingElement.style.alignItems = "center";
        sizingElement.style.overflow = "hidden";
        const scalingElement = document.createElement("div");
        scalingElement.style.visibility = "hidden";
        scalingElement.appendChild(element);
        sizingElement.appendChild(scalingElement);
        return sizingElement;
    },
    updateSize(sizingElement, width, height) {
        const scalingElement = sizingElement.firstElementChild;
        sizingElement.style.width = `${width}px`;
        sizingElement.style.height = `${height}px`;
        const [childWidth, childHeight] = [scalingElement.offsetWidth, scalingElement.offsetHeight];
        const scale = Math.max(width / childWidth, height / childHeight);
        scalingElement.style.transform = `scale(${scale})`;
        scalingElement.style.visibility = "visible";
    },
};
const FitStrategyStretch = {
    wrapElement(element) {
        const sizingElement = document.createElement("div");
        sizingElement.style.display = "flex";
        sizingElement.style.justifyContent = "center";
        sizingElement.style.alignItems = "center";
        const scalingElement = document.createElement("div");
        scalingElement.style.visibility = "hidden";
        scalingElement.appendChild(element);
        sizingElement.appendChild(scalingElement);
        return sizingElement;
    },
    updateSize(sizingElement, width, height) {
        const scalingElement = sizingElement.firstElementChild;
        sizingElement.style.width = `${width}px`;
        sizingElement.style.height = `${height}px`;
        const [childWidth, childHeight] = [scalingElement.offsetWidth, scalingElement.offsetHeight];
        scalingElement.style.transform = `scale(${width / childWidth}, ${height / childHeight})`;
        scalingElement.style.visibility = "visible";
    },
};
const FitStrategyNone = {
    wrapElement(element) {
        return element;
    },
    updateSize(sizingElement, width, height) {
        if (sizingElement) {
            sizingElement.style.width = `${width}px`;
            sizingElement.style.height = `${height}px`;
        }
    },
};
export const FitStrategy = {
    CONTAIN: FitStrategyContain,
    COVER: FitStrategyCover,
    STRETCH: FitStrategyStretch,
    NONE: FitStrategyNone,
};
//# sourceMappingURL=fitStrategy.js.map