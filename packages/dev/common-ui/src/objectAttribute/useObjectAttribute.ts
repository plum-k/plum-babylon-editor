import ObjectAttributeContext from "./ObjectAttributeContext.ts";
import {useContext} from "react";

const useObjectAttribute = () => {
    return useContext(ObjectAttributeContext);
}

export default useObjectAttribute;