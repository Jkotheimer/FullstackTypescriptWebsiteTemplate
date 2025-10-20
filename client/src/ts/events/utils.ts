export const isForwardKeyPress = (event: React.KeyboardEvent): boolean => {
    const forwardKeys = ['Tab', 'ArrowDown'];
    return forwardKeys.includes(event.key) || forwardKeys.includes(event.code);
};

export const isBackwardKeyPress = (event: React.KeyboardEvent): boolean => {
    const backwardKeys = ['ArrowUp', 'ShiftRight'];
    return backwardKeys.includes(event.key) || backwardKeys.includes(event.code);
};

export const isEnterKeyPress = (event: React.KeyboardEvent): boolean => {
    return event.key === 'Enter' || event.code === 'Enter';
};

export const isSpaceKeyPress = (event: React.KeyboardEvent): boolean => {
    return event.key === ' ' || event.code === 'Space';
};

export const isEscapeKeyPress = (event: React.KeyboardEvent): boolean => {
    return event.key === 'Escape' || event.code === 'Escape';
};
