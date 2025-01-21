import {Fragment} from "react";
import {Form} from "antd";
import ReactJson from "@microlink/react-json-view";
import {useItemUpdate} from "./useItemUpdate";
import {BaseItemProps} from "./BaseItemProps";

export interface JsonWrapperProps extends BaseItemProps {
    id?: string;
    value?: object;
    onChange?: (value: any) => void;
}

export function JsonWrapper(props: JsonWrapperProps) {
    const {value, onChange} = props;

    return <ReactJson src={value as object} onAdd={() => {
        return true
    }} onDelete={() => true} onEdit={() => true}/>
}

export interface IJsonItemProps extends BaseItemProps {

}

export function JsonItem(props: IJsonItemProps) {
    const {} = props
    const {isValue} = useItemUpdate(props, {
        setDefaultValue: () => {
            return {}
        }
    });

    return (
        <Fragment>
            {
                isValue &&
                <Form.Item {...props}>
                    <JsonWrapper/>
                </Form.Item>
            }
        </Fragment>
    )
}

