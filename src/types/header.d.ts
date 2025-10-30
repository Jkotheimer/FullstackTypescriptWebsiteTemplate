import { NavNode } from 'types/nav';

export interface Header {
    menuItems: Array<NavNode>;
    urls: Record<string, string>;
    logoUrl: string;
}

export interface NavMenuHandle {}
