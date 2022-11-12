import {Logger} from '../logging/types';

type ItemInfo<T> = {
  value: T;
  addTimestamp: number;
};

export class UniqueItemLogger<T extends string | number> {
  private name: string;
  private itemsSet = new Set<T>();
  private usages: ItemInfo<T>[] = [];
  private maxItems: number;
  private intervalSeconds: number;
  private getCurrentDate: () => Date;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private logger: Logger;

  constructor({
    name,
    maxItems,
    intervalSeconds,
    getCurrentDate,
    logger,
  }: {
    name: string;
    maxItems: number;
    intervalSeconds: number;
    getCurrentDate: () => Date;
    logger: Logger;
  }) {
    this.name = name;
    this.maxItems = maxItems;
    this.intervalSeconds = intervalSeconds;
    this.getCurrentDate = getCurrentDate;
    this.logger = logger;
  }

  addItem(item: T): void {
    if (this.itemsSet.has(item)) {
      return;
    }

    const addTimestamp = this.getCurrentDate().getTime();

    const info: ItemInfo<T> = {
      value: item,
      addTimestamp,
    };

    this.itemsSet.add(item);
    this.usages.push(info);

    if (this.usages.length > this.maxItems) {
      const removedInfo = this.usages.shift();
      if (removedInfo) {
        this.itemsSet.delete(removedInfo.value);
      }
    }

    this.runTimer();

    this.logger.stats(this.name, {id: item});
  }

  destroy() {
    if (this.timeoutId === null) {
      return;
    }

    clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }

  private runTimer() {
    if (this.timeoutId !== null) {
      return;
    }

    const waitForMs = (() => {
      while (this.usages.length) {
        const {addTimestamp, value} = this.usages[0];

        const waitForMs =
          addTimestamp +
          this.intervalSeconds * 1000 -
          this.getCurrentDate().getTime();

        if (waitForMs <= 0) {
          this.itemsSet.delete(value);
          this.usages.shift();
          continue;
        }

        return waitForMs;
      }

      return 0;
    })();

    if (!waitForMs) {
      return;
    }

    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      this.runTimer();
    }, waitForMs);
  }
}
