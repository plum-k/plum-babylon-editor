import {Fragment, PropsWithChildren} from "react";
import {ObjectAttributeContext, ObjectAttributeContextValue} from "./ObjectAttributeContext";

export interface IObjectAttributeProviderProps extends PropsWithChildren {
    value: ObjectAttributeContextValue
}

export function ObjectAttributeProvider(props: IObjectAttributeProviderProps) {
    const {value, children} = props;

    return (
        <Fragment>
            <ObjectAttributeContext value={value}>
                {children}
            </ObjectAttributeContext>
        </Fragment>
    )
}

