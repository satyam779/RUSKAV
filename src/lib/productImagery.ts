/**
 * Which photographs stand in for a product that has none of its own.
 *
 * The print catalogue carries codes and dimensions, not photography, so until
 * a line has real images against it in Supabase it borrows from the shoot.
 * Two per product, not one, because the grid crossfades to a second angle on
 * hover — and a card that "changes" to the same picture reads as a bug.
 *
 * Each range is split the way the shoot was: a clean frame that shows the
 * object, and a styled frame that shows it in service. Primary is always the
 * object; the hover is always the room it ends up in. That ordering is what
 * makes forty cards feel like one catalogue rather than a folder of files.
 */
type Pool = { product: string[]; context: string[] };

const g = (name: string) => `/gallery/${name}.webp`;

const POOLS: Record<string, Pool> = {
  trays: {
    product: [
      g("studio-trays-stack"),
      g("studio-trays-black"),
      g("divided-trays-stack"),
      g("tray-service-narrow"),
      g("tray-service-black"),
    ],
    context: [
      g("tray-in-service-meal"),
      g("tray-in-service-red"),
      g("tray-fastfood-red"),
      g("tray-in-service-dark"),
    ],
  },
  compartment: {
    product: [
      g("studio-compartment-trays"),
      g("compartment-trays-float"),
      g("compartment-trays-fan"),
      g("compartment-trays-stack"),
      g("compartment-trays-colours"),
      g("compartment-trays-black"),
      g("compartment-tray-green"),
      g("compartment-tray-lidded"),
      g("compartment-tray-lid-red"),
      g("compartment-tray-lid-clear"),
    ],
    context: [
      g("compartment-carrier-loaded"),
      g("compartment-carrier-open"),
      g("compartment-trays-six"),
      g("compartment-trays-three"),
    ],
  },
  dinnerware: {
    product: [
      g("studio-plates"),
      g("plates-float"),
      g("plate-polycarbonate-rim"),
      g("plate-copolymer-white"),
      g("studio-bowls"),
      g("bowls-clear-row"),
      g("glass-bowls-lids"),
    ],
    context: [
      g("dinnerware-set-table"),
      g("studio-stoneware"),
      g("bowls-lidded-clear"),
      g("bowls-yellow-white"),
    ],
  },
  drinkware: {
    product: [
      g("studio-drinkware"),
      g("tumblers-float"),
      g("tumblers-clear-pair"),
      g("tumblers-colourways"),
      g("tumbler-frosted"),
      g("tumblers-row-table"),
    ],
    context: [
      g("tumblers-frosted-table"),
      g("tumblers-poured"),
      g("tumbler-in-service"),
    ],
  },
  bio: {
    product: [
      g("studio-bio"),
      g("bio-bowls"),
      g("bio-bowls-overhead"),
      g("bio-plates"),
      g("bio-cups"),
      g("bio-cups-float"),
      g("bio-compartment-tray"),
      g("bio-compartment-tray-float"),
    ],
    context: [
      g("bio-place-setting"),
      g("bio-dinnerware-set"),
      g("bio-bowls-nested"),
    ],
  },
};

const FALLBACK: Pool = {
  product: [g("studio-trays-stack")],
  context: [g("tray-in-service-meal")],
};

/** How many of each range have been handed out, so the shots rotate. */
const issued = new Map<string, number>();

/**
 * The pair for the next product in a range: object shot, then in-service shot.
 *
 * A range with a single context frame gives every one of its products the same
 * hover, which is fine — it is the same table — and still better than a hover
 * that does nothing.
 */
export function imagePairFor(categoryId: string | null): string[] {
  const pool = (categoryId && POOLS[categoryId]) || FALLBACK;
  const n = issued.get(categoryId ?? "") ?? 0;
  issued.set(categoryId ?? "", n + 1);

  const primary = pool.product[n % pool.product.length];
  const hover = pool.context[n % pool.context.length];
  // Never return the same file twice: the crossfade would look like a stall.
  return primary === hover ? [primary] : [primary, hover];
}
