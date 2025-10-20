import * as React from 'react';
import ReactUtils from '@app/utils/react';

// Components
import Header from '@app/header/header';

// Utils
import Toast from '@app/components/toast';

// Types
import AppWindow from 'types/window';
declare const window: AppWindow;

// Display any toasts that were stored in the cookies when the page was last loaded
Toast.showStoredToasts();

// Ensure that the page always scrolls to the top when it is loaded or reloaded
history.scrollRestoration = 'manual';
const scrollY = window.scrollY;
const handleLoad = () => {
    if (window.scrollY === scrollY) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    window.removeEventListener('load', handleLoad);
};
if (scrollY !== 0) {
    window.addEventListener('load', handleLoad);
}

try {
    const root = ReactUtils.createRoot('masthead');

    root.render(
        <Header
            menuItems={window.AppData.header.menuItems}
            urls={window.AppData.header.urls}
            logoUrl={window.AppData.header.logoUrl}
        />
    );
} catch (error) {
    console.error(error);
}
