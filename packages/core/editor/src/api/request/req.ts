import {Request} from "./Request";
import {ApiRes, IRequestError} from "./interface";

const req = new Request({
    baseURL: import.meta.env.VITE_SERVER as string
})

req.axiosInstance.interceptors.request.use(
    value => {
        return value;
    },
);
req.axiosInstance.interceptors.response.use(
    response => {
        return response;
    },
    (error: IRequestError<ApiRes>) => {
        if (error.message === 'Network Error') {
            // msgErr('网络错误,请稍后再试!');
        }
        console.log(error)
        console.log(error.response.status)
        switch (error.response.status) {
            case 400:
                // msgErr(error.response.data.message);
                break;
            case 401:
                window.location.href = "/login"
                break;
            case 403:
                console.log('403')
                break;
            case 404:
                console.log('404')
                // msgErr(error.response.data.message);
                break;
            case 500:
                console.log('500')
                break;
        }
        return Promise.reject(error)
    }
);

export {
    req
}