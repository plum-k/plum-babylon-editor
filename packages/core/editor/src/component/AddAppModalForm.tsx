import {Button, Form} from "antd";
import {Fragment} from "react";
import {ModalForm, ProFormSegmented, ProFormText} from "@ant-design/pro-components";
import {PlusOutlined} from "@ant-design/icons";
import {ApplicationApi} from "../api";

interface AddAppModalFormProps {
    ok: () => void
}

export default function AddAppModalForm(props: AddAppModalFormProps) {
    const {ok} = props;

    const [form] = Form.useForm<{ name: string; company: string }>();

    return <Fragment>
        <ModalForm
            {...{
                labelCol: {span: 4},
                wrapperCol: {span: 14},

            }}
            width={350}
            title="新建"
            layout={"horizontal"}
            trigger={
                <Button color="default" variant="solid">
                    <PlusOutlined/>
                    新建
                </Button>
            }
            submitter={{
                submitButtonProps: {
                    color: "default",
                    variant: "solid",
                },
                resetButtonProps: {}
            }}
            initialValues={{
                name: '',
                appType: 'BABYLON',
            }}
            form={form}
            autoFocusFirstInput
            modalProps={{
                destroyOnClose: true,
                centered: true,
                onCancel: () => console.log('run'),
            }}
            submitTimeout={2000}
            onFinish={async (values) => {
                const res = await ApplicationApi.create({...values})
                if (res.code === 1) {
                    ok()
                    return true
                }
            }}
        >
            <ProFormText
                name={['name']}
                label="名称"
                placeholder="请输入名称"
            />
            <ProFormSegmented
                valueEnum={{
                    "BABYLON": '应用',
                    "DIR": '目录',
                }}
                name={['appType']}
                label="类型"
            />
        </ModalForm>
    </Fragment>
}