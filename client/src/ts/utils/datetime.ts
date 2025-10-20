/**
 * @description Get a string representing the time difference between two timestamps
 * @param current Reference timestamp
 * @param previous Timestamp to compare against
 * @returns {string} Returns a string representing the time difference between the two timestamps
 */
export function getTimeDifferencePhrase(current: Date | string, previous: Date | string): string {
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;

    if (typeof current === 'string') {
        current = new Date(current);
    }
    if (typeof previous === 'string') {
        previous = new Date(previous);
    }

    const elapsed = current.getTime() - previous.getTime();

    if (elapsed < 3000) {
        return 'just now';
    } else if (elapsed < msPerMinute) {
        return Math.round(elapsed / 1000) + ' seconds ago';
    } else if (elapsed < msPerHour) {
        return Math.round(elapsed / msPerMinute) + ' minutes ago';
    } else if (elapsed < msPerDay) {
        return Math.round(elapsed / msPerHour) + ' hours ago';
    } else if (elapsed < msPerMonth) {
        return 'approximately ' + Math.round(elapsed / msPerDay) + ' days ago';
    } else if (elapsed < msPerYear) {
        return 'approximately ' + Math.round(elapsed / msPerMonth) + ' months ago';
    } else {
        return 'approximately ' + Math.round(elapsed / msPerYear) + ' years ago';
    }
}
