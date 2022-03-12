/**
 * Errors if the assertion fails. Only available in development builds.
 */
function assert(condition: boolean) {
    if (import.meta.env.DEV && !condition) {
        throw new Error("Assertion failed");
    }
}

/**
 * Normalizes the given value in the given range, such that for parameter value:
 * * 0 returns -1
 * * `range / 2` returns 0
 * * `range` returns +1
 * I.e. the output will be from -1 to +1.
 * @param value The value to be normalized in the range.
 * @param range The range goes from 0 to this value.
 */
export function normalizeInRange(value: number, range: number) {
    return (value / range) * 2 - 1;
}

/**
 * Normalizes the given time such that
 * the start of the day is 0, the middle of the day 1, and the end of the day 0.
 */
function normalizeTime(hours: number, minutes: number) {
    assert(hours >= 0 && hours <= 23);
    assert(minutes >= 0 && minutes <= 59);

    const normalizedHours = 1 - Math.abs(normalizeInRange(hours, 23));
    const normalizedMinutes = (59 - minutes) / 59 / 100;

    return normalizedHours + normalizedMinutes;
}

/**
 * Returns brightness based to the current local time.
 */
export function getTimelyBrightness() {
    const date = new Date();

    return Math.max(
        0.05, // Anything less than this is too dark
        normalizeTime(date.getHours(), date.getMinutes())
    );
}

/**
 * Returns a random number in the given range.
 * @param min The start of the range.
 * @param max The end of the range.
 */
export function getRandomNumber(min: number, max: number) {
    return min + Math.random() * (max - min);
}

/**
 * Returns a random boolean.
 * @param probability The probability of returning `true`.
 */
function getRandomBoolean(probability = 0.5) {
    return Math.random() < probability;
}

/**
 * Returns randomly either -1 or 1.
 */
export function getRandomSign() {
    return getRandomBoolean() ? -1 : 1;
}
