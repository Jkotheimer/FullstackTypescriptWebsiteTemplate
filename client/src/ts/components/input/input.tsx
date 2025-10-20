import * as React from 'react';
import * as InternalEvents from '@app/events';
import * as EventUtils from '@app/events/utils';
import { InputLabel, InputSubtext, AbstractInputProps, AbstractInputHandle } from '@app/components/input/peripherals';

export interface InputProps extends AbstractInputProps {
    type: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    placeholder?: string;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onEnter?: (event: InternalEvents.EnterEvent<HTMLInputElement>) => void;
}

// See https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/using_regular_expressions_to_validate_email_addresses.html
const EMAIL_REGEX =
    /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function Input(props: InputProps, ref: React.ForwardedRef<AbstractInputHandle>): React.JSX.Element {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */

    const [currentValue, setValue] = React.useState<string>(props.value?.toString() || '');
    const [error, setError] = React.useState<string | undefined>(props.error);

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
        const newValue = event.target.value;
        setValue(newValue);
        if (error?.length) {
            reportValidity();
        }
        if (props.onChange) {
            props.onChange(
                new InternalEvents.ChangeEvent<HTMLInputElement>(
                    {
                        detail: { value: newValue }
                    },
                    event.currentTarget
                )
            );
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (props.onKeyDown) {
            props.onKeyDown(event);
        }
        if (!event.defaultPrevented && EventUtils.isEnterKeyPress(event) && reportValidity() && props.onEnter) {
            props.onEnter(new InternalEvents.EnterEvent({}, event.currentTarget));
        }
    };

    const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (props.onKeyUp) {
            props.onKeyUp(event);
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
        // The HTML email type doesn't cover all edge cases, so we need to do our own validation.
        if (props.type === 'email' && !EMAIL_REGEX.test(currentValue.toLowerCase())) {
            return false;
        }
        return !!inputRef.current?.checkValidity();
    };

    const reportValidity = (): boolean => {
        if (checkValidity()) {
            setError(undefined);
            return true;
        }
        if (props.messageWhenBadInput) {
            setError(props.messageWhenBadInput);
        } else if (props.required && !currentValue.length) {
            setError('This field is required.');
        } else if (props.type === 'email' && !EMAIL_REGEX.test(currentValue)) {
            setError('Invalid email address.');
        } else if (null != props.minLength && currentValue.length < props.minLength) {
            setError(`This field must be at least ${props.minLength} characters long.`);
        } else if (null != props.maxLength && currentValue.length > props.maxLength) {
            setError(`This field must be at most ${props.maxLength} characters long.`);
        } else {
            setError('This value is invalid.');
        }
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
     * ------------- RENDERING ------------------
     * ------------------------------------------
     */

    const showLabel = props.variant !== 'label-hidden' && !!props.label?.length;
    return (
        <div id={`${props.id}Wrapper`} className={props.className}>
            {showLabel && <InputLabel inputId={props.id} label={props.label} required={props.required} />}
            <input
                ref={inputRef}
                className={`form-control ${error ? 'is-invalid' : ''}`}
                id={props.id}
                type={props.type}
                name={props.name}
                style={props.style}
                value={currentValue}
                pattern={props.pattern}
                required={props.required}
                disabled={props.disabled}
                minLength={props.minLength}
                maxLength={props.maxLength}
                placeholder={props.placeholder}
                aria-describedby={`${props.id}Subtext`}
                aria-label={props.label}
                onChange={handleChange}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onFocus={props.onFocus}
            ></input>
            <InputSubtext inputId={props.id} description={props.description} error={error} />
        </div>
    );
}

export default React.forwardRef(Input);
