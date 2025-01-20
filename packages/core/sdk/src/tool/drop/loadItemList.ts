// 定义函数loadItemList，用于加载给定的DataTransferItemList中的文件信息
// 参数items是要加载的DataTransferItemList，它包含了通过拖放等操作传递过来的文件相关条目
import getFilesFromItemList from "./getFilesFromItemList.ts";
import loadFiles from "./loadFiles.ts";

export default function loadItemList(items: DataTransferItemList, callbackFun: (file: File) => void) {
    // 调用this对象的getFilesFromItemList函数来处理DataTransferItemList中的文件和目录信息
    // 当getFilesFromItemList处理完成后，会通过回调函数将获取到的文件数组和文件映射传递回来
    // 这里将获取到的文件和文件映射作为参数传递给loadFiles函数进行进一步处理
    getFilesFromItemList(items, (files, filesMap) => {
        loadFiles(files, callbackFun, filesMap);
    });
}