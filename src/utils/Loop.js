/**
 * Helper to get a normalized loop value (0 to 1)
 * @param {number} time Current scene time
 * @param {number} duration Loop duration in ms
 * @returns {number} Normalized value 0-1
 */
export const getLoopProgress = (time, duration) => {
    return (time % duration) / duration;
};

/**
 * Helper to get a circular value (sin wave) that starts and ends at the same point
 * @param {number} time Current scene time
 * @param {number} duration Loop duration in ms
 * @returns {number} Value from -1 to 1
 */
export const getLoopSin = (time, duration) => {
    const progress = getLoopProgress(time, duration);
    return Math.sin(progress * Math.PI * 2);
};

/**
 * Helper to get a circular value (cos wave) that starts and ends at the same point
 * @param {number} time Current scene time
 * @param {number} duration Loop duration in ms
 * @returns {number} Value from -1 to 1
 */
export const getLoopCos = (time, duration) => {
    const progress = getLoopProgress(time, duration);
    return Math.cos(progress * Math.PI * 2);
};
