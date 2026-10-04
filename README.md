# product-price-jsonld

Get **price, currency, stock, brand, SKU, GTIN and rating** from (almost) any product page, by
reading the schema.org JSON-LD that shops publish for Google Shopping. No site-specific
selectors, no dependencies, Node 18+.

```bash
node product-price.mjs https://www.zappos.com/p/crocs-classic-clog-black/product/7153812/color/3
```

```json
{
  "url": "https://www.zappos.com/p/crocs-classic-clog-black/product/7153812/color/3",
  "name": "Classic Clogs",
  "brand": "Crocs",
  "sku": "7153812",
  "price": 49.99,
  "currency": "USD",
  "availability": "InStock",
  "rating": 5,
  "reviews": 40752
}
```

## The traps it handles

- Products hide in `@graph` arrays, `ItemList`s and `ProductGroup`s with `hasVariant`.
- `offers` can be one Offer, an array, or an `AggregateOffer` with `lowPrice`/`highPrice`.
- Some shops (IKEA, for example) put the price in `priceSpecification`, sometimes as an **array**.
- Prices come as numbers or strings (`"49.99"`, `"1.299,00"`); `availability` is a schema.org URL
  (`https://schema.org/InStock`).
- With several variants, it reports the lowest price and `priceMax`.

## What it can't do

- Pages that inject JSON-LD with JavaScript, or shops that block bots (many big retailers return
  403 or a bot check). Respect that.
- Shops may localize prices to your location.

## Hosted version

Many URLs at once, category pages (finds product links for you), price-change tracking between
runs (previous price, change, % change, availability changes), robots.txt respected:
**[Product Page Scraper](https://apify.com/swiftkit/product-pages)** on Apify.

## License

MIT.
