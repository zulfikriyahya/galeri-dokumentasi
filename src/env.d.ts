interface ImportMetaEnv {
    readonly IMMICH_BASE_URL: string;
    readonly IMMICH_API_KEY: string;
    readonly SITE_NAME: string;
    readonly SITE_SHORT_NAME: string;
    readonly SITE_DESCRIPTION: string;
    readonly ORG_NAME: string;
    readonly SCHOOL_NAME: string;
    readonly POWERED_BY: string;
    readonly POWERED_BY_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}