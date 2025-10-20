import HttpClient from '@app/utils/http-client';
import JSONAPIException from '@app/models/json-api-exception';
import { JSONAPIPayload } from 'types/jsonapi';
import LoginForm from 'types/login-form';

export default class AppService {
    private client: HttpClient;

    constructor() {
        this.client = new HttpClient(window.location.protocol + '//' + window.location.hostname);
    }

    public setCSRFToken(token: string): void {
        this.client.setHeader('X-CSRF-Token', token);
    }

    /**
     * @description Attempt User login
     * @param {LoginForm} formData
     * @returns {Promise<JSONAPIPayload>}
     */
    public async login(formData: LoginForm): Promise<JSONAPIPayload> {
        const response = await this.client.post('/v1/api/login', {
            username: formData.username,
            password: formData.password
        });
        return this.handle(response);
    }

    /**
     * @description Check if the response is ok. If it is, return the body as a JSONAPIPayload. If not, throw a JSONAPIException
     * @param response The response to process
     * @returns {Promise<JSONAPIPayload>}
     */
    private async handle(response: Response): Promise<JSONAPIPayload> {
        try {
            if (response.ok) {
                const body: JSONAPIPayload = (await response.json()) as JSONAPIPayload;
                return body;
            }
            debugger;
            const contentType = response.headers.get('content-type');
            const isJson = contentType === 'applicatiion/json';
            throw new JSONAPIException({
                message: `Callout failed with status: ${response.statusText} (${response.status})`,
                errors: [
                    {
                        title: response.statusText,
                        status: response.statusText,
                        code: response.status.toString(),
                        detail: await (isJson ? response.json() : response.text())
                    }
                ]
            });
        } catch (error) {
            console.error(error);
            if (error instanceof JSONAPIException) {
                throw error;
            }
            if (!(error instanceof Error)) {
                throw new JSONAPIException({
                    message: 'An unknown error occurred'
                });
            }
            throw new JSONAPIException({
                message: error.message
            });
        }
    }
}
