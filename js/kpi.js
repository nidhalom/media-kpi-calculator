// Pure KPI formulas for paid media. No DOM access here, so every function is unit tested in Node.
// Money values are in the same currency unit as the inputs. Percentages are plain numbers (2.5 means 2.5%).

function requireNonNegative(name, value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  if (value < 0) {
    throw new RangeError(`${name} must not be negative`);
  }
}

function requirePositive(name, value) {
  requireNonNegative(name, value);
  if (value === 0) {
    throw new RangeError(`${name} must be greater than zero`);
  }
}

function requireMarginPct(marginPct) {
  requirePositive('marginPct', marginPct);
  if (marginPct > 100) {
    throw new RangeError('marginPct must be at most 100');
  }
}

/** Click-through rate in percent: clicks / impressions * 100. */
export function ctr({ clicks, impressions }) {
  requireNonNegative('clicks', clicks);
  requirePositive('impressions', impressions);
  return (clicks / impressions) * 100;
}

/** Cost per click: spend / clicks. */
export function cpc({ spend, clicks }) {
  requireNonNegative('spend', spend);
  requirePositive('clicks', clicks);
  return spend / clicks;
}

/** Cost per thousand impressions: spend / impressions * 1000. */
export function cpm({ spend, impressions }) {
  requireNonNegative('spend', spend);
  requirePositive('impressions', impressions);
  return (spend / impressions) * 1000;
}

/** Cost per acquisition (purchase or lead): spend / conversions. */
export function cpa({ spend, conversions }) {
  requireNonNegative('spend', spend);
  requirePositive('conversions', conversions);
  return spend / conversions;
}

/** Return on ad spend: revenue / spend. A ratio, so 3 means 3x. */
export function roas({ revenue, spend }) {
  requireNonNegative('revenue', revenue);
  requirePositive('spend', spend);
  return revenue / spend;
}

/**
 * Break-even ROAS from a gross margin. With margin m (as a fraction), each unit of revenue
 * covers m units of cost of goods, so ad spend must stay below m units of revenue: ROAS >= 1 / m.
 * Example: 40% margin gives a break-even ROAS of 2.5.
 */
export function breakEvenRoas({ marginPct }) {
  requireMarginPct(marginPct);
  return 100 / marginPct;
}

/** Highest cost per purchase that still breaks even: average order value * margin. */
export function maxCpa({ averageOrderValue, marginPct }) {
  requirePositive('averageOrderValue', averageOrderValue);
  requireMarginPct(marginPct);
  return averageOrderValue * (marginPct / 100);
}

/** Gross profit after ad spend: revenue * margin - spend. Negative means a loss. */
export function profit({ revenue, spend, marginPct }) {
  requireNonNegative('revenue', revenue);
  requireNonNegative('spend', spend);
  requireMarginPct(marginPct);
  return revenue * (marginPct / 100) - spend;
}

/**
 * Budget for a number of purchases when the CPA is already known.
 * Returns the total spend: targetPurchases * cpa.
 */
export function budgetFromCpa({ targetPurchases, cpa }) {
  requireNonNegative('targetPurchases', targetPurchases);
  requirePositive('cpa', cpa);
  return targetPurchases * cpa;
}

/**
 * Budget for a number of purchases from the funnel: clicks needed = purchases / conversion rate,
 * spend = clicks * CPC. conversionRatePct is purchases divided by clicks, in percent.
 */
export function budgetFromFunnel({ targetPurchases, conversionRatePct, cpc: costPerClick }) {
  requireNonNegative('targetPurchases', targetPurchases);
  requirePositive('conversionRatePct', conversionRatePct);
  requirePositive('cpc', costPerClick);
  const clicksNeeded = targetPurchases / (conversionRatePct / 100);
  return { clicksNeeded, budget: clicksNeeded * costPerClick };
}

/** Round to a fixed number of decimals for display. */
export function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Compute every metric that has enough inputs. Missing inputs (undefined or null) skip the metric.
 * Invalid inputs (for example zero impressions) are reported per metric in `error`, so one bad
 * field does not hide the others.
 * Returns { metricName: { value: number|null, error: string|null } }.
 */
export function summarize(input) {
  const has = (...keys) => keys.every((key) => input[key] !== undefined && input[key] !== null);
  const metrics = {
    ctr: ['clicks', 'impressions', () => ctr({ clicks: input.clicks, impressions: input.impressions })],
    cpc: ['spend', 'clicks', () => cpc({ spend: input.spend, clicks: input.clicks })],
    cpm: ['spend', 'impressions', () => cpm({ spend: input.spend, impressions: input.impressions })],
    cpa: ['spend', 'conversions', () => cpa({ spend: input.spend, conversions: input.conversions })],
    roas: ['revenue', 'spend', () => roas({ revenue: input.revenue, spend: input.spend })],
    breakEvenRoas: ['marginPct', () => breakEvenRoas({ marginPct: input.marginPct })],
    maxCpa: ['averageOrderValue', 'marginPct', () =>
      maxCpa({ averageOrderValue: input.averageOrderValue, marginPct: input.marginPct })],
    profit: ['revenue', 'spend', 'marginPct', () =>
      profit({ revenue: input.revenue, spend: input.spend, marginPct: input.marginPct })],
    budgetFromCpa: ['targetPurchases', 'cpa', () =>
      budgetFromCpa({ targetPurchases: input.targetPurchases, cpa: input.cpa })],
  };

  const result = {};
  for (const [name, [...rest]] of Object.entries(metrics)) {
    const compute = rest.pop();
    if (!has(...rest)) {
      result[name] = { value: null, error: null };
      continue;
    }
    try {
      result[name] = { value: compute(), error: null };
    } catch (err) {
      result[name] = { value: null, error: err.message };
    }
  }
  return result;
}
