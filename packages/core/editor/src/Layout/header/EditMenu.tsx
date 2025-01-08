import {Button, Dropdown} from "antd";
import MenuItem from "./MenuItem.tsx";

export default function EditMenu() {
    const items = [
        {
            key: '撤销',
            label: (
                <MenuItem name={'撤销'} hotKey={'Ctrl Z'}/>
            )
        },
        {
            key: 'mesh',
            label: (
                <MenuItem name={'重做'} hotKey={'Ctrl Y'}/>
            )
        },
        {
            key: '重做历史',
            label: (
                <MenuItem name={'重做历史'}/>
            )
        },
        {
            key: '偏好设置',
            label: (
                <MenuItem name={'偏好设置'} hotKey={'Ctrl ,'}/>
            )
        }
    ];
    return <Dropdown menu={{items}} overlayClassName={'plum-menu-dropDown'} placement="bottomLeft">
        <Button type="text">
            <div className="font-semibold">
                编辑
            </div>
        </Button>
    </Dropdown>
}

