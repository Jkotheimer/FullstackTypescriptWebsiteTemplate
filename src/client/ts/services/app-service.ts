import HttpClient from '@client/utils/http-client';
import JsonApiException from '@client/models/json-api-exception';
import { JsonApiPayload } from 'jsonapi-types';
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
     * @returns {Promise<JsonApiPayload>}
     */
    public async login(formData: LoginForm): Promise<JsonApiPayload> {
        const response = await this.client.post('/v1/api/login', {
            username: formData.username,
            password: formData.password
        });
        return this.handle(response);
    }

    /**
     * @description Check if the response is ok. If it is, return the body as a JsonApiPayload. If not, throw a JsonApiException
     * @param response The response to process
     * @returns {Promise<JsonApiPayload>}
     */
    private async handle(response: Response): Promise<JsonApiPayload> {
        try {
            if (response.ok) {
                const body: JsonApiPayload = (await response.json()) as JsonApiPayload;
                return body;
            }
            debugger;
            const contentType = response.headers.get('content-type');
            const isJson = contentType === 'applicatiion/json';
            throw new JsonApiException({
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
            if (error instanceof JsonApiException) {
                throw error;
            }
            if (!(error instanceof Error)) {
                throw new JsonApiException({
                    message: 'An unknown error occurred'
                });
            }
            throw new JsonApiException({
                message: error.message
            });
        }
    }
}
