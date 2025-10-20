declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production';
            SERVER_HOST_NAME: string;
            MYSQL_HOST: string;
            MYSQL_DATABASE: string;
            MYSQL_USER: string;
            MYSQL_PASSWORD: string;
            LOG_FILE_PATH: string;
            RECAPTCHA_SITE_KEY: string;
            RECAPTCHA_SECRET_KEY: string;
            JWT_PRIVATE_KEY_FILE: string;
            JWT_PUBLIC_KEY_FILE: string;
        }
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
