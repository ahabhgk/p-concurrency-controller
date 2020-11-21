# p-concurrency-controller

> maybe impl for [ies-fe-sh/hire Promise 任务并发控制器](https://github.com/ies-fe-sh/hire/tree/master/promise-concurrency)

```ts
const delay = (time: number) => new Promise((resolve) => setTimeout(resolve, time));
const concurrency = 2;
const controller = new PromiseConcurrencyController(concurrency);
const tasks = Array.from(
  { length: 5 },
  (_, i) => async () => {
    await delay(1000);
    return i;
  },
);
const result = controller.run(...tasks);

for await (const value of result) {
  console.log(`mission accomplished: ${value}`);
}

// mission accomplished: 0
// mission accomplished: 1
// ⏱ after 1000ms...
// mission accomplished: 2
// mission accomplished: 3
// ⏱ after 1000ms...
// mission accomplished: 4
// 🎉 done!
```
