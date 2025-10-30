import React from 'react';
import * as InternalEvents from '@client/events';

export interface PicklistOptionBaseProps {
    value: string;
    label: string;
    disabled?: boolean;
    selected?: boolean;
}

export interface PicklistOptionProps extends PicklistOptionBaseProps {
    index?: number;
    onSelect: (event: InternalEvents.ChangeEvent) => void;
}

function PicklistOption(props: PicklistOptionProps, ref: React.ForwardedRef<HTMLAnchorElement>): React.JSX.Element {
    /**
     * ------------------------------------------
     * ------------ EVENT HANDLERS --------------
     * ------------------------------------------
     */
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
        event.preventDefault();
        event.stopPropagation();
        if (props.disabled) {
            return;
        }
        props.onSelect(
            new InternalEvents.ChangeEvent({
                detail: {
                    value: props.value,
                    label: props.label
                }
            })
        );
    };

    const classList = ['dropdown-item', 'text-decoration-none', 'text-reset'];
    if (props.disabled) {
        classList.push('disabled');
    }

    const label: React.JSX.Element = (
        <>
            {props.label}
            {!props.disabled && props.selected && <span className='float-end'>&#x2713;</span>}
        </>
    );

    return (
        <a
            ref={ref}
            href='#'
            role='menuitem'
            className={classList.join(' ')}
            aria-current={props.selected}
            aria-disabled={props.disabled}
            onClick={handleClick}
        >
            {label}
        </a>
    );
}

export default React.forwardRef(PicklistOption);
