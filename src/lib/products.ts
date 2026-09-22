import { useEffect, useState } from "react";
import { type CertKind, type ColorKey } from "../data/catalogue";
import { imagePairFor } from "./productImagery";
import { allProducts } from "./catalogueIndex";
import { isSupabaseConfigured, supabase } from "./supabase";

export type SpecRow = { label: string; value: string };

/**
 * One sellable line. This is the shape the shop, the product pages and the
 * admin all speak, whether the row came from Supabase or from the static
 * print-catalogue data.
 */
export type ShopProduct = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  groupName: string | null;

  size: string | null;
  casePack: number;
  material: string | null;
  materialCode: string | null;
  surface: string | null;
  colors: ColorKey[];
  certs: CertKind[];
  specs: SpecRow[];
  qualityNotes: string | null;

  /** Per `priceUnit`, before discount. Null means "price on request". */
  price: number | null;
  mrp: number | null;
  discountPercent: number;
  priceUnit: string;
  currency: string;
  taxPercent: number;
  moq: number;

  /** Trade detail. All optional — the spec sheet shows only what is filled in. */
  hsnCode: string | null;
  leadTime: string | null;
  /** Gross weight of one case, in kg. */
  caseWeightKg: number | null;
  /** Outer carton, as typed: "60 x 40 x 45 cm". */
  cartonSize: string | null;

  stockStatus: string;
  images: string[];
  /**
   * One photograph per colourway, keyed by colour. Pressing a swatch on the
   * product page shows that colour; a colour with no entry simply stays a
   * swatch, which is honest about what we have shot.
   */
  colorImages: Partial<Record<ColorKey, string>>;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

/** Row shape as it comes back from Supabase (snake_case columns). */
type ProductRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category_id: string | null;
  group_name: string | null;
  size: string | null;
  case_pack: number | null;
  material: string | null;
  material_code: string | null;
  surface: string | null;
  colors: string[] | null;
  certs: string[] | null;
  specs: SpecRow[] | null;
  quality_notes: string | null;
  price: number | string | null;
  mrp: number | string | null;
  discount_percent: number | string | null;
  price_unit: string | null;
  currency: string | null;
  tax_percent: number | string | null;
  moq: number | null;
  hsn_code: string | null;
  lead_time: string | null;
  case_weight_kg: number | string | null;
  carton_size: string | null;
  stock_status: string | null;
  images: string[] | null;
  color_images: Record<string, string> | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  sort_order: number | null;
};

// Postgres `numeric` arrives as a string over the wire, so every money field
// has to be coerced rather than trusted.
const num = (v: number | string | null | undefined, fallback = 0) => {
  if (v === null || v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

export function fromRow(row: ProductRow): ShopProduct {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    groupName: row.group_name,
    size: row.size,
    casePack: row.case_pack ?? 1,
    material: row.material,
    materialCode: row.material_code,
    surface: row.surface,
    colors: (row.colors ?? []) as ColorKey[],
    certs: (row.certs ?? []) as CertKind[],
    specs: row.specs ?? [],
    qualityNotes: row.quality_notes,
    price: row.price === null || row.price === undefined ? null : num(row.price),
    mrp: row.mrp === null || row.mrp === undefined ? null : num(row.mrp),
    discountPercent: num(row.discount_percent),
    priceUnit: row.price_unit ?? "case",
    currency: row.currency ?? "INR",
    taxPercent: num(row.tax_percent, 18),
    moq: row.moq ?? 1,
    hsnCode: row.hsn_code ?? null,
    leadTime: row.lead_time ?? null,
    caseWeightKg:
      row.case_weight_kg === null || row.case_weight_kg === undefined
        ? null
        : num(row.case_weight_kg),
    cartonSize: row.carton_size ?? null,
    stockStatus: row.stock_status ?? "in_stock",
    images: row.images ?? [],
    // A column that predates this feature comes back null, and a hand-edited
    // row can come back as anything — neither should crash a product page.
    colorImages:
      row.color_images && typeof row.color_images === "object"
        ? (row.color_images as Partial<Record<ColorKey, string>>)
        : {},
    isPublished: row.is_published ?? true,
    isFeatured: row.is_featured ?? false,
    sortOrder: row.sort_order ?? 0,
  };
}

/** The reverse, for admin writes. */
export function toRow(p: ShopProduct) {
  return {
    code: p.code.trim(),
    name: p.name.trim(),
    description: p.description,
    category_id: p.categoryId,
    group_name: p.groupName,
    size: p.size,
    case_pack: p.casePack,
    material: p.material,
    material_code: p.materialCode,
    surface: p.surface,
    colors: p.colors,
    certs: p.certs,
    specs: p.specs,
    quality_notes: p.qualityNotes,
    price: p.price,
    mrp: p.mrp,
    discount_percent: p.discountPercent,
    price_unit: p.priceUnit,
    currency: p.currency,
    tax_percent: p.taxPercent,
    moq: p.moq,
    hsn_code: p.hsnCode,
    lead_time: p.leadTime,
    case_weight_kg: p.caseWeightKg,
    carton_size: p.cartonSize,
    stock_status: p.stockStatus,
    images: p.images,
    color_images: p.colorImages,
    is_published: p.isPublished,
    is_featured: p.isFeatured,
    sort_order: p.sortOrder,
  };
}

/**
 * The print catalogue as sellable rows, used until Supabase is configured and
 * as the fallback if it ever fails. No prices exist in the print data, so
 * these render as "price on request" rather than as free.
 */
export const fallbackProducts: ShopProduct[] = allProducts.map((p, i) => ({
  id: `static-${p.code}`,
  code: p.code,
  name: p.description,
  description: null,
  categoryId: p.categoryId,
  groupName: p.groupName,
  size: p.size,
  casePack: Number.parseInt(p.casePack, 10) || 1,
  material: p.material,
  materialCode: p.materialCode,
  surface: p.surface ?? null,
  colors: p.colors,
  certs: p.certs,
  // The print catalogue tests every line for heat, stain and shock resistance.
  // Dropping those rows here used to leave the product page with no
  // specification at all until someone connected a database.
  specs: p.specs,
  qualityNotes: p.highlight ?? p.note ?? null,
  price: null,
  mrp: null,
  discountPercent: 0,
  priceUnit: "case",
  currency: "INR",
  taxPercent: 18,
  moq: 1,
  hsnCode: null,
  leadTime: null,
  caseWeightKg: null,
  cartonSize: null,
  stockStatus: "in_stock",
  images: imagePairFor(p.categoryId),
  colorImages: {},
  isPublished: true,
  isFeatured: i < 6,
  sortOrder: i,
}));

export type ProductsState = {
  products: ShopProduct[];
  loading: boolean;
  /** True when showing the print catalogue because there is no live data. */
  usingFallback: boolean;
  error: string | null;
  reload: () => void;
};

/**
 * The sellable range.
 *
 * Once a database is connected, it is the only source: an empty `products`
 * table means an empty shop, because "empty" is an answer and the print
 * catalogue is not it. Filling a shop with thirty-nine lines the business has
 * not priced, cannot fulfil from stock and did not choose to list is worse
 * than showing nothing.
 *
 * The print catalogue still stands in for two cases where it is genuinely the
 * better answer: no backend configured at all (a checkout of this repo should
 * demo), and a failed request (a network blip should not blank a live shop).
 */
export function useProducts({ includeUnpublished = false } = {}): ProductsState {
  const [products, setProducts] = useState<ShopProduct[]>(
    isSupabaseConfigured ? [] : fallbackProducts
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [usingFallback, setUsingFallback] = useState(!isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    setLoading(true);

    let query = supabase.from("products").select("*").order("sort_order", { ascending: true });
    if (!includeUnpublished) query = query.eq("is_published", true);

    query.then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        // A missing table or a network failure must not blank a live shop —
        // fall back to the print catalogue and say so.
        setError(err.message);
        setUsingFallback(true);
        setProducts(fallbackProducts);
        return;
      }
      const rows = (data ?? []) as ProductRow[];
      if (rows.length === 0) {
        // Connected and empty. The admin has not added anything yet, and the
        // shop says exactly that rather than inventing a catalogue.
        setUsingFallback(false);
        setError(null);
        setProducts([]);
        return;
      }
      setUsingFallback(false);
      setError(null);
      setProducts(rows.map(fromRow));
    });

    return () => {
      cancelled = true;
    };
  }, [includeUnpublished, nonce]);

  return { products, loading, usingFallback, error, reload: () => setNonce((n) => n + 1) };
}

// ------------------------------------------------------------------ pricing

/** What one unit actually costs after the discount, excluding tax. */
export const effectivePrice = (p: Pick<ShopProduct, "price" | "discountPercent">) =>
  p.price === null ? null : round2(p.price * (1 - p.discountPercent / 100));

/**
 * The figure to strike through. Prefer an explicit MRP; otherwise, if a
 * discount is set, the undiscounted price serves the same purpose.
 */
export const compareAtPrice = (p: Pick<ShopProduct, "price" | "mrp" | "discountPercent">) => {
  if (p.mrp && p.price !== null && p.mrp > p.price) return p.mrp;
  if (p.discountPercent > 0 && p.price !== null) return p.price;
  return null;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function formatMoney(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export const hasPrice = (p: ShopProduct) => p.price !== null && p.price > 0;

/**
 * The price this buyer actually pays: the product's own discount first, then
 * their trade band on top.
 *
 * The two compose rather than compete. A seasonal 10% off and a Dealer A band
 * are two separate promises the business made, and picking the larger of them
 * would quietly break one.
 */
export const tieredPrice = (
  p: Pick<ShopProduct, "price" | "discountPercent">,
  tierDiscountPercent: number
) => {
  const base = effectivePrice(p);
  if (base === null) return null;
  const pct = Math.min(99, Math.max(0, tierDiscountPercent));
  return round2(base * (1 - pct / 100));
};

/** Per piece, after the product discount and the band. */
export const tieredPricePerPiece = (
  p: Pick<ShopProduct, "price" | "discountPercent" | "priceUnit" | "casePack">,
  tierDiscountPercent: number
) => {
  const unit = tieredPrice(p, tierDiscountPercent);
  return unit === null ? null : round2(unit / piecesPerUnit(p));
};

/**
 * How many pieces are in one sold unit.
 *
 * Almost everything sells by the case, but a line priced per piece has a case
 * pack too — so dividing by `casePack` unconditionally would quote a twelfth
 * of the real price. The unit decides.
 */
export const piecesPerUnit = (p: Pick<ShopProduct, "priceUnit" | "casePack">) =>
  p.priceUnit === "case" ? Math.max(1, p.casePack) : 1;

/**
 * What one piece costs, after discount and before tax.
 *
 * Buyers compare per piece even when they order by the case, so this figure is
 * shown wherever a case price is.
 */
export const pricePerPiece = (
  p: Pick<ShopProduct, "price" | "discountPercent" | "priceUnit" | "casePack">
) => {
  const unit = effectivePrice(p);
  return unit === null ? null : round2(unit / piecesPerUnit(p));
};
