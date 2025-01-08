import {FC, Fragment} from "react";
import {Form, Select} from "antd";
import {SelectProps} from "antd/es/select";
import useItemUpdate from "./useItemUpdate.ts";
import BaseItemProps from "./BaseItemProps.ts";

export interface ISelectItemProps extends BaseItemProps<SelectProps> {
}

const SelectItem: FC<ISelectItemProps> = (props: ISelectItemProps) => {
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

export default SelectItem;
