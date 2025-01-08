import {FC, Fragment, useRef, useState} from "react";
import {type GetProp, type UploadFile, type UploadProps} from "antd";
import {DeleteOutlined, PlusOutlined, RedoOutlined} from "@ant-design/icons";

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

export interface AttributeImageProps {
    id?: string;
    value?: string;
    onChange?: (value: any) => void;
}

const initPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

const AttributeImage: FC = (props: AttributeImageProps) => {
    const {id, value = {}, onChange} = props;
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
        // onChange!(files)
        onChange!(URL.createObjectURL(files![0]))
    };

    return (
        <Fragment>
            <div id={id} style={{display: "flex", alignItems: "center", gap: "5px"}}>
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{display: "none"}}
                    onChange={onFileChange}
                >
                </input>
                <img
                    style={{
                        width: "50px", height: "50px",
                        border: "2px solid white",
                        boxSizing: "border-box",
                    }}
                    src={previewUrl} alt={"预览"}>
                </img>
                <RedoOutlined style={{fontSize: "24px"}} onClick={handleFileSelect}/>
                <DeleteOutlined style={{fontSize: "24px"}} onClick={remove}/>
            </div>
        </Fragment>
    )
}

export default AttributeImage;
