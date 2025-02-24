import {Form, TreeSelect} from "antd";
import {Fragment, useEffect, useState} from "react";
import {ModalForm, ProFormText} from "@ant-design/pro-components";
import {ApplicationApi} from "../../api";
import {IApplication} from "../../interface";

interface EditAppModalFormProps {
    editAppInfo: IApplication | null
    ok: () => void,
    open: boolean,
    setOpen: (value: boolean) => void
}

interface IApplicationTree extends IApplication {
    children: IApplication[];
    title: string,
    value: number
}

export default function EditAppModalForm(props: EditAppModalFormProps) {
    const {ok, open, editAppInfo, setOpen} = props;

    const [form] = Form.useForm<{ name: string; company: string }>();

    const [treeData, setTreeData] = useState<IApplication[]>([]);

    useEffect(() => {
        if (open) {
            ApplicationApi.getAllDir().then((res) => {
                const tree = buildTree(res.data);
                setTreeData(tree);
            })
        }
    }, [open])

    function buildTree(data: IApplication[]) {
        const nodeMap: Record<number, IApplicationTree> = {};
        const tree: IApplication[] = [];


        const currentId = editAppInfo?.id!;

        data.forEach(item => {
            // 排除当前编辑的对象
            if (item.id === currentId) {

            } else {
                nodeMap[item.id] = {
                    children: [],
                    ...item,
                    title: item.name,
                    value: item.id
                };
            }
        });
        data.forEach(item => {
            const currentNode = nodeMap[item.id];
            if (!currentNode) {
                return
            }
            const parentId = item.parentId;
            if (parentId === null) {
                tree.push(currentNode);
            } else {
                const parentNode = nodeMap[parentId];
                if (parentNode) {
                    if (!parentNode.children) {
                        parentNode.children = []
                    }
                    parentNode.children.push(currentNode);
                }
            }
        });

        return tree;
    }

    return <Fragment>
        <ModalForm
            {...{
                labelCol: {span: 4},
                wrapperCol: {span: 14},
            }}
            open={open}
            onOpenChange={setOpen}
            width={350}
            title="编辑"
            layout={"horizontal"}
            submitter={{
                submitButtonProps: {
                    color: "default",
                    variant: "solid",
                },
                resetButtonProps: {}
            }}
            initialValues={{
                name: editAppInfo?.name,
                parentId: editAppInfo?.parentId,
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
                let data = {
                    name: values.name,
                    parentId: (values as unknown as IApplication)?.parentId ?? null
                }
                const res = await ApplicationApi.edit({...data, id: editAppInfo?.id})
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
            <Form.Item name={["parentId"]} label="目录">
                <TreeSelect<IApplicationTree>
                    showSearch
                    style={{width: '100%'}}
                    dropdownStyle={{maxHeight: 400, overflow: 'auto'}}
                    placeholder="选择夫目录"
                    allowClear
                    treeDefaultExpandAll
                    treeData={treeData}
                />
            </Form.Item>
        </ModalForm>
    </Fragment>
}