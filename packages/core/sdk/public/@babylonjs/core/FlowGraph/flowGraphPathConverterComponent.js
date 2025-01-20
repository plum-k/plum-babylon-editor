import { RichTypeFlowGraphInteger } from "./flowGraphRichTypes.js";
const pathHasTemplatesRegex = new RegExp(/\{(\w+)\}/g);
/**
 * @experimental
 * A component that converts a path to an object accessor.
 */
export class FlowGraphPathConverterComponent {
    constructor(path, ownerBlock) {
        this.path = path;
        this.ownerBlock = ownerBlock;
        /**
         * The templated inputs for the provided path.
         */
        this.templatedInputs = [];
        let match = pathHasTemplatesRegex.exec(path);
        while (match) {
            const [, matchGroup] = match;
            this.templatedInputs.push(ownerBlock.registerDataInput(matchGroup, RichTypeFlowGraphInteger));
            match = pathHasTemplatesRegex.exec(path);
        }
    }
    getAccessor(pathConverter, context) {
        let finalPath = this.path;
        for (const templatedInput of this.templatedInputs) {
            const valueToReplace = templatedInput.getValue(context).value;
            finalPath = finalPath.replace(`{${templatedInput.name}}`, valueToReplace.toString());
        }
        return pathConverter.convert(finalPath);
    }
}
//# sourceMappingURL=flowGraphPathConverterComponent.js.map