import fs from 'fs';
import path from 'path';

// 遍历目录删除除了.js 文件以外的文件
async function deleteNonJsFiles(dir: string): Promise<void> {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
        const filePath: string = path.join(dir, file);
        const stats = await fs.promises.stat(filePath);
        if (stats.isFile() && path.extname(file)!== '.js') {
            await fs.promises.unlink(filePath);
        } else if (stats.isDirectory()) {
            await deleteNonJsFiles(filePath);
        }
    }
}

// 示例调用
const targetDirectory: string = './libs/@babylonjs'; // 替换为你要拷贝到的目标目录
(async () => {
    try {
        await deleteNonJsFiles(targetDirectory);
    } catch (error) {
        console.error('Error occurred:', error);
    }
})();