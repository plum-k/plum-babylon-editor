export async function importMultipleModules(modulePaths: string[]) {
    const importPromises = modulePaths.map(async (modulePath) => {
        try {
            const module = await import(modulePath);
            return module;
        } catch (error) {
            console.error(`Failed to import ${modulePath}:`, error);
            return null;
        }
    });

    const results = await Promise.all(importPromises);
    return results;
}