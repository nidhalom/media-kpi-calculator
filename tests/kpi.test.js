import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ctr,
  cpc,
  cpm,
  cpa,
  roas,
  breakEvenRoas,
  maxCpa,
  profit,
  budgetFromCpa,
  budgetFromFunnel,
  round,
} from '../js/kpi.js';

describe('core metrics', () => {
  test('CTR is a percentage', () => {
    assert.equal(ctr({ clicks: 150, impressions: 10000 }), 1.5);
  });

  test('CPC divides spend by clicks', () => {
    assert.equal(cpc({ spend: 300, clicks: 150 }), 2);
  });

  test('CPM is cost per 1000 impressions', () => {
    assert.equal(cpm({ spend: 50, impressions: 25000 }), 2);
  });

  test('CPA divides spend by conversions', () => {
    assert.equal(cpa({ spend: 480, conversions: 12 }), 40);
  });

  test('ROAS is revenue over spend', () => {
    assert.equal(roas({ revenue: 1500, spend: 500 }), 3);
  });

  test('zero spend gives a zero CPM', () => {
    assert.equal(cpm({ spend: 0, impressions: 1000 }), 0);
  });
});

describe('margin based metrics', () => {
  test('break-even ROAS from a 40% margin is 2.5', () => {
    assert.equal(breakEvenRoas({ marginPct: 40 }), 2.5);
  });

  test('break-even ROAS from a 100% margin is 1', () => {
    assert.equal(breakEvenRoas({ marginPct: 100 }), 1);
  });

  test('max CPA is average order value times margin', () => {
    assert.equal(maxCpa({ averageOrderValue: 80, marginPct: 35 }), 28);
  });

  test('profit after ad spend can be negative', () => {
    assert.equal(profit({ revenue: 1000, spend: 500, marginPct: 40 }), -100);
    assert.equal(profit({ revenue: 1000, spend: 200, marginPct: 40 }), 200);
  });

  test('break-even ROAS and max CPA agree: ROAS at break-even means spend equals margin share', () => {
    const aov = 50;
    const margin = 30;
    const cpaAtBreakEven = maxCpa({ averageOrderValue: aov, marginPct: margin });
    const roasAtBreakEven = roas({ revenue: aov, spend: cpaAtBreakEven });
    assert.equal(round(roasAtBreakEven, 6), round(breakEvenRoas({ marginPct: margin }), 6));
  });
});

describe('budget planning', () => {
  test('budget from a known CPA', () => {
    assert.equal(budgetFromCpa({ targetPurchases: 200, cpa: 12.5 }), 2500);
  });

  test('budget from funnel: clicks needed and spend', () => {
    const result = budgetFromFunnel({ targetPurchases: 100, conversionRatePct: 2, cpc: 0.5 });
    assert.equal(result.clicksNeeded, 5000);
    assert.equal(result.budget, 2500);
  });
});

describe('input validation', () => {
  test('zero impressions cannot give a CTR', () => {
    assert.throws(() => ctr({ clicks: 1, impressions: 0 }), RangeError);
  });

  test('negative values are rejected', () => {
    assert.throws(() => cpc({ spend: -1, clicks: 10 }), RangeError);
  });

  test('non-numbers are rejected', () => {
    assert.throws(() => roas({ revenue: '100', spend: 10 }), TypeError);
    assert.throws(() => roas({ revenue: NaN, spend: 10 }), TypeError);
  });

  test('margin must be between 0 (exclusive) and 100 (inclusive)', () => {
    assert.throws(() => breakEvenRoas({ marginPct: 0 }), RangeError);
    assert.throws(() => breakEvenRoas({ marginPct: 120 }), RangeError);
    assert.doesNotThrow(() => breakEvenRoas({ marginPct: 100 }));
  });
});

describe('round', () => {
  test('rounds to the requested decimals', () => {
    assert.equal(round(2.345, 2), 2.35);
    assert.equal(round(1.005, 2), 1.01);
    assert.equal(round(7.9, 0), 8);
  });
});
