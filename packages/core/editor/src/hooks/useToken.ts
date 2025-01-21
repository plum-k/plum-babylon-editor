import {theme} from "antd";

const {useToken: getToken} = theme;

export function useToken() {
    const {token} = getToken();
    return token;
}

