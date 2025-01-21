export type FitStrategyType = {
    wrapElement(element: HTMLElement): HTMLElement;
    updateSize(sizingElement: HTMLElement, width: number, height: number): void;
};
export declare const FitStrategy: {
    CONTAIN: FitStrategyType;
    COVER: FitStrategyType;
    STRETCH: FitStrategyType;
    NONE: FitStrategyType;
};
