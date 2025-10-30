import * as React from 'react';

// Third party libraries
import purify from 'dompurify';

// Events
import * as InternalEvents from '@client/events';
import { isEnterKeyPress, isEscapeKeyPress } from '@client/events/utils';

// Internal Components
import Input from '@client/components/input/input';
import {
    AbstractInputProps,
    AbstractInputHandle,
    HTMLAbstractInputElement
} from '@client/components/input/peripherals';
import Modal, { ModalHeader, ModalContent, ModalHandle } from '@client/components/modal';

// Types
import { NavNode } from 'types/nav';

// Images
import searchIcon from '@images/search-icon.svg';
import linkArrowIcon from '@images/link-arrow.svg';

type GlobalClickHandler = (event: MouseEvent) => void;

export type SearchBarVariant = 'icon' | 'input';

export interface SearchBarProps extends AbstractInputProps {
    minLength?: number;
    maxLength?: number;
    placeholder?: string;
    variant?: SearchBarVariant;
    searchResults?: Array<NavNode>;
    onSearch: (event: InternalEvents.EnterEvent<HTMLInputElement>) => void;
    onSelect: (result: NavNode) => void;
    onCollapse: () => void;
}

export interface SearchBarHandle extends AbstractInputHandle {
    setError: (message: string) => void;
}

function SearchBar(props: SearchBarProps, ref: React.ForwardedRef<SearchBarHandle>): React.JSX.Element {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */
    const [error, setError] = React.useState<string | undefined>(props.error);
    const [searchTimeout, setSearchTimeout] = React.useState<NodeJS.Timeout | undefined>(undefined);
    const [showModal, setShowModal] = React.useState(false);
    const [showSearchResults, setShowSearchResults] = React.useState(false);
    const [searchResults, setSearchResults] = React.useState<Array<NavNode>>(props.searchResults ?? []);

    const errorMessage = props.messageWhenBadInput ?? 'This value is invalid.';

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */
    const searchTermRef = React.useRef<string>(props.value?.toString() || '');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const modalRef = React.useRef<ModalHandle>(null);

    /**
     * ------------------------------------------
     * ----------- EVENT HANDLERS ---------------
     * ------------------------------------------
     */

    const handleClickMask = (): void => {
        displayModal();
        setTimeout(() => focus(), 10);
    };

    const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (isEscapeKeyPress(event)) {
            clearTimeout(searchTimeout);
            setSearchTimeout(undefined);
            hideModal();
        } else if (isEnterKeyPress(event)) {
            clearTimeout(searchTimeout);
            setSearchTimeout(undefined);
            search();
        }
    };

    const handleChangeSearchKey = (event: InternalEvents.ChangeEvent<HTMLAbstractInputElement>): void => {
        clearTimeout(searchTimeout);
        const latestValue = event.detail.value;
        searchTermRef.current = latestValue;
        setSearchTimeout(setTimeout(search, 500));
    };

    const handleSelectResult = (event: React.MouseEvent<HTMLElement>): void => {
        event.preventDefault();
        event.stopPropagation();
        const resultId = event.currentTarget.id.replace('sr-', '');
        const result = props.searchResults?.find((result) => result.id.toString() === resultId);
        if (result) {
            props.onSelect(result);
        }
        hideModal();
    };

    const handleBlur = (event: React.FocusEvent<HTMLAbstractInputElement>): void => {
        reportValidity();
        if (props.onBlur) {
            props.onBlur(event);
        }
    };

    const handleClickWhenModalOpen = React.useRef<GlobalClickHandler>((event: MouseEvent): void => {
        if (modalRef.current && !modalRef.current.dialog?.contains(event.target as Node)) {
            hideModal();
        }
    });

    const handleKeyDownGlobal = (event: KeyboardEvent) => {
        switch (event.key) {
            case '/':
                if (!showModal) {
                    event.preventDefault();
                    handleClickMask();
                }
                break;
            case 'Escape':
                if (showModal) {
                    event.preventDefault();
                    hideModal();
                }
                break;
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
        if (props.required && !searchTermRef.current.length) {
            setError('This field is required.');
        } else if (null != props.minLength && searchTermRef.current.length < props.minLength) {
            setError(`This field must be at least ${props.minLength} characters long.`);
        } else if (null != props.maxLength && searchTermRef.current.length > props.maxLength) {
            setError(`This field must be at most ${props.maxLength} characters long.`);
        } else {
            setError(errorMessage);
        }
        return false;
    };

    const setCustomValidity = (message: string): void => {
        setError(message.length ? message : undefined);
    };

    const search = (): void => {
        if (searchTermRef.current.trim().length < (props.minLength ?? 1)) {
            return;
        }
        props.onSearch(
            new InternalEvents.EnterEvent(
                {
                    detail: {
                        value: searchTermRef.current.trim()
                    }
                },
                inputRef.current as HTMLInputElement
            )
        );
    };

    const displayModal = (): void => {
        modalRef.current?.show();
        setShowModal(true);
        setShowSearchResults(false);
        setTimeout(() => window.document.addEventListener('click', handleClickWhenModalOpen.current), 10);
    };

    const hideModal = (): void => {
        modalRef.current?.hide();
        setShowModal(false);
        setShowSearchResults(false);
        searchTermRef.current = '';
        props.onCollapse();
        window.document.removeEventListener('click', handleClickWhenModalOpen.current);
    };

    /**
     * ------------------------------------------
     * -------- API METHODS & EFFECTS -----------
     * ------------------------------------------
     */

    // Expose the imperative handle API methods
    React.useImperativeHandle(ref, () => ({
        reportValidity,
        checkValidity,
        setCustomValidity,
        focus,
        setError
    }));

    // Hide the spinner when the search results are loaded
    React.useEffect(() => {
        setSearchResults(props.searchResults ?? []);
        setShowSearchResults(true);
    }, [props.searchResults]);

    // Update the value and error message when the props change
    React.useEffect(() => {
        searchTermRef.current = props.value?.toString() || '';
        setError(props.error);
    }, [props.value, props.error]);

    // Listen for keydown events on the whole document while the component is mounted
    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyDownGlobal);
        return () => {
            document.removeEventListener('keydown', handleKeyDownGlobal);
        };
    }, []);

    /**
     * ------------------------------------------
     * ------------- RENDERING ------------------
     * ------------------------------------------
     */

    return (
        <div id={`${props.id}Container`} className={props.className}>
            {(props.variant === 'input' && (
                <button className='form-control px-2' id={`${props.id}-mask`} onClick={handleClickMask}>
                    <div className='row'>
                        <div className='col-auto pe-0 mt-0'>
                            <img src={searchIcon} alt='Search' />
                        </div>
                        <div className='col text-start mt-0'>
                            <p className='m-0'>{props.placeholder ?? 'Search'}</p>
                        </div>
                        <div className='col-auto ps-0 search-shortcut_button'>
                            <kbd>/</kbd>
                        </div>
                    </div>
                </button>
            )) || (
                <button className='btn btn-light' onClick={handleClickMask}>
                    <img src={searchIcon} alt='Search' />
                </button>
            )}
            <Modal ref={modalRef} id={`${props.id}-modal`} title='Search' onCancel={hideModal}>
                <ModalHeader>
                    <div className='row align-items-center'>
                        <div className='col-auto pe-0 m-0'>
                            <img className='modal-search_icon' src={searchIcon} alt='Search' />
                        </div>
                        <div className='col m-0'>
                            <form autoComplete='off' onSubmitCapture={(event) => event.preventDefault()}>
                                <Input
                                    ref={inputRef}
                                    {...props}
                                    error={error}
                                    type='search'
                                    className='modal-search'
                                    value={searchTermRef.current}
                                    placeholder={props.placeholder ?? 'Search'}
                                    onBlur={handleBlur}
                                    onKeyUp={handleKeyUp}
                                    onChange={handleChangeSearchKey}
                                />
                            </form>
                        </div>
                    </div>
                </ModalHeader>

                {showSearchResults && (
                    <ModalContent>
                        <h6>Results</h6>
                        <div className='results'>
                            {!!searchResults?.length ? (
                                searchResults.map((result: NavNode) => {
                                    return (
                                        <a
                                            className='row m-0 py-3 px-2'
                                            key={result.id}
                                            id={`sr-${result.id}`}
                                            href={purify.sanitize(result.path)}
                                            onClick={handleSelectResult}
                                        >
                                            <div className='col-auto'>
                                                <img
                                                    className='modal-documentation_icon'
                                                    src={linkArrowIcon}
                                                    alt='Search'
                                                />
                                            </div>
                                            <div className='col'>
                                                <h6 className='m-0'>{result.label}</h6>
                                                <p className='m-0'>{result.description}</p>
                                                <span className='badge mt-2'>{result.path}</span>
                                            </div>
                                        </a>
                                    );
                                })
                            ) : (
                                <p>No results found.</p>
                            )}
                        </div>
                    </ModalContent>
                )}
            </Modal>
        </div>
    );
}

export default React.forwardRef(SearchBar);
