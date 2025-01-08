import {message} from 'antd';

const key = 'msg';

const msg = async (msg: string) => {
    await message.success({content: msg, key});
};
const msgErr = async (msg: string) => {
    await message.error({content: msg, key});
};
export {
    msg,
    msgErr,
    key
}
