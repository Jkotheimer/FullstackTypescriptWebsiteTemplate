import * as React from 'react';

export function ModalHeader(props: React.PropsWithChildren): React.JSX.Element {
    return <>{props.children}</>;
}

export function ModalContent(props: React.PropsWithChildren): React.JSX.Element {
    return <>{props.children}</>;
}

export function ModalFooter(props: React.PropsWithChildren): React.JSX.Element {
    return <>{props.children}</>;
}

export interface ModalProps extends React.PropsWithChildren {
    id: string;
    title: string;
    cancelLabel?: string;
    onCancel?: () => void;
    confirmLabel?: string;
    onConfirm?: () => void;
}

export interface ModalHandle {
    show: () => void;
    hide: () => void;
    dialog: HTMLDivElement | null;
}

function Modal(props: ModalProps, ref: React.ForwardedRef<ModalHandle>): React.JSX.Element {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */

    const [displayModal, setDisplayModal] = React.useState<boolean>(false);

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */

    const modalRef = React.useRef<HTMLDivElement>(null);

    let headerChildren: Array<React.ReactNode> = [];
    let contentChildren: Array<React.ReactNode> = [];
    let footerChildren: Array<React.ReactNode> = [];
    React.Children.forEach(props.children, (child) => {
        if (!React.isValidElement(child)) {
            return;
        }
        if (child.type === ModalHeader) {
            headerChildren = React.Children.toArray(child.props.children);
        } else if (child.type === ModalContent) {
            contentChildren = React.Children.toArray(child.props.children);
        } else if (child.type === ModalFooter) {
            footerChildren = React.Children.toArray(child.props.children);
        }
    });

    /**
     * ------------------------------------------
     * ------------ EVENT HANDLERS --------------
     * ------------------------------------------
     */

    const handleClickClose = () => {
        hide();
        if (props.onCancel) {
            props.onCancel();
        }
    };

    //const handleClickConfirm = () => {
    //    if (props.onConfirm) {
    //        props.onConfirm();
    //    }
    //};

    const show = () => {
        setDisplayModal(true);
    };

    const hide = () => {
        setDisplayModal(false);
    };

    /**
     * ------------------------------------------
     * -------- API METHODS & EFFECTS -----------
     * ------------------------------------------
     */

    React.useImperativeHandle(ref, () => ({
        show,
        hide,
        dialog: modalRef.current,
    }));

    /**
     * ------------------------------------------
     * -------------- RENDERING -----------------
     * ------------------------------------------
     */

    const containerClassName = `modal fade app-modal-wrapper${displayModal ? ' show' : ''}`;
    const containerStyle = { display: displayModal ? 'block' : 'none' };

    return (
        <div
            id={props.id}
            className={containerClassName}
            style={containerStyle}
            role='dialog'
            tabIndex={-1}
            aria-modal={true}
            aria-labelledby={`${props.id}Label`}
        >
            <div ref={modalRef} className='modal-dialog modal-dialog-scrollable modal-lg'>
                <div className='modal-content'>
                    <div className='modal-header'>
                        <div className='col'>
                            <div>{headerChildren}</div>
                        </div>
                        <div className='col-auto'>
                            <button
                                type='button'
                                className='btn-close'
                                aria-label='Close'
                                onClick={handleClickClose}
                            ></button>
                        </div>
                    </div>
                    {contentChildren.length > 0 && <div className='modal-body border-top'>{contentChildren}</div>}
                    {footerChildren.length > 0 && <div className='modal-footer'>{footerChildren}</div>}
                </div>
            </div>
        </div>
    );
}

export default React.forwardRef(Modal);
