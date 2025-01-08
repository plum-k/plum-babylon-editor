import {FC, Fragment, PropsWithChildren} from "react";
import ObjectAttributeContext, {ObjectAttributeContextValue} from "./ObjectAttributeContext";


export interface IObjectAttributeProviderProps extends PropsWithChildren {
    value: ObjectAttributeContextValue
}

const ObjectAttributeProvider: FC<IObjectAttributeProviderProps> = (props: IObjectAttributeProviderProps) => {
    const {value, children} = props;

    return (
        <Fragment>
            <ObjectAttributeContext.Provider value={value}>
                {children}
            </ObjectAttributeContext.Provider>
        </Fragment>
    )
}

export default ObjectAttributeProvider;
