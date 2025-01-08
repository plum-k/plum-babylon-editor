/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_BUCKET: string;
    readonly VITE_REGION: string;
    readonly VITE_SECRETID: string;
    readonly VITE_SECRETKEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
