import { setTimeout } from "timers";

/** Build-time replacement for pdf-lib 1.17.1's browser-based cooperative yield. */
export const waitForTick = (): Promise<void> => new Promise(resolve => { setTimeout(resolve, 0); });
