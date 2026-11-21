/** Time source. Injected everywhere so expiry logic is testable without sleeping. */
export abstract class Clock {
  abstract now(): Date;
}

export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
