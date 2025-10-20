import * as React from 'react';
import * as InternalEvents from '@app/events';
import { InputLabel, InputSubtext, AbstractInputProps, AbstractInputHandle } from '@app/components/input/peripherals';

export interface CheckboxProps extends AbstractInputProps {
    value?: boolean;
}

function Checkbox(props: CheckboxProps, ref: React.ForwardedRef<AbstractInputHandle>): React.JSX.Element {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */

    const [currentValue, setValue] = React.useState<boolean>(!!props.value);
    const [error, setError] = React.useState<string | undefined>(props.error);

    const errorMessage = props.messageWhenBadInput ?? 'You must check this box to continue.';

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */

    const inputRef = React.useRef<HTMLInputElement>(null);

    /**
     * ------------------------------------------
     * ----------- EVENT HANDLERS ---------------
     * ------------------------------------------
     */

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const newValue = !!event.target.checked;
        setValue(newValue);
        if (error?.length) {
            reportValidity();
        }
        if (props.onChange) {
            props.onChange(
                new InternalEvents.ChangeEvent<HTMLInputElement>(
                    {
                        detail: { value: newValue },
                    },
                    event.currentTarget
                )
            );
        }
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
        reportValidity();
        if (props.onBlur) {
            props.onBlur(event);
        }
    };

    /**
     * ------------------------------------------
     * ----------- HELPER METHODS ---------------
     * ------------------------------------------
     */

    const focus = (): void => {
        inputRef.current?.focus();
    };

    const checkValidity = (): boolean => {
        return !!props.required && !!inputRef.current?.checked;
    };

    const reportValidity = (): boolean => {
        if (checkValidity()) {
            setError(undefined);
            return true;
        }
        setError(errorMessage);
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
        focus,
    }));

    React.useEffect(() => {
        setValue(!!props.value);
        setError(props.error);
    }, [props.value, props.error]);

    /**
     * ------------------------------------------
     * ------------- RENDERING ------------------
     * ------------------------------------------
     */

    return (
        <div id={`${props.id}Wrapper`} className={props.className}>
            <div className='callout px-4 py-3 mb-3 mt-2 app-service-agreement-wrapper'>
                <div className='form-check mb-0'>
                    <input
                        ref={inputRef}
                        className={`form-check-input ${error && 'is-invalid'}`}
                        id={props.id}
                        type='checkbox'
                        name={props.name}
                        style={props.style}
                        checked={currentValue}
                        required={props.required}
                        disabled={props.disabled}
                        aria-checked={currentValue}
                        aria-describedby={`${props.id}Subtext`}
                        onChange={handleChange}
                        onFocus={props.onFocus}
                        onBlur={handleBlur}
                    />
                    <InputLabel inputId={props.id} label={props.label} required={props.required} />
                </div>
                <InputSubtext inputId={props.id} error={error} />
            </div>
            <InputSubtext inputId={props.id} description={props.description} />
        </div>
    );
}

export default React.forwardRef(Checkbox);
