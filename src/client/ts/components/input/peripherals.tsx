import React from 'react';

// Third party libraries
import purify from 'dompurify';

// Events
import * as InternalEvents from '@client/events';

export interface InputLabelProps {
    inputId: string;
    label?: string;
    required?: boolean;
}

/**
 * @module InputLabel
 * @description A label for an input element. If no label is provided, this component will return null.
 * @param {InputLabelProps} props - The properties of the input label.
 * @returns {React.JSX.Element | null} The input label, or null if no label was provided
 */
export function InputLabel(props: InputLabelProps): React.JSX.Element | null {
    if (!props.label) {
        return null;
    }
    return (
        <>
            {props.required && (
                <span className='text-danger' style={{ cursor: 'default' }} title='required'>
                    *&nbsp;
                </span>
            )}
            <label
                htmlFor={props.inputId}
                className='form-label'
                dangerouslySetInnerHTML={{ __html: purify.sanitize(props.label) }}
            ></label>
        </>
    );
}

export interface InputSubtextProps {
    inputId: string;
    description?: string;
    error?: string;
}

/**
 * @module InputSubtext
 * @description Subtext for an input. If there is an error, the text will be red. If there is no error or description, this component will return null.
 * @param {InputSubtextProps} props - The properties of the input subtext.
 * @returns {React.JSX.Element | null} The input subtext, or null if no error or description was provided
 */
export function InputSubtext(props: InputSubtextProps): React.JSX.Element | null {
    if (!props.error && !props.description) {
        return null;
    }
    const classList = ['form-text'];
    if (props.error?.length) {
        classList.push('text-danger');
    }
    return (
        <span id={`${props.inputId}Subtext`} className={`form-text ${props.error ? 'text-danger' : 'text-secondary'}`}>
            {props.error ?? props.description}
        </span>
    );
}

/**
 * @type HTMLAbstractInputElement
 * @description A type that represents any HTML input element that can be used in a form.
 */
export type HTMLAbstractInputElement = HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement;

/**
 * @interface AbstractInputHandle
 * @description A handle for an input element that can be used to check and report validity.
 */
export interface AbstractInputHandle {
    reportValidity: () => boolean;
    checkValidity: () => boolean;
    setCustomValidity: (message: string) => void;
    focus: () => void;
}

/**
 * @interface AbstractInputProps
 * @description Generic properties for any input component.
 */
export interface AbstractInputProps {
    id: string;
    name: string;
    value?: string | boolean;
    label?: string;
    error?: string;
    variant?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    description?: string;
    style?: React.CSSProperties;
    messageWhenBadInput?: string;
    onChange?: (event: InternalEvents.ChangeEvent<HTMLAbstractInputElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLAbstractInputElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLAbstractInputElement>) => void;
}
