import {
  categories,
  type CertKind,
  type ColorKey,
  type ProductLine,
  type SpecRow,
} from "../data/catalogue";

/**
 * Every product line in the catalogue, flattened out of the
 * category → group → products nesting so the whole range can be searched and
 * filtered in one pass. Derived at module load from `catalogue.ts`, which stays
 * the single source of truth — adding a product there adds it here.
 */
export type IndexedProduct = ProductLine & {
  categoryId: string;
  categoryName: string;
  categoryShortName: string;
  groupId: string;
  groupName: string;
  material: string;
  materialCode: string;
  surface?: string;
  colors: ColorKey[];
  certs: CertKind[];
  /** The group's tested figures — heat resistance, stain resistance and so on. */
  specs: SpecRow[];
  note?: string;
  highlight?: string;
  /** Pre-lowercased haystack, built once instead of per keystroke. */
  haystack: string;
};

export const allProducts: IndexedProduct[] = categories.flatMap((category) =>
  category.groups.flatMap((group) =>
    group.products.map((product) => ({
      ...product,
      categoryId: category.id,
      categoryName: category.name,
      categoryShortName: category.shortName,
      groupId: group.id,
      groupName: group.name,
      material: group.material,
      materialCode: group.materialCode,
      surface: group.surface,
      colors: group.colors,
      certs: group.certs,
      specs: group.specs ?? [],
      note: group.note,
      highlight: group.highlight,
      haystack: [
        product.code,
        product.description,
        product.size,
        group.name,
        group.material,
        group.materialCode,
        category.name,
        category.shortName,
      ]
        .join(" ")
        .toLowerCase(),
    }))
  )
);

export const productByCode = new Map(allProducts.map((p) => [p.code, p]));

/** Distinct materials present in the range, for the filter chips. */
export const materials = [...new Set(allProducts.map((p) => p.material))].sort();

export type ProductFilters = {
  query: string;
  categoryId: string | null;
  material: string | null;
  cert: CertKind | null;
};

export const emptyFilters: ProductFilters = {
  query: "",
  categoryId: null,
  material: null,
  cert: null,
};

/**
 * All whitespace-separated terms must match somewhere in the row, so
 * "tray 12" narrows rather than widening the way an OR match would.
 */
export function searchProducts(filters: ProductFilters, source = allProducts) {
  const terms = filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  return source.filter((p) => {
    if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
    if (filters.material && p.material !== filters.material) return false;
    if (filters.cert && !p.certs.includes(filters.cert)) return false;
    return terms.every((term) => p.haystack.includes(term));
  });
}

export const hasActiveFilters = (f: ProductFilters) =>
  !!(f.query.trim() || f.categoryId || f.material || f.cert);
