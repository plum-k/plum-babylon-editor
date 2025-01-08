import {createContext} from "react";
import {Subject} from "rxjs";

export interface ObjectAttributeContextValue {
    object: any;
    change?: Subject<any>;
}

const ObjectAttributeContext = createContext<ObjectAttributeContextValue>({object: {}, change: new Subject()});

export default ObjectAttributeContext;


