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

test('concurrency: 5', async (t) => {
  const concurrency = 5;
  const controller = new PromiseConcurrencyController(concurrency);
  const input = Array.from({ length: 100 }, () => async () => {
    t.true(controller.activeCount <= concurrency);
    await delay(Math.random() * 100);
  });
  controller.run(...input);
});

test('concurrency: 1', (t) => {
  const concurrency = 1;
  const controller = new PromiseConcurrencyController(concurrency);
  const input = Array.from({ length: 5 }, () => async () => {
    t.true(controller.activeCount === concurrency);
    await delay(Math.random() * 100);
  });
  controller.run(...input);
});

test('should be able to return a ConcurrencyResult instance', (t) => {
  const controller = new PromiseConcurrencyController(1);
  const result = controller.run();
  t.true(result instanceof ConcurrencyResult);
});

test('should be able to stop the controller', (t) => {
  const controller = new PromiseConcurrencyController(1);
  const input = Array.from({ length: 3 }, () => async () => {
    await delay(Math.random() * 1000);
  });
  controller.run(...input);
  (async () => {
    t.is(controller.activeCount, 1);
    await controller.stop();
    t.is(controller.activeCount, 0);
  })();
});

test('should be able to resume the controller', (t) => {
  const controller = new PromiseConcurrencyController(1);
  const input = Array.from({ length: 3 }, () => async () => {
    await delay(Math.random() * 1000);
  });
  controller.run(...input);
  (async () => {
    t.is(controller.activeCount, 1);
    await controller.stop();
    t.is(controller.activeCount, 0);
    controller.resume();
    t.is(controller.activeCount, 1);
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
