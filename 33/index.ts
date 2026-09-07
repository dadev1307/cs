import { forEach } from './ForEach.ts';

let total = 0;

// Запуск задач с замерами времени
const start = performance.now();

let id = setInterval(() => {
  console.log('TASK!!!!!!!!!');
}, 400);

forEach(
  new Array(50e5),
  () => {
    total++;
  },
  { priority: 'critical' }
).then(() => {
  console.log(
    `critical обработано за ${(performance.now() - start).toFixed(2)}мс`
  );
});

forEach(
  new Array(50e5),
  () => {
    total++;
  },
  { priority: 'high' }
).then(() => {
  console.log(`high обработано за ${(performance.now() - start).toFixed(2)}мс`);
});

forEach(
  new Array(50e5),
  () => {
    total++;
  },
  { priority: 'low' }
).then(() => {
  console.log(`low обработано за ${(performance.now() - start).toFixed(2)}мс`);
});

forEach(new Array(50e5), () => {
  total++;
}).then(() => {
  console.log(
    `default обработано за ${(performance.now() - start).toFixed(2)}мс`
  );
});

forEach(new Array(50e5), () => {
  total++;
}).then(() => {
  console.log(
    `default обработано за ${(performance.now() - start).toFixed(2)}мс`
  );
  clearInterval(id);
});
