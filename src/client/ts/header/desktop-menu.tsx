import * as React from 'react';

import type { Header as HeaderProps, NavMenuHandle } from 'types/header';
import { DirectoryNode, NavNode } from 'types/nav';

const EXTERNAL_LINKS = ['Careers', 'Videos', 'Partner Resources', 'PDO Customer Portal'];

function DesktopMenu(props: HeaderProps, ref: React.ForwardedRef<NavMenuHandle>): React.JSX.Element {
    /**
     * ----------------------------------------
     * -------------- STATE -------------------
     * ----------------------------------------
     */

    const [menuItems, setMenuItems] = React.useState<Array<NavNode>>(props.menuItems);

    /**
     * ----------------------------------------
     * ------------ EVENT HANDLERS ------------
     * ----------------------------------------
     */

    const handleFocusMenuItem = (event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>) => {
        const menuItem = (event.currentTarget.querySelector('ul.sub-menu') ??
            event.currentTarget.closest('ul.submenu')) as HTMLLIElement | null;
        if (menuItem) {
            menuItem.style.left = 'auto';
        }
    };

    const handleBlurMenuItem = (event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>) => {
        const menuItem = (event.currentTarget.querySelector('ul.sub-menu') ??
            event.currentTarget.closest('ul.submenu')) as HTMLLIElement | null;
        if (menuItem) {
            menuItem.style.left = '-999em';
        }
    };

    /**
     * ----------------------------------------
     * ---------- EFFECTS & HANDLES -----------
     * ----------------------------------------
     */

    // The handle currently does nothing, but if we needed to expose api methods, we would do that here
    React.useImperativeHandle(ref, () => ({}));

    React.useEffect(() => setMenuItems(props.menuItems), [props.menuItems]);

    /**
     * ----------------------------------------
     * -------------- RENDERING ---------------
     * ----------------------------------------
     */
    const renderMenuItems = (items: Array<NavNode>): React.JSX.Element => {
        return (
            <React.Fragment>
                {items.map((menuItem) => {
                    let childrenElement: React.JSX.Element = <></>;
                    if (menuItem.type === 'd') {
                        childrenElement = (
                            <ul className='sub-menu'>{renderMenuItems((menuItem as DirectoryNode).nodes)}</ul>
                        );
                    }
                    const itemObjectClass = `menu-item-object-${menuItem.parent ? 'page' : 'custom'}`;
                    const itemHasChildrenClass = menuItem.type === 'd' ? 'menu-item-has-children' : '';
                    const itemCurrentClass =
                        menuItem.path === window.location.pathname ? 'current-menu-item current_page_item' : '';
                    const classList = `menu-item menu-item-${menuItem.id} ${itemObjectClass} ${itemHasChildrenClass} ${itemCurrentClass}`;
                    const isExternalLink = EXTERNAL_LINKS.includes(menuItem.label);
                    const windowTarget = isExternalLink ? '_blank' : '_self';

                    // If the menu item has a parent, render it as a child item
                    let content = <>{menuItem.label}</>;
                    if (menuItem.parent) {
                        content = (
                            <div className='menu-item-content'>
                                {menuItem.icon && (
                                    <div className='menu-item-icon'>
                                        <img src={menuItem.icon} alt={menuItem.description} />
                                    </div>
                                )}
                                <div className='menu-item-details'>
                                    <div className='menu-item-title'>{menuItem.label}</div>
                                    <div className='menu-item-description'>{menuItem.description}</div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <li
                            key={menuItem.id}
                            id={`menu-item-${menuItem.id}`}
                            title={menuItem.label}
                            className={classList}
                            onFocus={handleFocusMenuItem}
                            onMouseEnter={handleFocusMenuItem}
                            onBlur={handleBlurMenuItem}
                            onMouseLeave={handleBlurMenuItem}
                        >
                            <a id={menuItem.id} href={menuItem.path} target={windowTarget} aria-current='page'>
                                {content}
                            </a>
                            {childrenElement}
                        </li>
                    );
                })}
            </React.Fragment>
        );
    };

    return (
        <React.Fragment>
            <div className='col'>
                <nav id='site-navigation' className='ap-header-nav main-navigation'>
                    <div className='menu-menu-1-container'>
                        <ul id='primary-menu' className='menu'>
                            {renderMenuItems(menuItems)}
                        </ul>
                    </div>
                </nav>
            </div>
        </React.Fragment>
    );
}

export default React.forwardRef(DesktopMenu);
