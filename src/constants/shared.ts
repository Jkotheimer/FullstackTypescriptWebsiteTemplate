export default class Constants {
    public static readonly PORT = 8080;
    public static readonly ENCODING_SCHEME = 'base64url';
    public static readonly SESSION_DURATION_SECONDS = 60 * 15;

    public static readonly HEADERS = class {
        public static readonly CLIENT_ID = 'x-application-client-id';
    };

    public static readonly URL = class {
        public static readonly AUTH = '/auth';
        public static readonly LOGIN = this.AUTH + '/login';
        public static readonly LOGOUT = this.AUTH + '/logout';
        public static readonly USER = '/user';
    };

    public static readonly DB = class {
        public static readonly BOOLEAN_TYPE = 'tinyint(1)';
    };

    public static readonly CRYPTO = class {
        public static readonly HASH_SALT_ROUNDS = 13;
        public static readonly JWT_ALGORITHM = 'hmacSHA512';
    };

    public static readonly HTTP_STATUS_CODES = class {
        public static readonly OK = 200;
        public static readonly CREATED = 201;
        public static readonly BAD_REQUEST = 400;
        public static readonly UNAUTHORIZED = 401;
        public static readonly FORBIDDEN = 403;
        public static readonly NOT_FOUND = 404;
        public static readonly CONFLICT = 409;
        public static readonly THROTTLED = 429;
        public static readonly INTERNAL_SERVER_ERROR = 500;
    };

    public static readonly ERROR_CODES = class {
        public static readonly INVALID_API_VERSION = 'INVALID_API_VERSION';
        public static readonly UNAUTHORIZED = 'UNAUTHORIZED';
        public static readonly BAD_REQUEST = 'BAD_REQUEST';
        public static readonly NOT_FOUND = 'NOT_FOUND';
        public static readonly CONFLICT = 'CONFLICT';
        public static readonly THROTTLED = 'THROTTLED';
        public static readonly INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR';
    };

    public static readonly ERROR_MESSAGES = class {
        public static readonly UNEXPECTED = 'An unexpected error occurred.';
        public static readonly INVALID_API_VERSION = 'Invalid API Version: {0}.';
        public static readonly INVALID_FIELDS = 'Invalid field{0}: [ {1} ]';
        public static readonly INVALID_PAYLOAD = 'Invalid payload.';
        public static readonly INVALID_CLIENT_ID =
            'Invalid client detected. Please use an authorized client application.';
        public static readonly INVALID_USER_CREDENTIALS =
            'Invalid email/password. Please check your credentials and try again.';
        public static readonly USER_ALREADY_HAS_ID = 'This User already has an Id.';
        public static readonly USER_ALREADY_EXISTS = 'A user with the provided email already exists.';
        public static readonly USER_NOT_FOUND = 'Unable to find a user with the provided {0}: {1}';
        public static readonly REQUIRED_FIELDS_MISSING = 'Missing required field{0}: {1}';
        public static readonly SESSION_NOT_FOUND = 'Session id not found.';
        public static readonly CANNOT_DELETE_RECORD_WITHOUT_ID = 'Cannot delete a record that does not have an Id.';
        public static readonly CANNOT_UPDATE_RECORD_WITHOUT_ID = 'Cannot update a record that does not have an Id.';
    };

    public static readonly MYSQL_ERROR_CODES = class {
        public static readonly ER_UNKNOWN = 'ER_UNKNOWN';
        public static readonly ER_DUP_ENTRY = 'ER_DUP_ENTRY';
    };
}
