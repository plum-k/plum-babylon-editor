import * as fs from 'fs';
import * as path from 'path';

function removeNodeModules(dir: string): void {
    // 读取当前目录
    fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
        if (err) {
            console.error(`无法读取目录 ${dir}:`, err);
            return;
        }

        // 遍历所有条目
        entries.forEach(entry => {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // 如果是目录，递归调用
                if (entry.name === 'node_modules') {
                    // 如果找到 node_modules，删除它
                    fs.rm(fullPath, { recursive: true, force: true }, (rmErr) => {
                        if (rmErr) {
                            console.error(`无法删除 ${fullPath}:`, rmErr);
                        } else {
                            console.log(`已删除 ${fullPath}`);
                        }
                    });
                } else {
                    // 递归处理子目录
                    removeNodeModules(fullPath);
                }
            }
        });
    });
}

// 使用当前目录作为起始点
removeNodeModules(process.cwd());