import { createRoot } from 'react-dom/client';

export default class ReactUtils {
    public static createRoot(id: string) {
        const rootElement = document.getElementById(id);
        if (null == rootElement) {
            throw new Error(`No element with ID ${id} found`);
        }
        return createRoot(rootElement);
    }
}
