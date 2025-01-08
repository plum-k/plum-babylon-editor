// 定义函数loadFiles，用于加载给定的文件数组以及可选的文件映射中的文件信息
// 参数files是要加载的文件数组，每个元素都是一个File对象
// 参数filesMap是一个可选的文件路径到文件对象的映射，用于更方便地根据路径查找文件
export default function loadFiles(files: Array<File>, callbackFun: (file: File) => void, filesMap?: Map<string, File>) {
    // 定义内部函数getMap，用于创建一个以文件名称为键，文件对象为值的新映射
    const getMap = () => {
        // 创建一个新的空映射
        const map = new Map<string, File>();
        // 遍历给定的文件数组
        for (let i = 0; i < files.length; i++) {
            // 获取当前遍历到的文件对象
            const file = files[i];
            // 将文件的名称作为键，文件对象本身作为值，添加到映射map中
            map.set(file.name, file);
        }
        // 返回创建好的映射
        return map;
    }

    // 如果给定的文件数组长度大于0，说明有文件需要处理
    if (files.length > 0) {
        // 如果传入了filesMap参数，则使用传入的文件映射；否则调用getMap函数创建一个新的文件映射
        const map = filesMap ?? getMap();
        // 打印当前的文件映射，这里可能是用于调试目的，查看文件映射的内容
        console.log(map);
        // 遍历文件映射中的每个键值对
        for (const [value, mapElement] of map) {
            // 调用this对象的loadFile函数来加载当前遍历到的文件对象
            callbackFun(mapElement);
        }
    }
}