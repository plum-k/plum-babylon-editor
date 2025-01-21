import OSS from "ali-oss";

export interface IOssApiOptions {
    // 授权地址
    server: string;
    // 区域
    region: string
    // bucket
    bucket: string;
}

export default class OSSApi {
    // 客户端
    client!: OSS;
    // 配置
    options: IOssApiOptions;
    // 是否初始化
    isInit = false;
    credentials: any | null = null;

    constructor(options: IOssApiOptions) {
        this.options = Object.assign({}, options);
    }

    /**
     * 创建 OSS 实例
     * @param options
     */
    static async create(options: IOssApiOptions): Promise<OSSApi> {
        return new Promise<OSSApi>((resolve) => {
            const OssApi = new OSSApi(options);
            OssApi.initClient();
            resolve(OssApi);
        });
    }

    /**
     * 获取凭证
     */
    async getCredentials() {
        const response = await fetch(`${this.options.server}`, {
            method: "GET",
        })
        this.credentials = await response.json();
        return await response.json();
    }

    async initClient() {
        if (this.isInit) {
            return;
        }
        await this.getCredentials();
        this.client = new OSS({
            // yourRegion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
            region: this.options.region,
            // 从STS服务获取的临时访问密钥（AccessKey ID和AccessKey Secret）。
            accessKeyId: this.credentials.accessKeyId,
            accessKeySecret: this.credentials.accessKeySecret,
            // 从STS服务获取的安全令牌（SecurityToken）。
            stsToken: this.credentials.stsToken,
            refreshSTSToken: async () => {
                // 向您搭建的STS服务获取临时访问凭证。
                const info = this.getCredentials();

                return {
                    accessKeyId: info.accessKeyId,
                    accessKeySecret: info.accessKeySecret,
                    stsToken: info.stsToken
                }
            },
            // 刷新临时访问凭证的时间间隔，单位为毫秒。
            refreshSTSTokenInterval: 300000,
            // 填写Bucket名称。
            bucket: this.options.bucket
        });
        this.isInit = true;
    }

    /**
     * 判断临时凭证是否到期。
     **/
    isCredentialsExpired() {
        if (!this.credentials) {
            return true;
        }
        const expireDate = new Date(this.credentials.Expiration);
        const now = new Date();
        // 如果有效期不足一分钟，视为过期。
        return expireDate.getTime() - now.getTime() <= 60000;
    }

    /**
     * 上传文件
     */
    async put(name: string, file: any, options?: OSS.PutObjectOptions): Promise<OSS.PutObjectResult> {
        return await this.client.put(name, file, options);
    }

    // 组装路径
    // let list: Array<IFolder> = []
    // let list = []
    // const {Contents, CommonPrefixes} = data;
    // for (let i = 0; i < CommonPrefixes.length; i++) {
    //     const CommonPrefixe = CommonPrefixes[i];
    //     let node = {
    //         name: CommonPrefixe.Prefix,
    //         type: EFolder.FOLDER
    //     }
    //     list.push(node);
    // }
    // for (let i = 0; i < Contents.length; i++) {
    //     const Content = Contents[i];
    //     let node = {
    //         name: Content.Key,
    //         type: EFolder.FILE
    //     }
    //     list.push(node);
    // }
    /**
     * 获取文件夹
     * @param prefix
     * @param delimiter
     */
    async list(prefix: string, delimiter: string) {
        let result = await this.client.list({
            prefix: prefix,
            delimiter: delimiter,
            "max-keys": 1000,
        }, {timeout: 10000});

        result.prefixes.forEach(function (subDir) {
            console.log("SubDir: %s", subDir);
        });
        result.objects.forEach(function (obj) {
            console.log("Object: %s", obj.name);
        });
        return result;
    }

    /**
     * 对象是否存在
     */
    async head(name: string, options?: OSS.HeadObjectOptions) {
        try {
            await this.client.head(name, options);
            return true;
        } catch (error) {
            if (Reflect.get(error as object, "code") === "NoSuchKey") {
                console.log("文件不存在");
                return false;
            }
        }
        return false;
    }

    /**
     * 获取对象
     */
    async getObject(name: string, options?: OSS.SignatureUrlOptions,) {
        const url = this.signatureUrl(name, options);
        return await fetch(url).then(res => res.blob());
    }

    /**
     * 获取对象链接
     */
    signatureUrl(name: string, options?: OSS.SignatureUrlOptions,): string {
        // 填写Object完整路径。Object完整路径中不能包含Bucket名称。
        return this.client.signatureUrl(name, options);
    }
}