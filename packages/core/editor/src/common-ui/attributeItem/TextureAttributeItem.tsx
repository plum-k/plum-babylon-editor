import {Fragment, useMemo, useRef, useState} from "react";
import {Checkbox, Form, type GetProp, theme, type UploadFile, type UploadProps} from "antd";
import {DeleteOutlined, FormOutlined, PlusOutlined} from "@ant-design/icons";
import {BaseItemProps} from "./BaseItemProps";
import {useObjectAttribute} from "../objectAttribute";
import {isNil} from "lodash-es";
import {useItemUpdate} from "./useItemUpdate";
import {useToggle} from "ahooks";
import {CheckboxChangeEvent} from "antd/es/checkbox/Checkbox";

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

export interface TextureAttributeItemProps extends BaseItemProps {
}

export interface TextureAttributeProps extends TextureAttributeItemProps {
    id?: string;
    value?: string;
    onChange?: (value: any) => void;
}

const initPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

export function TextureAttribute(props: TextureAttributeProps) {

    const {useToken: getToken} = theme;
    const {token} = getToken();
    //-------------

    const {id, value, onChange} = props;
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [openFileDialogOnClick, setOpenFileDialogOnClick] = useState(true);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const uploadButton = (
        <button style={{border: 0, background: 'none'}} type="button">
            <PlusOutlined/>
        </button>
    );
    const [previewUrl, setPreviewUrl] = useState(initPng);
    const getBase64 = (file: FileType): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };
    const handleChange: UploadProps['onChange'] = (data) => {
        // setFileList(fileList);
        console.log(data.file.originFileObj)
        // console.log(fileList)
        // console.log()
        // fileList[0]
        console.log(URL.createObjectURL(data.file.originFileObj))
        setPreviewUrl(URL.createObjectURL(data.file.originFileObj));
        setFileList([1])
        setOpenFileDialogOnClick(false)
    }
    const redoClick = () => {
        setOpenFileDialogOnClick(true)
    }
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }
    const remove = () => {
        setFileList([])
        setPreviewUrl(initPng);
        onChange!("")
    }
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {files} = e.target;
        console.log(files)
        // setFileList(files as FileList)
        setPreviewUrl(URL.createObjectURL(files![0]));
        onChange!(URL.createObjectURL(files![0]))
    };
    const clickImg = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }
    const edit = () => {

    }
    // 选项开始
    const object = useObjectAttribute();
    const CheckboxChange = (value: CheckboxChangeEvent) => {
        // if (isNil(selectObject3D)) {
        //     return
        // }
        // const {target} = value;
        // const {checked} = target;
        // if (checked) {
        //     const texture = ThreeTool.getTextureFromBase64(ImageSrc);
        //     viewer?.editor.setMaterialMapExecute(selectObject3D, name, texture);
        // } else {
        //     viewer?.editor.setMaterialMapExecute(selectObject3D, name, null,);
        // }
        toggle()
    }

    const [checked, {toggle, setLeft, setRight}] = useToggle(false);

    const ImageSrc = useMemo(() => {
        if (value === initPng) {
            setLeft()
        } else {
            setRight();
        }
        if (!isNil(value)) {
            return value;
        }
        return initPng
    }, [value])

    return (
        <div id={id} style={{display: "flex", alignItems: "center", gap: "5px"}}>
            <Checkbox checked={checked} onChange={CheckboxChange}></Checkbox>
            <input
                type="file"
                ref={fileInputRef}
                style={{display: "none"}}
                onChange={onFileChange}
            >
            </input>
            <img
                style={{
                    // background:  token.
                    borderRadius: token.borderRadius,
                    borderWidth: token.lineWidth,
                    borderStyle: token.lineType,
                    borderColor: token.colorBorder,
                    width: "50px",
                    height: "50px",
                    boxSizing: "border-box",
                }}
                src={ImageSrc} alt={"预览"}
                onClick={clickImg}
            >
            </img>
            <FormOutlined style={{fontSize: "24px"}} onClick={edit}/>
            {/*<RedoOutlined style={{fontSize: "24px"}} onClick={handleFileSelect}/>*/}
            <DeleteOutlined style={{fontSize: "24px"}} onClick={remove}/>
        </div>
    )
}


const TextureAttributeItem: FC<TextureAttributeItemProps> = (props: TextureAttributeItemProps) => {
    const {} = props;

    const object = useObjectAttribute();
    const {isValue} = useItemUpdate(props, {
        convertDataConfig: (value) => {
            console.log(value)
            if (!isNil(value)) {
                // const base64FromTexture = Tool.getBase64FromTexture(value)
                // return base64FromTexture
            }
            return initPng;
        }
    });

    return (
        <Fragment>
            {isValue && <Form.Item {...props}
                                   className={"TextureAttributeItem"}
                                   style={{
                                       height: "50px",
                                   }}
            >
                <TextureAttribute {...props}/>
            </Form.Item>
            }
        </Fragment>
    )
}
