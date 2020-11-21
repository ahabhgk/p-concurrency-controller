import ava, { TestInterface } from 'ava';
import Sinon from 'sinon';
import delay from 'delay';

import { PromiseConcurrencyController } from '..';
import { ConcurrencyResult } from '../concurrency-result';

const test = ava as TestInterface<{
  timer: Sinon.SinonFakeTimers
}>;

test.beforeEach((t) => {
  t.context.timer = Sinon.useFakeTimers();
});

test.afterEach((t) => {
  t.context.timer.restore();
});

test('should be able to handle concurrency: 5', async (t) => {
  const concurrency = 5;
  const controller = new PromiseConcurrencyController(concurrency);
  const tasks = Array.from({ length: 100 }, () => async () => {
    t.true(controller.activeCount <= concurrency);
    await delay(Math.random() * 100);
  });
  controller.run(...tasks);
});

test('should be able to handle concurrency: 1', (t) => {
  const concurrency = 1;
  const controller = new PromiseConcurrencyController(concurrency);
  const tasks = Array.from({ length: 3 }, () => async () => {
    t.true(controller.activeCount === concurrency);
    await delay(Math.random() * 100);
  });
  controller.run(...tasks.slice());
  controller.run(...tasks.slice());
});

test('should be able to handle multiple run', (t) => {
  const concurrency = 1;
  const controller = new PromiseConcurrencyController(concurrency);
  const tasks = Array.from({ length: 3 }, () => async () => {
    t.true(controller.activeCount === concurrency);
    await delay(Math.random() * 100);
  });
  controller.run(...tasks);
  controller.run(...tasks);
});

test('should be able to return a ConcurrencyResult instance', (t) => {
  const controller = new PromiseConcurrencyController(1);
  const result = controller.run();
  t.true(result instanceof ConcurrencyResult);
});

test('should be able to stop the controller', (t) => {
  const controller = new PromiseConcurrencyController(1);
  const tasks = Array.from({ length: 3 }, () => async () => {
    await delay(Math.random() * 1000);
  });
  controller.run(...tasks);
  (async () => {
    t.is(controller.activeCount, 1);
    await controller.stop();
    t.is(controller.activeCount, 0);
  })();
});

test('should be able to resume the controller', (t) => {
  const controller = new PromiseConcurrencyController(1);
  const tasks = Array.from({ length: 3 }, () => async () => {
    await delay(Math.random() * 1000);
  });
  controller.run(...tasks);
  (async () => {
    t.is(controller.activeCount, 1);
    await controller.stop();
    t.is(controller.activeCount, 0);
    controller.resume();
    t.is(controller.activeCount, 1);
  })();
});

test('should be able to return the same promise if already stop', (t) => {
  const controller = new PromiseConcurrencyController(1);
  const tasks = Array.from({ length: 3 }, () => async () => {
    await delay(Math.random() * 1000);
  });
  controller.run(...tasks);
  (async () => {
    const stopPromise1 = controller.stop();
    const stopPromise2 = controller.stop();
    t.true(stopPromise1 === stopPromise2);
    await stopPromise1;
    const stopPromise3 = controller.stop();
    t.true(stopPromise1 === stopPromise3);
  })();
});

test('should be able to get the running task number by activeCount', (t) => {
  const controller = new PromiseConcurrencyController(1);
  controller.run(async () => delay(Math.random() * 100));
  t.is(controller.activeCount, 1);
});

test('should be able to get the pending task number by pendingCount', (t) => {
  const controller = new PromiseConcurrencyController(1);
  const fn = async () => delay(Math.random() * 100);
  controller.run(fn, fn);
  t.is(controller.pendingCount, 1);
});
