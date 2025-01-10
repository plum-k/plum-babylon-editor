import {Fragment, useEffect} from "react";
import {Form, FormProps} from "antd";
import {FieldData} from "rc-field-form/lib/interface";
import {BoolItem, ObjectAttributeProvider} from "@plum-render/common-ui";
import {useSetIsDebug, useViewer} from "../../store";

export default function ConfigAttribute() {
    const [form] = Form.useForm();
    const viewer = useViewer()
    const setIsDebug = useSetIsDebug();
    useEffect(() => {
    }, [viewer])
    useEffect(() => {
        updateConfig();
    }, [viewer])
    const updateConfig = () => {
        if (viewer) {
            form.setFieldValue("debug", false)
        }
    }
    const onFieldsChange: FormProps['onFieldsChange'] = (changedFields: FieldData[], allFields: FieldData[]) => {
        const changedField = changedFields[0];
        const name = changedField.name;
        const value = changedField.value;
        const firstName = name[0] as string;

        if (firstName === "debug") {
            if (value) {
                setIsDebug(true);
                viewer!.debug(true);
            } else {
                setIsDebug(false);
                viewer!.debug(false);
            }
        }
    }

    return (
        <Fragment>
            <div className={"scrollable-div"}>
                <Form
                    form={form}
                    onFieldsChange={onFieldsChange}
                    name="ConfigAttribute"
                    labelAlign="right"
                    labelWrap={true}
                    labelCol={{span: 8}}
                    wrapperCol={{span: 16}}
                >
                    <ObjectAttributeProvider value={{object: viewer}}>
                        <BoolItem label="调试模式" name="debug" virtual/>
                    </ObjectAttributeProvider>
                </Form>
            </div>
        </Fragment>
    )
}

