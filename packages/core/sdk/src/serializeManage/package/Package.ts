import {BasePlum, IBasePlumOptions} from "../../core/BasePlum";

export interface IPlumSceneSerializerOptions extends IBasePlumOptions {
}


/**
 * 序列化和反序列化场景
 */
export abstract class Package extends BasePlum {

    static Type = "plumSceneSerializer";

    protected constructor(options: IPlumSceneSerializerOptions) {
        super(options);
    }

    /**
     * 序列化场景
     */
    abstract pack(): Promise<void>

    /**
     * 反序列化场景
     */
    abstract unpack(blob: Blob): Promise<void>


    /**
     * 加载场景
     */
    abstract loadScene(): void


}



