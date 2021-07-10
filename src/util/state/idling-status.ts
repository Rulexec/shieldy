export enum IdlingStatusOnIdleResult {
  sync = 'sync',
  async = 'async',
}

const DEBUG = false;

export class IdlingStatus {
  private runningTasksCount = 0;
  private notifyPromise: Promise<void>;
  private resolve: () => void;
  private runningStacks: Set<Error> = new Set();

  constructor() {
    this.createNotifyPromise();
  }

  private createNotifyPromise = (): void => {
    this.notifyPromise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  };

  private notify = () => {
    const prevResolve = this.resolve;
    this.createNotifyPromise();
    prevResolve();
  };

  startTask = (): (() => void) => {
    this.runningTasksCount++;

    const stack = DEBUG && new Error();
    if (DEBUG && stack) {
      this.runningStacks.add(stack);
    }

    if (this.runningTasksCount === 1) {
      this.notify();
    }

    let finished = false;

    return () => {
      if (finished) return;
      finished = true;
      this.runningTasksCount--;

      if (DEBUG && stack) {
        this.runningStacks.delete(stack);
        if (this.runningTasksCount === 0) {
          console.log(stack);

          for (const error of this.runningStacks) {
            console.error(error.stack);
          }
        }
      }

      if (this.runningTasksCount === 0) {
        this.notify();
      }
    };
  };

  wrapTask = async <T>(fun: () => T | Promise<T>): Promise<T> => {
    const finish = this.startTask();

    try {
      return await fun();
    } finally {
      finish();
    }
  };

  isIdle = (): boolean => this.runningTasksCount === 0;

  onIdle = async (): Promise<IdlingStatusOnIdleResult> => {
    let isIdle = this.isIdle();
    if (isIdle) {
      return IdlingStatusOnIdleResult.sync;
    }

    while (!isIdle) {
      await this.notifyPromise;
      isIdle = this.isIdle();
    }

    return IdlingStatusOnIdleResult.async;
  };
}
