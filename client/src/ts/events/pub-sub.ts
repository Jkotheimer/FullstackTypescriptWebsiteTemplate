export type Subscriber = (data?: any) => void;
const channels: { [key: string]: Array<Subscriber> } = {};

export function publish(channel: string, data?: any): void {
    if (channels[channel]) {
        channels[channel].forEach((subscriber) => subscriber(data));
    }
}

export function subscribe(channel: string, subscriber: Subscriber): void {
    if (!channels[channel]) {
        channels[channel] = [];
    }
    channels[channel].push(subscriber);
}

export function unsubscribe(channel: string, subscriber: Subscriber): void {
    if (channels[channel]) {
        channels[channel] = channels[channel].filter((sub) => sub !== subscriber);
    }
}
