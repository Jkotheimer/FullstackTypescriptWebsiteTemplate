declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'staging' | 'production';
            SERVER_HOST_NAME: string;
            MYSQL_HOST: string;
            MYSQL_DATABASE: string;
            MYSQL_USER: string;
            MYSQL_PASSWORD: string;
            LOG_FILE_PATH: string;
            JWT_PRIVATE_KEY_FILE: string;
            JWT_PUBLIC_KEY_FILE: string;
            SESSION_SECRET: string;
        }
    }
}

// Including an export forces the linter to consider this file as an ES module
// so we get type enforcement across the rest of the codebase
export {};
