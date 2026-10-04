#!/usr/bin/env node
// Price, stock and brand from (almost) any product page, via the schema.org JSON-LD shops publish
// for Google. No dependencies, Node 18+.
//
//   node product-price.mjs https://www.zappos.com/p/crocs-classic-clog-black/product/7153812/color/3
//   node product-price.mjs url1 url2 url3 > prices.json

const UA = 'product-price-jsonld/1.0 (+https://github.com/swiftkit-dev/product-price-jsonld)';
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const types = (o) => arr(o?.['@type']).map(String);
const num = (x) => { const n = Number(String(x ?? '').replace(/[^\d.,-]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.')); return x != null && x !== '' && Number.isFinite(n) ? n : null; };

// Products hide in @graph arrays, ItemLists, ProductGroups with variants…
function findProducts(x, out = []) {
    if (!x || typeof x !== 'object') return out;
    if (Array.isArray(x)) { x.forEach((y) => findProducts(y, out)); return out; }
    if (types(x).some((t) => /^(Product|ProductGroup)$/.test(t))) out.push(x);
    for (const k of ['@graph', 'mainEntity', 'itemListElement', 'item']) if (x[k]) findProducts(x[k], out);
    return out;
}

function summarize(p) {
    // Offers can be a single Offer, an array, an AggregateOffer, or live under variants.
    let offers = arr(p.offers).flatMap((o) => (types(o).includes('AggregateOffer') && o.offers ? arr(o.offers) : [o]));
    if (!offers.length) offers = arr(p.hasVariant).flatMap((v) => arr(v.offers));
    // Some shops put the price in priceSpecification (sometimes an array).
    const priceOf = (o) => num(o.price ?? arr(o.priceSpecification)[0]?.price ?? o.lowPrice);
    const prices = offers.map(priceOf).filter((v) => v !== null);
    const o = offers[0] || {};
    const brand = arr(p.brand)[0];
    return {
        name: p.name ?? null,
        brand: typeof brand === 'string' ? brand : brand?.name ?? null,
        sku: p.sku ?? null,
        gtin: p.gtin13 ?? p.gtin ?? p.gtin12 ?? null,
        price: prices.length ? Math.min(...prices) : null,
        priceMax: prices.length > 1 ? Math.max(...prices) : null,
        currency: o.priceCurrency ?? arr(o.priceSpecification)[0]?.priceCurrency ?? null,
        availability: o.availability ? String(o.availability).split('/').pop() : null,
        rating: num(p.aggregateRating?.ratingValue),
        reviews: num(p.aggregateRating?.reviewCount ?? p.aggregateRating?.ratingCount),
    };
}

async function check(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow' });
    if (!res.ok) return { url, error: `HTTP ${res.status}` };
    const html = await res.text();
    const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const products = blocks.flatMap((m) => { try { return findProducts(JSON.parse(m[1].trim())); } catch { return []; } });
    if (!products.length) return { url, error: 'no schema.org Product data on this page' };
    return { url, ...summarize(products.find((p) => p.offers) || products[0]) };
}

const urls = process.argv.slice(2);
if (!urls.length) { console.error('Usage: node product-price.mjs <product page URL> [...]'); process.exitCode = 1; }
const results = [];
for (const u of urls) { results.push(await check(u)); }
console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
