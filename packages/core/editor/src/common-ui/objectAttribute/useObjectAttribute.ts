import {useContext} from "react";
import {ObjectAttributeContext} from "./ObjectAttributeContext";

export function useObjectAttribute() {
    return useContext(ObjectAttributeContext);
}

