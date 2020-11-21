import { ConcurrencyResult } from './concurrency-result';

export type Task<T> = () => Promise<T>;

export class PromiseConcurrencyController<T> {
  private queue: Task<T>[] = [];

  public get pendingCount() {
    return this.queue.length;
  }

  activeCount = 0;

  private concurrencyResult: ConcurrencyResult<T>;

  constructor(public readonly size: number) {
    this.concurrencyResult = new ConcurrencyResult();
  }

  run(...tasks: Task<T>[]): ConcurrencyResult<T> {
    for (const task of tasks) {
      this.queue.push(task);
    }
    while (this.activeCount < this.size && this.queue.length > 0) {
      this.runTask(this.queue.shift()!);
    }
    return this.concurrencyResult;
  }

  private runTask(task: Task<T>) {
    this.activeCount += 1;
    task()
      .then((value) => {
        this.concurrencyResult.yield(value);
      })
      .catch((err) => {
        this.concurrencyResult.reject(err);
      })
      .finally(() => {
        this.activeCount -= 1;
        this.next();
      });
  }

  private next() {
    if (this.stopResolver) {
      if (this.activeCount === 0) {
        this.stopResolver();
      }
      return;
    }

    const nextTask = this.queue.shift();
    if (nextTask) {
      this.runTask(nextTask);
    } else if (this.activeCount === 0) {
      this.concurrencyResult.done();
    }
  }

  private stopResolver: ((value?: void | PromiseLike<void> | undefined) => void) | null = null;

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.stopResolver = resolve;
    });
  }

  resume() {
    this.stopResolver = null;
    this.run();
  }
}
