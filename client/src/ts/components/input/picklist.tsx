import React from 'react';
import { Dropdown } from 'bootstrap';
import * as InternalEvents from '@app/events';
import PicklistOption, { PicklistOptionBaseProps } from '@app/components/input/picklist-option';
import { InputLabel, InputSubtext, AbstractInputProps, AbstractInputHandle } from '@app/components/input/peripherals';

export interface PicklistOptionGroup {
    label?: string;
    options: Array<PicklistOptionBaseProps>;
}

export interface PickListProps extends AbstractInputProps {
    options?: Array<PicklistOptionBaseProps>;
    optionGroups?: Array<PicklistOptionGroup>;
}

function Picklist(props: PickListProps, ref: React.ForwardedRef<AbstractInputHandle>): React.JSX.Element {
    const optionGroups = props.optionGroups ?? [];
    if (props.options) {
        optionGroups.unshift({ options: props.options });
    }
    const numOptions = optionGroups.reduce((acc: number, group: PicklistOptionGroup) => acc + group.options.length, 0);
    let dropdown: Dropdown | null = null;

    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */

    const [error, setError] = React.useState<string | undefined>(props.error);
    const [value, setValue] = React.useState<string>(props.value?.toString() ?? '');
    const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */

    const menuItemRefs = new Array<React.RefObject<HTMLAnchorElement>>(numOptions).fill(
        React.useRef<HTMLAnchorElement>(null)
    );
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    /**
     * ------------------------------------------
     * ------------ EVENT HANDLERS --------------
     * ------------------------------------------
     */

    const handleClickMenuBar = (): void => {
        if (isExpanded) {
            hideDropdown();
        } else {
            showDropdown();
        }
    };

    const handleClickGroupHeader = (event: React.MouseEvent<HTMLHRElement>): void => {
        event.preventDefault();
        event.stopPropagation();
        buttonRef.current?.focus();
    };

    const handleSelect = (event: InternalEvents.ChangeEvent): void => {
        select(event.detail.value);
    };

    const handleFocus = (event: React.FocusEvent<HTMLDivElement>): void => {
        if (buttonRef.current && props.onFocus) {
            props.onFocus({
                ...event,
                target: buttonRef.current,
                currentTarget: buttonRef.current
            } as React.FocusEvent<HTMLButtonElement>);
        }
    };

    const handleBlur = (event: React.FocusEvent<HTMLDivElement>): void => {
        setTimeout(() => {
            if (!wrapperRef.current?.contains(document.activeElement) && props.onBlur) {
                reportValidity();
                props.onBlur({
                    ...event,
                    target: buttonRef.current,
                    currentTarget: buttonRef.current
                } as React.FocusEvent<HTMLButtonElement>);
            }
        }, 10);
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                hideDropdown();
            }
        };

        window.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, [wrapperRef]);

    /**
     * ------------------------------------------
     * --------------- HELPERS ------------------
     * ------------------------------------------
     */

    const instantiateDropdown = () => {
        if (!dropdown && dropdownRef.current) {
            dropdown = new Dropdown(dropdownRef.current);
        }
    };

    const showDropdown = () => {
        setIsExpanded(true);
        instantiateDropdown();
        dropdown?.show();
    };

    const hideDropdown = () => {
        setIsExpanded(false);
        instantiateDropdown();
        dropdown?.hide();
    };

    const getOption = (value: string): PicklistOptionBaseProps | undefined => {
        let option: PicklistOptionBaseProps | undefined;
        optionGroups.forEach((group) => {
            group.options.forEach((o) => {
                if (o.value === value) {
                    option = o;
                }
            });
        });
        return option;
    };

    const select = (value: number | string) => {
        if (typeof value === 'number') {
            const valueIndex: number = value;
            // Use a reducer to find the index among many groups of options for efficiency
            optionGroups.reduce((acc: number, group: PicklistOptionGroup) => {
                const endingIndex = acc + group.options.length - 1;
                if (endingIndex < valueIndex) {
                    return endingIndex;
                }
                group.options.forEach((option, index) => {
                    if (acc + index === valueIndex) {
                        value = option.value;
                    }
                });
                return endingIndex;
            }, 0);
        }

        // The value couldn't be found. Exit early.
        if (typeof value === 'number') {
            return;
        }

        setValue(value);
        setIsExpanded(false);
        hideDropdown();
        if (props.onChange) {
            props.onChange(new InternalEvents.ChangeEvent<HTMLButtonElement>({ detail: { value } }, buttonRef.current));
        }
    };

    const focus = () => {
        buttonRef.current?.focus();
    };

    const checkValidity = (): boolean => {
        return !(props.required && !value);
    };

    const reportValidity = (): boolean => {
        if (checkValidity()) {
            setError(undefined);
            return true;
        }
        setError('This field is required.');
        return false;
    };

    const setCustomValidity = (message: string): void => {
        setError(message.length ? message : undefined);
    };

    /**
     * ------------------------------------------
     * -------- API METHODS & EFFECTS -----------
     * ------------------------------------------
     */

    React.useImperativeHandle(ref, () => ({
        reportValidity,
        checkValidity,
        setCustomValidity,
        focus
    }));

    React.useEffect(() => {
        setValue(props.value?.toString() || '');
        setError(props.error);
    }, [props.value, props.error]);

    /**
     * ------------------------------------------
     * -------------- RENDERING -----------------
     * ------------------------------------------
     */

    const renderPicklistOption = (option: PicklistOptionBaseProps, index: number): React.JSX.Element => (
        <PicklistOption
            ref={menuItemRefs[index]}
            index={index}
            key={`${option.value}${index.toString()}`}
            label={option.label}
            value={option.value}
            selected={option.value === value}
            disabled={option.disabled}
            onSelect={handleSelect}
        />
    );

    const renderOptionGroups = (): Array<React.JSX.Element> => {
        const elements: Array<React.JSX.Element> = [];
        optionGroups.reduce((acc: number, group: PicklistOptionGroup, groupIndex: number) => {
            if (group.label) {
                if (groupIndex > 0) {
                    elements.push(
                        <hr
                            key={`${group.label}${groupIndex.toString()}divider`}
                            className='dropdown-divider'
                            onClick={handleClickGroupHeader}
                        />
                    );
                }
                elements.push(
                    <h6
                        key={`${group.label}${groupIndex.toString()}`}
                        className='dropdown-header'
                        onClick={handleClickGroupHeader}
                    >
                        {group.label}
                    </h6>
                );
            }
            group.options.forEach((option, index) => {
                elements.push(renderPicklistOption(option, acc + index));
            });
            return acc + group.options.length;
        }, 0);
        return elements;
    };

    const buttonLabel: string = getOption(value)?.label ?? 'Select an option';
    const buttonClassList = ['app-picklist form-control dropdown-toggle'];
    if (error?.length) {
        buttonClassList.push('is-invalid');
    }
    if (!value) {
        buttonClassList.push('no-value');
    }

    return (
        <div
            ref={wrapperRef}
            id={`${props.id}Wrapper`}
            className={props.className}
            onFocus={handleFocus}
            onBlur={handleBlur}
        >
            <InputLabel inputId={props.id} label={props.label} required={props.required} aria-label={props.label} />
            <div ref={dropdownRef} role='menu' className='dropdown'>
                <button
                    ref={buttonRef}
                    type='button'
                    data-bs-display='static'
                    data-bs-toggle='dropdown'
                    className={buttonClassList.join(' ')}
                    value={value}
                    id={props.id}
                    name={props.name}
                    style={props.style}
                    disabled={props.disabled}
                    onClick={handleClickMenuBar}
                >
                    {buttonLabel}
                </button>
                <div className='dropdown-menu col-12' aria-labelledby={props.id}>
                    {renderOptionGroups()}
                </div>
            </div>
            <InputSubtext inputId={props.id} description={props.description} error={error} />
        </div>
    );
}

export default React.forwardRef(Picklist);
