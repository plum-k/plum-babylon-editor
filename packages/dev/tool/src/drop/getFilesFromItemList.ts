// 定义函数getFilesFromItemList，用于从DataTransferItemList中获取文件相关信息
// 参数items是要处理的DataTransferItemList对象，包含了拖放操作等传递过来的文件或目录相关条目
// 参数onDone是一个回调函数，当所有文件处理完成后会被调用，接收处理后的文件数组和文件映射作为参数
export default function getFilesFromItemList(items: DataTransferItemList, onDone: (files: Array<File>, filesMap: Map<string, File>) => void) {
    // 用于记录已经处理完成的条目数量
    let itemsCount = 0;
    // 用于记录总的条目数量
    let itemsTotal = 0;

    // 用于存储获取到的文件数组
    const files: Array<File> = [];
    // 用于存储文件路径到文件对象的映射，方便根据路径快速查找文件
    const filesMap = new Map<string, File>();

    // 定义函数onEntryHandled，用于在处理完一个条目后更新已处理条目数量，并在所有条目处理完成时调用onDone回调函数
    const onEntryHandled = () => {
        // 已处理条目数量加1
        itemsCount++;
        // 如果已处理条目数量等于总条目数量，说明所有条目都已处理完成，调用onDone回调函数传递处理后的文件和文件映射
        if (itemsCount === itemsTotal) {
            onDone(files, filesMap);
        }
    };

    // 定义函数handleEntry，用于处理单个条目（文件或目录）
    const handleEntry = (entry: FileSystemEntry | null) => {
        if (entry === null) {
            return;
        }
        // 如果条目是一个目录
        if (entry.isDirectory) {
            // 创建一个目录读取器对象，用于读取目录中的内容
            const reader = (entry as FileSystemDirectoryEntry).createReader();
            // 使用读取器读取目录中的所有条目，并在读取完成后进行处理
            reader.readEntries((entries) => {
                // 遍历读取到的每个条目
                for (let i = 0; i < entries.length; i++) {
                    // 递归调用handleEntry函数处理每个子条目
                    handleEntry(entries[i]);
                }
                // 处理完当前目录下的所有条目后，调用onEntryHandled函数更新处理状态
                onEntryHandled();
            });
        } else if (entry.isFile) {
            // 如果条目是一个文件
            // 通过entry.file方法获取文件对象，并在获取到文件后进行处理
            (entry as FileSystemFileEntry).file((file) => {
                // 将获取到的文件添加到files数组中
                files.push(file);
                // 将文件对象添加到filesMap映射中，以文件的相对路径（去掉开头的'/'）作为键，方便后续根据路径查找文件
                filesMap.set(entry.fullPath.slice(1), file);
                // 处理完当前文件后，调用onEntryHandled函数更新处理状态
                onEntryHandled();
            });
        }

        // 更新总的条目数量，无论当前条目是文件还是目录，都需要增加总条目数量
        itemsTotal++;
    };

    // 遍历DataTransferItemList中的每个条目
    for (let i = 0; i < items.length; i++) {
        // 获取当前条目
        const item = items[i];
        // 如果当前条目类型是文件（这里通过kind属性判断，可能是基于特定的拖放或文件操作相关规范）
        if (item.kind === 'file') {
            // 通过webkitGetAsEntry方法获取条目对应的文件或目录入口对象，并调用handleEntry函数进行处理
            handleEntry(item.webkitGetAsEntry());
        }
    }
}