import 'bootstrap';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

// Page Components
import Frame from '@app/pages/frame/frame';

// Utilities
import * as EventUtils from '@app/events/utils';

// Types
import AppWindow, { WindowData } from 'types/window';
import { NavNode } from 'types/nav';

export interface FrameWindow extends AppWindow {
    AppData: WindowData & {
        navigationData: Array<NavNode>;
        currentLocation: NavNode;
        htmlContent: string;
    };
}

declare const window: FrameWindow;

try {
    const rootElement = document.getElementById('help-article');
    if (null == rootElement) {
        throw new Error('No help-article element');
    }
    const root = createRoot(rootElement);

    document.body.style.overflowY = 'hidden';

    // Render the ContactSales form component
    root.render(
        <Frame
            navigationData={window.AppData.navigationData}
            htmlContent={window.AppData.htmlContent}
            currentLocation={window.AppData.currentLocation}
        />
    );

    // Prevent the page from scrolling down when the space key is pressed
    window.addEventListener('keydown', function (e: Event) {
        if (EventUtils.isSpaceKeyPress(e as unknown as React.KeyboardEvent) && e.target == document.body) {
            e.preventDefault();
        }
    });
} catch (error) {
    console.error(error);
}
