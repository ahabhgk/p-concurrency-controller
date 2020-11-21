import { ConcurrencyResult } from './concurrency-result';
import { defer, Defer } from './defer';

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
    if (this.stopDefer) {
      if (this.activeCount === 0) {
        this.stopDefer.resolve();
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

  private stopDefer: Defer<void> | null = null;

  stop(): Promise<void> {
    if (!this.stopDefer) {
      this.stopDefer = defer();
    }
    return this.stopDefer.promise;
  }

  resume() {
    this.stopDefer = null;
    this.run();
  }
}
