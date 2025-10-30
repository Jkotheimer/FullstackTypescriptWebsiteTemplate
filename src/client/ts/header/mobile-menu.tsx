import * as React from 'react';

// Utils
import { subscribe, unsubscribe } from '@client/events/pub-sub';

// Types
import type { Header as HeaderProps, NavMenuHandle } from 'types/header';
import { DirectoryNode, NavNode } from 'types/nav';

function MobileMenu(props: HeaderProps, ref: React.ForwardedRef<NavMenuHandle>): React.JSX.Element {
    /**
     * ----------------------------------------
     * -------------- STATE -------------------
     * ----------------------------------------
     */

    const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false);
    const [menuItems, setMenuItems] = React.useState<Array<NavNode>>(props.menuItems);
    const [overrideMenuComponent, setMenuComponent] = React.useState<React.JSX.Element | null>(null);
    const [widgetComponent, setWidgetComponent] = React.useState<React.JSX.Element | null>(null);

    /**
     * ----------------------------------------
     * ------------ EVENT HANDLERS ------------
     * ----------------------------------------
     */

    const handleClickMobileMenuButton = () => {
        setShowMobileMenu(true);
        document.body.classList.add('no-scroll');
    };

    const handleClickCloseMobileMenu = () => {
        setShowMobileMenu(false);
        document.body.classList.remove('no-scroll');
    };

    const handleClickMenuItem = (event: React.MouseEvent<HTMLButtonElement | HTMLLIElement>) => {
        const isLink = event.currentTarget.getAttribute('data-is-link') === 'true';
        if (isLink) {
            const href = event.currentTarget.getAttribute('data-href');
            if (href) {
                window.open(href, '_self');
            } else {
                window.open('/', '_self');
            }
        }
    };

    /**
     * ----------------------------------------
     * ---------- EFFECTS & HANDLES -----------
     * ----------------------------------------
     */

    React.useEffect(() => setMenuItems(props.menuItems), [props.menuItems]);
    React.useEffect(() => {
        subscribe('header:mobile:menu:cmp', setMenuComponent);
        subscribe('header:mobile:menu:close', handleClickCloseMobileMenu);
        subscribe('header:mobile:widget:cmp', setWidgetComponent);
        return () => {
            unsubscribe('header:mobile:menu:cmp', setMenuComponent);
            unsubscribe('header:mobile:menu:close', handleClickCloseMobileMenu);
            unsubscribe('header:mobile:widget:cmp', setWidgetComponent);
        };
    }, []);

    React.useEffect(() => {
        // Remove 'no-scroll' class whenever showMobileMenu is set to false
        if (!showMobileMenu) {
            document.body.classList.remove('no-scroll');
        }
    }, [showMobileMenu]);

    React.useEffect(() => {
        const debounce = (fn: (...args: any[]) => void, delay: number) => {
            let timeoutId: ReturnType<typeof setTimeout>; // Correctly type timeoutId
            return (...args: any[]) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn(...args), delay);
            };
        };

        const handleResize = debounce(() => {
            if (window.innerWidth > 990) {
                setShowMobileMenu(false);
                document.body.classList.remove('no-scroll');
            }
        }, 100);

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // The handle currently does nothing, but if we needed to expose api methods, we would do that here
    React.useImperativeHandle(ref, () => ({}));

    /**
     * ----------------------------------------
     * ------------ RENDERING -----------------
     * ----------------------------------------
     */

    const renderMenuItems = (items: Array<NavNode>): React.JSX.Element => {
        return (
            <React.Fragment>
                {items.map((menuItem) => {
                    let children: Array<React.JSX.Element> = [];
                    if (menuItem.type === 'd') {
                        children = (menuItem as DirectoryNode).nodes.map((child) => (
                            <li
                                key={child.id}
                                className='list-group-item d-flex justify-content-between align-items-center border-0'
                                data-path={child.path}
                                data-is-link
                                onClick={handleClickMenuItem}
                            >
                                {child.icon && (
                                    <div className='row'>
                                        <div className='col-auto me-2'>
                                            <img src={child.icon} alt={child.label} />
                                        </div>
                                    </div>
                                )}
                                <div className='col'>
                                    <h5>{child.label}</h5>
                                    {child.description && <p>{child.description}</p>}
                                </div>
                            </li>
                        ));
                    }

                    const hasChildren = children.length > 0;

                    return (
                        <div key={menuItem.id} className='accordion-item'>
                            <h2 className='accordion-header' title={menuItem.label}>
                                <button
                                    className={`accordion-button collapsed ${hasChildren ? '' : 'no-children'}`}
                                    type='button'
                                    data-bs-toggle='collapse'
                                    data-bs-target={`#accordion-${menuItem.id}`}
                                    data-path={menuItem.path}
                                    data-is-link={!hasChildren}
                                    aria-expanded='false'
                                    aria-controls={`accordion-${menuItem.id}`}
                                    onClick={handleClickMenuItem}
                                >
                                    {menuItem.label}
                                </button>
                            </h2>
                            {hasChildren && (
                                <div
                                    id={`accordion-${menuItem.id}`}
                                    className='accordion-collapse collapse'
                                    data-bs-parent='#mobile-nav-accordion'
                                >
                                    <div className='accordion-body'>
                                        <ul className='list-group m-0'>{children}</ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </React.Fragment>
        );
    };

    return (
        <React.Fragment>
            <div id='mobile-site-navigation' className='col'>
                <div className='row float-end pe-3'>
                    {widgetComponent && <div className='col-auto'>{widgetComponent}</div>}
                    <button type='button' className='btn btn-light col-auto' onClick={handleClickMobileMenuButton}>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='16'
                            height='16'
                            fill='currentColor'
                            className='bi bi-list'
                            viewBox='0 0 16 16'
                        >
                            <path
                                fillRule='evenodd'
                                d='M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5'
                            ></path>
                        </svg>
                    </button>
                </div>
                {showMobileMenu && (
                    <div id='mobile-site-navigation-panel'>
                        <div className='panel-container p-3 h-100 overflow-auto'>
                            <div className='test-header'>
                                <div className='row'>
                                    <div className='col_logo col'>
                                        <a href='/' className='custom-logo-link' rel='home'>
                                            <img className='custom-logo' src={props.logoUrl} alt='Logo' />
                                        </a>
                                    </div>
                                    <div className='col-auto'>
                                        <button
                                            id='close-mobile-panel'
                                            type='button'
                                            className='btn-close'
                                            aria-label='Close'
                                            onClick={handleClickCloseMobileMenu}
                                        ></button>
                                    </div>
                                </div>
                            </div>
                            <div className='accordion-container'>
                                {overrideMenuComponent || (
                                    <div className='accordion accordion-flush border-top' id='mobile-nav-accordion'>
                                        {renderMenuItems(menuItems)}
                                    </div>
                                )}
                            </div>
                            <div className='test-footer text-center'>
                                <div className='row g-2 text-align-center'>
                                    <div className='col-12'>
                                        <a
                                            role='button'
                                            className='btn btn-primary text-white text-decoration-none m-4'
                                            href={props.urls.github}
                                        >
                                            Github
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </React.Fragment>
    );
}

export default React.forwardRef(MobileMenu);
