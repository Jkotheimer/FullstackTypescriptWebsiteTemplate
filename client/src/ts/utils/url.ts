import HttpClient from '@app/utils/http-client';

const ASSETS_PATH = '/static';

export default class URLUtils {
    private static imageCache: { [key: string]: string } = {};
    private static imagePromiseQueue: { [key: string]: Promise<string> } = {};

    public static getImageUrl(imageName: string): string {
        return `${window.location.origin}${ASSETS_PATH}/images/${imageName}`;
    }

    public static async getImageContent(imageName: string): Promise<string> {
        if (URLUtils.imageCache.hasOwnProperty(imageName)) {
            return URLUtils.imageCache[imageName];
        }
        if (URLUtils.imagePromiseQueue.hasOwnProperty(imageName)) {
            return await URLUtils.imagePromiseQueue[imageName];
        }
        const imageUrl = `${ASSETS_PATH}/images/${imageName}`;
        const promise = new Promise<string>(async (resolve, reject) => {
            try {
                const response = await new HttpClient(window.location.origin).get(imageUrl);
                if (response.status !== 200) {
                    reject(response);
                }
                const imageText = await response.text();
                resolve(imageText);
            } catch (error) {
                reject(error);
            }
        });
        URLUtils.imagePromiseQueue[imageName] = promise;
        return await promise;
    }
}
