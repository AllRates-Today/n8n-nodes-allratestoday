# n8n-nodes-allratestoday

[![npm](https://img.shields.io/npm/v/n8n-nodes-allratestoday.svg)](https://www.npmjs.com/package/n8n-nodes-allratestoday)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](./tsconfig.json)
[![Sources](https://img.shields.io/badge/official%20sources-125-0a7d3e.svg)](https://allratestoday.com/api/open/central-banks)

An [n8n](https://n8n.io) community node for [AllRatesToday](https://allratestoday.com): the official exchange
rates published by [122 central banks and 4 tax authorities](https://allratestoday.com/central-bank-rates-api/institutions/) (no API key needed) and real-time mid-market rates
with amount conversion (free API key, 300 free requests).

## 🔑 Credentials

Official rates need no credential. For **Market Rate** operations add an **AllRatesToday API** credential
with your key from [allratestoday.com/register](https://allratestoday.com/register) (free, no card,
300 free requests). The key is sent as `Authorization: Bearer <key>`; the credential test calls
`/api/v1/rates?source=USD&target=EUR`.

## ⚡ Try it without a key

The official-rate endpoints the node uses are open. Same data, no account:

```sh
# USD → EUR as published by the ECB
curl "https://allratestoday.com/api/open/central-bank/ecb?source=USD&target=EUR"

# the full latest ECB table
curl "https://allratestoday.com/api/open/central-bank/ecb"

# every bank the node can pick from
curl "https://allratestoday.com/api/open/central-banks"
```

```json
{"bank":"ecb","rate_date":"2026-10-19","source":"USD","target":"EUR","rate":0.8908685969,"rate_type":"reference","derived":true,"method":"inverse","age_days":0,"stale":false,"cadence":"daily"}
```

**Attribution.** Keyless use requires a visible, followable link to AllRatesToday wherever the rates are shown (a footer, an about page, a README). With an API key it is appreciated but not required.

```html
<a href="https://allratestoday.com">Exchange rates by AllRatesToday</a>
```

Markdown: `Exchange rates by [AllRatesToday](https://allratestoday.com)`. Full wording: <https://allratestoday.com/terms/#attribution>.

## 🚀 Features

- **Official Rate → Get Pair** — one pair from any of [122 central banks and 4 tax authorities](https://allratestoday.com/central-bank-rates-api/institutions/) (ECB, Fed, BoE, RBI, SARB, HMRC, Swiss BAZG, …). Keyless.
- **Official Rate → Get Table** — the bank's whole latest table, one n8n item per published rate (or a single item). Keyless.
- **Market Rate → Get Rates** — real-time mid-market rates from a source currency to one, several or all 160+ currencies. API key.
- **Market Rate → Convert** — convert an amount at the live rate; the response carries both amounts and the rate used. API key.
- Bank list is loaded live from the API, so new sources appear without a package update.
- Works as an **AI agent tool** in n8n (`usableAsTool`), supports *Continue on Fail*, and pairs every output item with its input item.

## 📦 Installation

In n8n open **Settings → Community Nodes → Install**, enter `n8n-nodes-allratestoday` and confirm.
For a self-hosted instance you can also run:

```sh
npm install n8n-nodes-allratestoday
```

Guide: [Install community nodes](https://docs.n8n.io/integrations/community-nodes/installation/).

## 🏁 Quick start

1. Add the **AllRatesToday** node.
2. Resource **Official Rate**, operation **Get Pair**, bank **European Central Bank (ECB)**, source `USD`, target `EUR`.
3. Execute. The item looks like the JSON above: `rate`, `rate_date`, `rate_type`, and whether the pair was
   `published` directly or `derived` (`method: inverse | cross`).

For live rates switch the resource to **Market Rate**, pick your credential and set
`Target Currencies` to `EUR,GBP,JPY`.

## 📚 Operations and endpoints

| Resource | Operation | Endpoint | Output |
|---|---|---|---|
| Official Rate | Get Pair | `GET /api/open/central-bank/{bank}?source=USD&target=EUR` | `{bank, rate_date, source, target, rate, rate_type, derived, method, age_days, stale, cadence}` |
| Official Rate | Get Table | `GET /api/open/central-bank/{bank}` | one item per `{bank, rate_date, base, quote, type, value}` |
| Market Rate | Get Rates | `GET /api/v1/rates?source=USD&target=EUR,GBP` | one item per `{rate, source, target, time}` |
| Market Rate | Convert | `GET /api/v1/rates?source=USD&target=EUR&amount=100` | `{from:{currency,amount}, to:{currency,amount}, rate, source:"mid-market"}` |

Bank IDs come from `GET /api/open/central-banks` (`sources[].code`, e.g. `ecb`, `fed`, `boe`, `rbi`, `hmrc`).
Any endpoint also accepts `?format=csv|xml|xlsx` if you call it from an HTTP Request node instead.

## 🛡️ Error handling

| Situation | What you get |
|---|---|
| Unknown bank ID | HTTP 404 `No published table available for this source` |
| Missing or wrong API key (Market Rate) | HTTP 401 `Authentication required…` |
| Invalid currency code | Node error before any request is made |
| *Continue on Fail* enabled | an item `{ "error": "<message>" }` instead of a failed run |

## 🔗 Links

- Website: <https://allratestoday.com>
- Central-bank rates API: <https://allratestoday.com/central-bank-rates-api/>
- Documentation: <https://allratestoday.com/docs/>
- Pricing (dated tables, history): <https://allratestoday.com/pricing>
- n8n community nodes: <https://docs.n8n.io/integrations/community-nodes/>

## 📜 License

[MIT](./LICENSE). Official rates served through the open endpoints are free to use with visible attribution
linking to allratestoday.com.
