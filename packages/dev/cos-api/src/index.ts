import COS, {BucketParams, type COSOptions, type onProgress} from "cos-js-sdk-v5";

export interface ICOSApiOptions {
    bucketParams: BucketParams
    COSOptions: COSOptions;
}

export default class COSApi {

    bucketParams: BucketParams = {
        Bucket: "",
        Region: "",
    }
    private cos: COS;

    constructor(options: ICOSApiOptions) {
        this.bucketParams = Object.assign({}, options.bucketParams)
        this.cos = new COS(options.COSOptions);
    }

    uploadFile(value: {
        Body?: any,
        Key: string;
        onProgress?: onProgress;
    }): Promise<COS.UploadFileResult> {
        const {Body, Key} = value
        return this.cos.uploadFile({
            ...this.bucketParams,
            Key: Key,
            Body: Body,
            onProgress: value.onProgress
        })
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
    getBucket(value: {
        Prefix: string,
        // "/"
        Delimiter: string
    }) {
        const {Prefix, Delimiter} = value
        return this.cos.getBucket({
            ...this.bucketParams,
            Prefix: Prefix,
            Delimiter: Delimiter
        })
    }

    // 对象是否存在
    headObject(Key: string) {
        return this.cos.headObject({
            ...this.bucketParams,
            Key: Key,
        });
    }

    getObject(params: Partial<COS.GetObjectParams>) {
        return this.cos.getObject(<COS.GetObjectParams>{
            ...this.bucketParams,
            ...params
        });
    }


    getObjectUrl(Key: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.cos.getObjectUrl(
                {
                    ...this.bucketParams,
                    Key: Key,
                },
                (err, data) => {
                    if (err) return console.log(err);
                    const url = data.Url;
                    resolve(url);
                }
            );
        })
    }
}