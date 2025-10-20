import * as React from 'react';

export interface SpinnerProps {
    variant?: string;
    relative?: boolean;
}

export default function Spinner(props: SpinnerProps): React.JSX.Element {
    return (
        <div className={`app-spinner-wrapper ${props.relative ? 'position-relative' : ''}`}>
            <div className={`spinner-border app-spinner text-${props.variant ?? 'secondary'}`} role='status'>
                <span className='visually-hidden'>Loading...</span>
            </div>
        </div>
    );
}
