# Media KPI Calculator

A static, responsive calculator for paid media buyers. Enter campaign numbers and it computes CTR, CPC, CPM, CPA,
ROAS, break-even ROAS from your gross margin, the maximum CPA that still breaks even, gross profit after spend, and
the budget needed for a target number of purchases. The formulas live in a plain ES module with no dependencies
and are covered by `node:test` tests. The page is plain HTML, CSS and JavaScript and is ready for GitHub Pages.

## Features

- CTR, CPC, CPM, CPA, ROAS from campaign numbers.
- Break-even ROAS from a gross margin: `100 / margin %`. A 40% margin needs a ROAS of at least 2.5.
- Max CPA to break even: average order value x margin.
- Gross profit after ad spend: revenue x margin - spend.
- Budget for target purchases, from a known CPA or from the funnel (conversion rate and CPC).
- Results update as you type. A metric appears only when its inputs are complete. Invalid input, such as zero
  impressions, is reported on that metric only.
- Responsive layout: three input cards side by side on wide screens, stacked on phones. Dark mode follows the system
  setting.
- No build step, no npm dependencies, no tracking, no network requests. All maths runs in the browser.

## Quick start

Requires Node.js 22 or later for the tests. The page itself needs only a browser.

```bash
git clone https://github.com/nidhalom/media-kpi-calculator.git
cd media-kpi-calculator
npm test                       # runs node --test
python -m http.server 8000     # then open http://localhost:8000
```

Browsers block ES module imports from `file://` URLs, so open the page through a local server (as above) or through
GitHub Pages. Opening `index.html` directly shows empty results.

## Example output

Real output of the logic module for one set of campaign numbers (produced with `summarize()` from `js/kpi.js`):

```
input: spend 1200, impressions 180000, clicks 2700, conversions 54, revenue 4860,
       margin 40%, average order value 90, target purchases 200, known CPA 22.22

ctr            1.50
cpc            0.44
cpm            6.67
cpa            22.22
roas           4.05
breakEvenRoas  2.50
maxCpa         36.00
profit         744.00
budgetFromCpa  4444.00
```

Check: ROAS = 4860 / 1200 = 4.05, which is above the break-even ROAS of 2.5. Profit = 4860 x 0.40 - 1200 = 744.

Test run:

```
tests 22
suites 5
pass 22
fail 0
```

## Project structure

```
index.html              page layout and form fields
styles.css              responsive layout, light and dark theme
js/kpi.js               pure formulas, input validation, summarize()
js/app.js               reads the form, renders results (DOM only)
tests/kpi.test.js       unit tests for each formula and the validation rules
tests/summarize.test.js tests for the per-metric summary used by the page
package.json            `npm test` script, no dependencies
```

## How it works

- Every formula is a function that takes an object of named inputs and returns a number. Invalid inputs throw a
  `RangeError` or `TypeError` with a readable message.
- `summarize()` runs every formula whose inputs are present and returns `{ value, error }` per metric.
- `app.js` converts form fields to numbers (an empty field becomes `undefined`), calls `summarize()`, and renders
  one row per metric.

## Limitations

- Break-even ROAS and max CPA use gross margin only. They ignore shipping, returns, payment fees, and
  customer-service costs. Enter a margin that already reflects those if you need a realistic break-even.
- CPA here means spend divided by the conversions you enter. It does not model attribution windows or
  view-through conversions.
- The browser layer has no automated tests. Its behaviour was checked by loading the page in headless Edge and
  looking at the rendered result. The formulas are fully covered by `node:test`.
- Currency is not converted or formatted; all money values use the currency you type in.

## License

MIT. See [LICENSE](LICENSE).
