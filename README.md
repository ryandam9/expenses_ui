# 💸 FinDash — Personal Finance Dashboard

A single-page, **100% client-side** dashboard for exploring personal bank
transactions stored in a SQLite database. You load your `expenses.db` file in
the browser and the app parses it in-place with WebAssembly — **no data ever
leaves your machine**.

> Neo-brutalist UI · zero backend · works offline once the libraries are cached.

---

## Features

- **Monthly Expenses view** — bar chart of spend by category, summary cards
  (expenses / credits / net balance), a category breakdown table, and a fully
  filterable, sortable, paginated transaction table.
- **By Category view** — month-over-month bar chart and transactions for a
  single category.
- **Filtering** — by month, by category (multi-select), and free-text search on
  the description.
- **Sorting** — every column, keyboard accessible (Tab to a header, Enter/Space
  to sort).
- **Exports** — download the current table as **Excel**, **PDF**, or **PNG**.
- **Persistence** — the loaded database is cached in IndexedDB, so a refresh
  keeps your data without re-selecting the file.

## Getting started

Because the app loads a WebAssembly module and uses IndexedDB, serve it over
HTTP rather than opening `index.html` from the filesystem:

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000
```

Then drag-and-drop (or browse for) your `expenses.db` file.

## Expected database schema

The app reads a single table named `expenses`. The columns it uses:

| Column        | Type    | Notes                                        |
| ------------- | ------- | -------------------------------------------- |
| `date`        | TEXT    | `YYYY-MM-DD` (ISO) format                    |
| `description` | TEXT    | Free text                                    |
| `category`    | TEXT    | e.g. `GROCERIES`, `RENT`, `TRANSPORT`        |
| `source`      | TEXT    | Bank / account name                          |
| `debit`       | REAL    | Money out (expense)                          |
| `credit`      | REAL    | Money in                                     |

Minimal example:

```sql
CREATE TABLE expenses (
  date        TEXT,
  description TEXT,
  category    TEXT,
  source      TEXT,
  debit       REAL,
  credit      REAL
);
```

## Configuration

A few settings live at the top of [`app.js`](app.js):

- `LOCALE` / `CURRENCY` — formatting of all amounts (default `en-US` / `USD`;
  set to e.g. `en-AU` / `AUD` to localise).
- `EXCLUDED_CATEGORIES` — categories dropped entirely on load (default
  `TRANSFERS`, treated as internal money movement rather than spending).

## Security & privacy

- **Local only.** Your database is parsed in the browser and stored in your
  browser's IndexedDB. Nothing is sent to any server.
- **Untrusted database content** (descriptions, categories, etc.) is
  HTML-escaped before being rendered, so a maliciously crafted `.db` cannot
  inject script.
- **Third-party libraries are loaded from CDNs.** For defence-in-depth you can
  add [Subresource Integrity](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity)
  hashes to the `<script>` tags in `index.html`. Generate a hash with:

  ```bash
  curl -s <cdn-url> | openssl dgst -sha384 -binary | openssl base64 -A
  ```

  then add `integrity="sha384-…" crossorigin="anonymous"` to the tag. (Better
  still, vendor the libraries locally so the app also works fully offline.)

## Project structure

```
index.html   # markup + CDN library includes
styles.css   # neo-brutalist theme
app.js       # all application logic (load, filter, sort, render, export)
```

## Possible future improvements

- Date-range filter (arbitrary from/to) in addition to single-month.
- Month-over-month comparison and a savings-rate / averages panel.
- Per-category monthly budgets with over/under indicators.
- A global search box across all fields.
- Dark mode toggle.
- A small test suite around the aggregation/filter helpers.

## License

MIT — see [`LICENSE`](LICENSE). Adjust the copyright holder as you like.
