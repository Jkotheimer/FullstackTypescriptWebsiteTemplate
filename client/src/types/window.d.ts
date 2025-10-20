import { Header } from 'types/header';

export default interface AppWindow extends Window {
    AppData: WindowData;
}

export interface WindowData {
    header: Header;
}
