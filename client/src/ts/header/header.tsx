import 'bootstrap';
import * as React from 'react';

// Page Components
import DesktopMenu from '@app/header/desktop-menu';
import MobileMenu from '@app/header/mobile-menu';

// Utils
import BrowserUtils from '@app/utils/browser';
import { publish } from '@app/events/pub-sub';

// Types
import type { Header as HeaderProps } from 'types/header';

export default function Header(props: HeaderProps): React.JSX.Element {
    /**
     * ----------------------------------------
     * -------------- STATE -------------------
     * ----------------------------------------
     */

    const [logoHref, setLogoHref] = React.useState<string>(window.origin);
    const [isMobile, setIsMobile] = React.useState<boolean>(
        BrowserUtils.isMobileBrowser() || BrowserUtils.isMobileScreenSize()
    );

    /**
     * ----------------------------------------
     * ------------ EVENT HANDLERS ------------
     * ----------------------------------------
     */

    const checkForMobileWindow = () => {
        const isMobileWindow = BrowserUtils.isMobileBrowser() || BrowserUtils.isMobileScreenSize();
        setIsMobile(isMobileWindow);
        publish('ismobile', isMobileWindow);
    };

    /**
     * ----------------------------------------
     * --------------- EFFECTS ----------------
     * ----------------------------------------
     */

    React.useEffect(() => {
        checkForMobileWindow();
        setLogoHref('/favicon.ico');
        window.addEventListener('resize', checkForMobileWindow);
        return () => {
            window.removeEventListener('resize', checkForMobileWindow);
        };
    }, []);

    return (
        <div className='container pt-4 pb-4'>
            <div className='row align-items-center'>
                <div className='col-auto  ps-3 ps-sm-2'>
                    <div className='site-header__logo'>
                        <a href={logoHref} className='custom-logo-link' rel='home'>
                            <img className='custom-logo' src={props.logoUrl} alt='Logo' />
                        </a>
                    </div>
                </div>
                {isMobile ? <MobileMenu {...props} /> : <DesktopMenu {...props} />}
            </div>
        </div>
    );
}
