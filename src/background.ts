/**
 * Sets the background according to the current local time.
 */
export function setTimelyColor(brightness: number) {
    const angle = 270; // The middle of blue and magenta
    document.body.style.backgroundImage =
        `linear-gradient(hsl(0 0% ${brightness * 250}%),hsl(${angle} ${(1 - brightness) * 50}% ${brightness * 100}%))`;
}
