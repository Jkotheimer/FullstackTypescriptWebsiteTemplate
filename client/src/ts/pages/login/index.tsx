import 'bootstrap';
import * as React from 'react';

// Page Components
import LoginForm from '@app/pages/login/login-form';

// Utils
import ReactUtils from '@app/utils/react';
import * as EventUtils from '@app/events/utils';

// Utilities
import BrowserUtils from '@app/utils/browser';

try {
    // Get the slot where the form needs to go, and ensure it exists
    const root = ReactUtils.createRoot('root');

    const csrfToken = BrowserUtils.getCookie('csrftoken') ?? 'tmp';

    // Render the ContactSales form component
    root.render(<LoginForm csrfToken={csrfToken} />);

    // Prevent the page from scrolling down when the space key is pressed
    window.addEventListener('keydown', function (e: Event) {
        if (EventUtils.isSpaceKeyPress(e as unknown as React.KeyboardEvent) && e.target == document.body) {
            e.preventDefault();
        }
    });
} catch (error) {
    console.error(error);
}
