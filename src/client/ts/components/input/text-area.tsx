import * as React from 'react';
import * as InternalEvents from '@client/events';
import {
    InputLabel,
    InputSubtext,
    AbstractInputProps,
    AbstractInputHandle
} from '@client/components/input/peripherals';

export interface TextAreaProps extends AbstractInputProps {
    rows?: number;
    cols?: number;
    minLength?: number;
    maxLength?: number;
}

function TextArea(props: TextAreaProps, ref: React.ForwardedRef<AbstractInputHandle>): React.JSX.Element {
    /**
     * ------------------------------------------
     * --------------- STATE --------------------
     * ------------------------------------------
     */

    const [error, setError] = React.useState<string | undefined>(props.error);
    const [currentValue, setValue] = React.useState<string>(props.value?.toString() || '');

    const errorMessage = props.messageWhenBadInput ?? 'This value is invalid.';

    /**
     * ------------------------------------------
     * ---------------- REFS --------------------
     * ------------------------------------------
     */

    const inputRef = React.useRef<HTMLTextAreaElement>(null);

    /**
     * ------------------------------------------
     * ----------- EVENT HANDLERS ---------------
     * ------------------------------------------
     */

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        const newValue = event.target.value;
        setValue(newValue);
        if (error?.length) {
            reportValidity();
        }
        if (props.onChange) {
            props.onChange(
                new InternalEvents.ChangeEvent(
                    {
                        detail: { value: newValue }
                    },
                    event.currentTarget
                )
            );
        }
    };

    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>): void => {
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
        return !!inputRef.current?.checkValidity();
    };

    const reportValidity = (): boolean => {
        if (inputRef.current?.checkValidity()) {
            setError(undefined);
            return true;
        }
        if (null != props.minLength && currentValue.length < props.minLength) {
            setError(`This field must be at least ${props.minLength} characters long.`);
        } else if (null != props.maxLength && currentValue.length > props.maxLength) {
            setError(`This field must be at most ${props.maxLength} characters long.`);
        } else {
            setError(errorMessage);
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
     * -------------- RENDERING -----------------
     * ------------------------------------------
     */

    return (
        <div id={`${props.id}Wrapper`} className={props.className}>
            <InputLabel inputId={props.id} label={props.label} required={props.required} />
            <textarea
                ref={inputRef}
                className={`form-control mh-100 ${error && 'is-invalid'}`}
                id={props.id}
                name={props.name}
                rows={props.rows}
                cols={props.cols}
                style={props.style}
                value={currentValue}
                required={props.required}
                disabled={props.disabled}
                minLength={props.minLength}
                maxLength={props.maxLength}
                aria-describedby={`${props.id}Subtext`}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={props.onFocus}
            ></textarea>
            <InputSubtext inputId={props.id} description={props.description} error={error} />
        </div>
    );
}

export default React.forwardRef(TextArea);
