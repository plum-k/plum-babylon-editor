import OSS, {Credentials} from "ali-oss";

export interface IOssApiOptions {
    // 授权地址
    server: string;
    // 区域
    region: string
    // bucket
    bucket: string;
}

export class OssApi {
    // 客户端
    client!: OSS;
    // 配置
    options: IOssApiOptions;
    // 是否初始化
    isInit = false;
    credentials!: Credentials

    constructor(options: IOssApiOptions) {
        this.options = Object.assign({}, options);
    }

    /**
     * 创建 OSS 实例
     * @param options
     */
    static async create(options: IOssApiOptions): Promise<OssApi> {
        return new Promise<OssApi>(async (resolve) => {
            const ossApi = new OssApi(options);
            await ossApi.initClient();
            resolve(ossApi);
        });
    }

    /**
     * 获取凭证
     */
    async getCredentials() {
        const response = await fetch(`${this.options.server}/oss`, {
            method: "GET",
        })
        const resJson = await response.json();
        this.credentials = resJson.data;
        return this.credentials as Credentials;
    }

    /**
     * 初始化客户端
     */
    async initClient() {
        if (this.isInit) {
            return;
        }
        await this.getCredentials();
        this.client = new OSS({
            // yourRegion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
            region: this.options.region,
            // 从STS服务获取的临时访问密钥（AccessKey ID和AccessKey Secret）。
            accessKeyId: this.credentials.AccessKeyId,
            accessKeySecret: this.credentials.AccessKeySecret,
            // 从STS服务获取的安全令牌（SecurityToken）。
            stsToken: this.credentials.SecurityToken,
            refreshSTSToken: async () => {
                // 向您搭建的STS服务获取临时访问凭证。
                const info = await this.getCredentials();
                return {
                    accessKeyId: info.AccessKeyId,
                    accessKeySecret: info.AccessKeySecret,
                    stsToken: info.SecurityToken
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

    /**
     * 创建目录
     */
    async mkdir(name: string): Promise<OSS.PutObjectResult> {
        return await this.client.put(name, new Blob([]))
    }

    /**
     * 删除目录
     */
    async deleteDir(prefix: string) {
        const handleDel = async (name: string) => {
            try {
                await this.client.delete(name);
            } catch (error) {
                return error;
            }
        }

        const list = await this.client.list({
            prefix: prefix,
        });

        list.objects = list.objects || [];
        const result = await Promise.all(
            list.objects.map((v) => handleDel(v.name))
        );
        console.log(result);
        return result;
    }


    /**
     * 获取文件
     */
    async get(name: string, file: any, options?: OSS.GetObjectOptions): Promise<OSS.GetObjectResult> {
        return await this.client.get(name, file, options);
    }

    /**
     * 获取文件夹
     * @param prefix
     * @param delimiter
     */
    async list(prefix: string, delimiter: string) {
        return await this.client.list({
            prefix: prefix,
            delimiter: delimiter,
            "max-keys": 1000,
        }, {timeout: 10000});
    }

    /**
     * 对象是否存在
     */
    async head(name: string, options?: OSS.HeadObjectOptions) {
        return await this.client.head(name, options);
    }

    /**
     * 获取对象
     */
    async getObject(name: string, options?: OSS.SignatureUrlOptions) {
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