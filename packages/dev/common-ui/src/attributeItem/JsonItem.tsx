import {FC, Fragment} from "react";
import {Form} from "antd";
import ReactJson from "@microlink/react-json-view";
import useItemUpdate from "./useItemUpdate.ts";
import BaseItemProps from "./BaseItemProps.ts";


export interface JsonWrapperProps extends BaseItemProps {
    id?: string;
    value?: object;
    onChange?: (value: any) => void;
}

const JsonWrapper: FC<JsonWrapperProps> = (props: JsonWrapperProps) => {
    const {value, onChange} = props;

    return <ReactJson src={value as object} onAdd={() => {
        return true
    }} onDelete={() => true} onEdit={() => true}/>
}

export interface IJsonItemProps extends BaseItemProps {

}

const JsonItem: FC<IJsonItemProps> = (props: IJsonItemProps) => {
    const {} = props
    const {isValue} = useItemUpdate(props, {
        setDefaultValue: () => {
            return {}
        }
    });

    return (
        <Fragment>
            {
                isValue ?
                    <Form.Item {...props}>
                        <JsonWrapper/>
                    </Form.Item>
                    : null}
        </Fragment>
    )
}

export default JsonItem;
