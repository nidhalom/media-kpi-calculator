import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarize } from '../js/kpi.js';

test('computes only the metrics that have their inputs', () => {
  const result = summarize({ spend: 300, clicks: 150, impressions: 10000 });
  assert.equal(result.cpc.value, 2);
  assert.equal(result.ctr.value, 1.5);
  assert.equal(result.cpm.value, 30);
  assert.equal(result.roas.value, null);
  assert.equal(result.roas.error, null);
});

test('an invalid input is reported on its own metric and does not stop the others', () => {
  const result = summarize({ spend: 300, clicks: 0, impressions: 10000 });
  assert.equal(result.cpc.value, null);
  assert.match(result.cpc.error, /greater than zero/);
  assert.equal(result.cpm.value, 30);
});

test('break-even ROAS and profit use the margin', () => {
  const result = summarize({ marginPct: 40, revenue: 1000, spend: 500 });
  assert.equal(result.breakEvenRoas.value, 2.5);
  assert.equal(result.profit.value, -100);
});

test('empty input yields no values and no errors', () => {
  const result = summarize({});
  for (const metric of Object.values(result)) {
    assert.deepEqual(metric, { value: null, error: null });
  }
});
