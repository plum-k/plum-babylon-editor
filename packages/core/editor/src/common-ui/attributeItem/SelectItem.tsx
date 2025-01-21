import {Fragment} from "react";
import {Form, Select} from "antd";
import {SelectProps} from "antd/es/select";
import {useItemUpdate} from "./useItemUpdate";
import {BaseItemProps} from "./BaseItemProps";

export interface ISelectItemProps extends BaseItemProps<SelectProps> {
}

export function SelectItem(props: ISelectItemProps) {
    const {fieldProps, virtual, ...rest} = props
    const {isValue} = useItemUpdate(props);
    return (
        <Fragment>
            {
                isValue ?
                    <Form.Item {...rest}>
                        <Select {...fieldProps} style={{
                            width: "150px",
                        }}/>
                    </Form.Item> : null}
        </Fragment>
    )
}

