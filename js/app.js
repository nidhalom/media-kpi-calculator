// DOM wiring only. Every formula lives in kpi.js and is covered by node:test.
import { summarize, round } from './kpi.js';

const FORMS = ['funnel-form', 'unit-form', 'budget-form'];

const DISPLAY = [
  { key: 'ctr', label: 'CTR', unit: '%', decimals: 2 },
  { key: 'cpc', label: 'CPC', unit: '', decimals: 2 },
  { key: 'cpm', label: 'CPM', unit: '', decimals: 2 },
  { key: 'cpa', label: 'CPA', unit: '', decimals: 2 },
  { key: 'roas', label: 'ROAS', unit: 'x', decimals: 2 },
  { key: 'breakEvenRoas', label: 'Break-even ROAS', unit: 'x', decimals: 2 },
  { key: 'maxCpa', label: 'Max CPA to break even', unit: '', decimals: 2 },
  { key: 'profit', label: 'Gross profit after spend', unit: '', decimals: 2 },
  { key: 'budgetFromCpa', label: 'Budget for target purchases', unit: '', decimals: 2 },
];

// Empty fields become undefined, so summarize() skips the metrics that need them.
export function readInputs(root = document) {
  const values = {};
  for (const id of FORMS) {
    const form = root.getElementById(id);
    for (const field of form.elements) {
      if (!field.name) continue;
      const raw = field.value.trim();
      values[field.name] = raw === '' ? undefined : Number(raw);
    }
  }
  return values;
}

export function renderResults(root = document) {
  const results = summarize(readInputs(root));
  const list = root.getElementById('results');
  list.replaceChildren();

  for (const item of DISPLAY) {
    const { value, error } = results[item.key];
    const term = root.createElement('dt');
    term.textContent = item.label;

    const detail = root.createElement('dd');
    if (error) {
      detail.textContent = error;
      detail.className = 'error';
    } else if (value === null) {
      detail.textContent = '—';
      detail.className = 'empty';
    } else {
      const shown = round(value, item.decimals);
      detail.textContent = `${shown.toLocaleString('en-US', { maximumFractionDigits: item.decimals })}${item.unit ? ` ${item.unit}` : ''}`;
    }
    const row = root.createElement('div');
    row.className = 'metric';
    row.append(term, detail);
    list.append(row);
  }
}

function init() {
  for (const id of FORMS) {
    document.getElementById(id).addEventListener('input', () => renderResults());
  }
  renderResults();
}

init();
