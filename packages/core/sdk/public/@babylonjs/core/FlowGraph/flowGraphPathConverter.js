/**
 * @experimental
 * A path converter that converts a path on the flow graph context variables to an object accessor.
 */
export class FlowGraphPathConverter {
    constructor(_context, _separator = "/") {
        this._context = _context;
        this._separator = _separator;
    }
    convert(path) {
        const parts = path.split(this._separator);
        if (parts.length < 2) {
            throw new Error(`Path ${path} is invalid`);
        }
        let currentObject = this._context.getVariable(parts[0]);
        const property = parts[parts.length - 1];
        for (let i = 1; i < parts.length - 1; i++) {
            currentObject = currentObject[parts[i]];
        }
        return {
            object: currentObject,
            info: {
                type: "object",
                get: () => currentObject[property],
                set: (value) => (currentObject[property] = value),
                getObject: () => currentObject,
            },
        };
    }
}
//# sourceMappingURL=flowGraphPathConverter.js.map