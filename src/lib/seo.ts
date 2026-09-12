import { useEffect } from "react";
import { effectivePrice, type ShopProduct } from "./products";
import { COLOR_LABEL } from "../data/catalogue";

/**
 * Per-page metadata for a single-page app.
 *
 * `index.html` carries the site-wide Organization and WebSite graph, which is
 * right for every route that describes the company. A product page describes
 * one sellable thing instead, and search engines will only show a price, a
 * stock state or a rating against `Product` markup — so each one adds its own
 * block on mount and takes it away again on unmount.
 */

/** Absolute URL for the deployed origin, whatever domain that turns out to be. */
const absolute = (path: string) =>
  path.startsWith("http") ? path : `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;

const AVAILABILITY: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  made_to_order: "https://schema.org/PreOrder",
  out_of_stock: "https://schema.org/OutOfStock",
};

function useJsonLd(id: string, data: object | null) {
  const serialised = data ? JSON.stringify(data) : null;

  useEffect(() => {
    if (!serialised) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seo = id;
    script.textContent = serialised;
    document.head.appendChild(script);
    return () => script.remove();
  }, [id, serialised]);
}

/**
 * Keeps the meta description in step with the route, restoring the site-wide
 * one on the way out so a product's summary never leaks onto another page.
 */
function useMetaDescription(text: string | null) {
  useEffect(() => {
    if (!text) return;
    const tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) return;
    const previous = tag.content;
    tag.content = text;
    return () => {
      tag.content = previous;
    };
  }, [text]);
}

/** One sentence describing the product, for search results and link previews. */
export function productSummary(product: ShopProduct, categoryName?: string) {
  if (product.description) return product.description;

  const parts = [
    product.size,
    product.material,
    `case of ${product.casePack}`,
    categoryName?.toLowerCase(),
  ].filter(Boolean);

  return `${product.code} — ${product.name}. ${parts.join(", ")}. Manufactured in India by RUSKAV Food Service Products.`;
}

export function useProductSeo(product: ShopProduct | undefined, categoryName?: string) {
  const description = product ? productSummary(product, categoryName) : null;
  useMetaDescription(description);

  const price = product ? effectivePrice(product) : null;

  useJsonLd(
    "product",
    product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: [product.name, product.size].filter(Boolean).join(" "),
          sku: product.code,
          mpn: product.code,
          description,
          category: categoryName,
          image: product.images.map(absolute),
          brand: { "@type": "Brand", name: "RUSKAV" },
          manufacturer: { "@id": `${window.location.origin}/#organization` },
          ...(product.material ? { material: product.material } : {}),
          ...(product.colors.length
            ? { color: product.colors.map((c) => COLOR_LABEL[c]).join(", ") }
            : {}),
          ...(product.caseWeightKg
            ? {
                weight: {
                  "@type": "QuantitativeValue",
                  value: product.caseWeightKg,
                  unitCode: "KGM",
                },
              }
            : {}),
          additionalProperty: [
            { name: "Case pack", value: `${product.casePack} ea.` },
            ...(product.size ? [{ name: "Size", value: product.size }] : []),
            ...(product.hsnCode ? [{ name: "HSN code", value: product.hsnCode }] : []),
            ...product.specs.map((s) => ({ name: s.label, value: s.value })),
          ].map((p) => ({ "@type": "PropertyValue", ...p })),
          // Only a real figure earns an Offer. Marking a price-on-request line
          // up as costing nothing is worse than leaving it unpriced.
          ...(price !== null
            ? {
                offers: {
                  "@type": "Offer",
                  url: window.location.href,
                  priceCurrency: product.currency,
                  price,
                  itemCondition: "https://schema.org/NewCondition",
                  availability:
                    AVAILABILITY[product.stockStatus] ?? "https://schema.org/InStock",
                  eligibleQuantity: {
                    "@type": "QuantitativeValue",
                    minValue: product.moq,
                    unitText: product.priceUnit,
                  },
                  seller: { "@id": `${window.location.origin}/#organization` },
                },
              }
            : {}),
        }
      : null
  );
}
