import * as React from 'react';

// Third party libraries
import purify from 'dompurify';

// Partial components
import NavigationMenu from '@app/pages/frame/navigation-menu';
import Spinner from '@app/components/spinner';

// Events & Toasts
//import Toast from '@app/components/toast';

// Utils
import BrowserUtils from '@app/utils/browser';
import NavUtils from '@app/utils/nav';

// Types & Models
import { NavNode } from 'types/nav';

export interface FrameProps {
    navigationData: Array<NavNode>;
    currentLocation: NavNode;
    htmlContent: string;
}

export default function Frame(props: FrameProps): React.JSX.Element {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */
    const [showSpinner, setShowSpinner] = React.useState<boolean>(false);
    const [htmlContent, setHtmlContent] = React.useState<string>(props.htmlContent);

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */
    const contentContainerRef = React.useRef<HTMLDivElement>(null);
    const navigationMenuRef = React.useRef<HTMLDivElement>(null);
    const currentLocationRef = React.useRef<NavNode>(props.currentLocation);

    /**
     * ------------------------------------------
     * ----------- EVENT HANDLERS ---------------
     * ------------------------------------------
     */

    const handleNavigate = (targetLocation: NavNode): void => {
        setLocation(targetLocation);
    };

    const handleWindowPopState = (event: PopStateEvent) => {
        const targetLocation = NavUtils.findNode(window.location.pathname, props.navigationData);
        if (!targetLocation) {
            return;
        }
        const isCurrentLocation = targetLocation.id === currentLocationRef.current.id;
        // Firefox history.replaceState behaves like pushState, so we need to go back twice to avoid an infinite loop
        if (isCurrentLocation && BrowserUtils.isFirefox()) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            window.history.back();
            window.history.back();
        } else if (targetLocation && !isCurrentLocation) {
            setLocation(targetLocation, true);
        }
    };

    /**
     * ------------------------------------------
     * ----------- HELPER METHODS ---------------
     * ------------------------------------------
     */

    /**
     * @description Set the current article location and update the browser history
     *  The current article is set in the state and the ref because the ref is necessary for callbacks and the state is necessary for rendering
     * @param location The location to set as the current article
     */
    const setLocation = (location: NavNode, replaceState: boolean = false) => {
        setShowSpinner(true);
        currentLocationRef.current = location;
        window.document.title = location.label;
        if (replaceState) {
            window.history.replaceState({}, '', location.path);
        } else {
            window.history.pushState({}, '', location.path);
        }
        setShowSpinner(false);
    };

    /**
     * ------------------------------------------
     * --------------- EFFECTS ------------------
     * ------------------------------------------
     */

    // When the component initially mounts, attach event listeners
    React.useEffect(() => {
        if (!htmlContent) {
            setHtmlContent('<div>Hello, world</div>');
        }
        window.addEventListener('popstate', handleWindowPopState);
        return () => {
            window.removeEventListener('popstate', handleWindowPopState);
        };
    }, []);

    React.useEffect(() => {
        setHtmlContent(props.htmlContent);
    }, [props.htmlContent]);

    /**
     * ------------------------------------------
     * ------------- RENDERING ------------------
     * ------------------------------------------
     */

    return (
        <div className='border-top'>
            <div className='row article-container'>
                <NavigationMenu
                    ref={navigationMenuRef}
                    navigationData={props.navigationData}
                    currentLocation={currentLocationRef.current}
                    onNavigate={handleNavigate}
                />
                <div ref={contentContainerRef} className='col content-container p-0 h-100 longform'>
                    {showSpinner ? (
                        <Spinner relative />
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: purify.sanitize(htmlContent) }}></div>
                    )}
                </div>
            </div>
        </div>
    );
}
