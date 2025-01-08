import {theme} from "antd";

const {useToken: getToken} = theme;

const useToken = () => {
    const {token} = getToken();

    return token;
}


export {useToken};
