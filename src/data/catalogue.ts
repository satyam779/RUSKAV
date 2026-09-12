export type CertKind = "food" | "dishwasher" | "freezer" | "microwave" | "tuv";

export const CERT_LABEL: Record<CertKind, string> = {
  food: "Food-contact safe",
  dishwasher: "Dishwasher safe",
  freezer: "Freezer safe",
  microwave: "Microwave safe",
  tuv: "TÜV Rheinland tested",
};

export type ColorKey =
  | "white"
  | "yellow"
  | "red"
  | "beige"
  | "green"
  | "crimson"
  | "black"
  | "brown"
  | "olive"
  | "blue"
  | "transparent"
  | "natural";

export const COLOR_HEX: Record<ColorKey, string> = {
  white: "#f8f7f2",
  yellow: "#eebc2c",
  red: "#c62a2e",
  beige: "#cda877",
  green: "#157a4d",
  crimson: "#9c1730",
  black: "#1c1a17",
  brown: "#5a3826",
  olive: "#5c6b35",
  blue: "#1f3f83",
  transparent: "transparent",
  natural: "#c7ac83",
};

export const COLOR_LABEL: Record<ColorKey, string> = {
  white: "White",
  yellow: "Yellow",
  red: "Red",
  beige: "Beige",
  green: "Green",
  crimson: "Crimson",
  black: "Black",
  brown: "Brown",
  olive: "Olive Green",
  blue: "Blue",
  transparent: "Transparent",
  natural: "Natural Bio-tone",
};

export type SpecRow = { label: string; value: string };

export type ProductLine = {
  code: string;
  description: string;
  size: string;
  casePack: string;
};

export type ProductGroup = {
  id: string;
  name: string;
  material: string;
  materialCode: string;
  surface?: string;
  colors: ColorKey[];
  specs?: SpecRow[];
  products: ProductLine[];
  note?: string;
  highlight?: string;
  certs: CertKind[];
};

export type Category = {
  id: string;
  name: string;
  shortName: string;
  kicker: string;
  tagline: string;
  paragraphs: string[];
  bullets: string[];
  heroImage: string;
  /**
   * The full-screen masthead wall. Kept apart from `heroImage`: that is a
   * portrait cut-out on transparency, which cropped to a landscape screen
   * shows a slice of product over bare paper.
   */
  backdropImage: string;
  secondaryImages: string[];
  thumb: string;
  theme: "brand" | "bio";
  groups: ProductGroup[];
};

const commonCafeteriaBullets = [
  "Sturdy and attractive, built for solid, user-friendly service",
  "Made from virgin, food-contact-safe material",
  "Perfect for self-serve, quick-serve dining in schools, colleges and restaurants",
  "Highly durable, long-lasting ABS and Co-Polymer construction",
  "Attractively textured surface hides scratches",
];

export const categories: Category[] = [
  {
    id: "trays",
    name: "Cafeteria & Fast Food Trays",
    shortName: "Trays",
    kicker: "Front of house",
    tagline: "Built to survive the rush, table after table.",
    paragraphs: [
      "They are sturdy and attractive, for solid, user-friendly service — made from virgin, food-contact-safe material and perfected for self-serve, quick-serve dining in schools, colleges and restaurants.",
      "Moulded in highly durable ABS and Co-Polymer with an attractively textured basket-weave surface that hides scratches through years of daily washing and stacking.",
    ],
    bullets: commonCafeteriaBullets,
    heroImage: "/gallery/tray-in-service-meal.webp",
    backdropImage: "/gallery/tray-in-service-red.webp",
    secondaryImages: [
      "/gallery/tray-fastfood-red.webp",
      "/gallery/tray-service-black.webp",
      "/gallery/tray-service-narrow.webp",
      "/gallery/tray-in-service-dark.webp",
    ],
    thumb: "/gallery/tray-in-service-red.webp",
    theme: "brand",
    groups: [
      {
        id: "budget-tray",
        name: "Budget Tray",
        material: "ABS",
        materialCode: "ABS",
        surface: "Textured (basket weave)",
        colors: ["white", "yellow", "red", "beige", "green", "crimson", "black", "brown", "olive", "blue", "transparent"],
        specs: [
          { label: "Performance", value: "Excellent" },
          { label: "Stacking lugs", value: "Yes" },
          { label: "Dishwasher safe", value: "Yes" },
          { label: "Chemical resistance", value: "Excellent" },
          { label: "Drying test", value: "Excellent" },
          { label: "Shock resistance", value: "Good" },
          { label: "Break resistance", value: "Good" },
          { label: "Scratch resistance", value: "Very good" },
          { label: "Stain resistance", value: "Very good" },
          { label: "Heat resistance", value: "-10°C to +82°C" },
        ],
        products: [
          { code: "RT1014", description: "Fast Food Tray", size: "10\" x 14\"", casePack: "50" },
          { code: "RT1216", description: "Fast Food Tray", size: "12\" x 16\"", casePack: "50" },
          { code: "RT1418", description: "Fast Food Tray", size: "14\" x 18\"", casePack: "25" },
        ],
        note: "Transparent available only in SAN.",
        certs: ["food", "dishwasher", "freezer", "tuv"],
      },
      {
        id: "rupee-saver-tray",
        name: "Rupee Saver Tray",
        material: "Co-Polymer",
        materialCode: "5 PP",
        surface: "Textured (basket weave)",
        colors: ["white", "yellow", "red", "beige", "green", "crimson", "black", "brown", "olive", "blue", "transparent"],
        specs: [
          { label: "Performance", value: "Excellent" },
          { label: "Stacking lugs", value: "Yes" },
          { label: "Dishwasher safe", value: "Yes" },
          { label: "Chemical resistance", value: "Excellent" },
          { label: "Drying test", value: "Excellent" },
          { label: "Shock resistance", value: "Good" },
          { label: "Break resistance", value: "Excellent" },
          { label: "Scratch resistance", value: "Very good" },
          { label: "Stain resistance", value: "Very good" },
          { label: "Heat resistance", value: "-10°C to +75°C" },
        ],
        products: [
          { code: "RT1014RS", description: "Fast Food Tray", size: "10\" x 14\"", casePack: "50" },
          { code: "RT1216RS", description: "Fast Food Tray", size: "12\" x 16\"", casePack: "50" },
          { code: "RT1418RS", description: "Fast Food Tray", size: "14\" x 18\"", casePack: "25" },
        ],
        note: "Transparent available only in SAN.",
        highlight: "Our most economical tray without compromising on break resistance.",
        certs: ["food", "dishwasher", "freezer", "microwave", "tuv"],
      },
      {
        id: "budget-handle-tray",
        name: "Budget Handle Tray",
        material: "ABS",
        materialCode: "ABS",
        surface: "Textured (basket weave)",
        colors: ["white", "yellow", "red", "beige", "green", "crimson", "black", "brown", "olive", "blue", "transparent"],
        specs: [
          { label: "Performance", value: "Excellent" },
          { label: "Stacking lugs", value: "Yes" },
          { label: "Dishwasher safe", value: "Yes" },
          { label: "Chemical resistance", value: "Excellent" },
          { label: "Shock resistance", value: "Good" },
          { label: "Break resistance", value: "Good" },
          { label: "Heat resistance", value: "-10°C to +82°C" },
        ],
        products: [{ code: "RT1217H", description: "Fast Food Tray with Handle", size: "12\" x 17\"", casePack: "50" }],
        note: "Transparent available only in SAN.",
        certs: ["food", "dishwasher", "freezer", "tuv"],
      },
      {
        id: "rupee-saver-handle-tray",
        name: "Rupee Saver Handle Tray",
        material: "Co-Polymer",
        materialCode: "5 PP",
        surface: "Textured (basket weave)",
        colors: ["white", "yellow", "red", "beige", "green", "crimson", "black", "brown", "olive", "blue", "transparent"],
        specs: [
          { label: "Performance", value: "Excellent" },
          { label: "Stacking lugs", value: "Yes" },
          { label: "Dishwasher safe", value: "Yes" },
          { label: "Break resistance", value: "Excellent" },
          { label: "Heat resistance", value: "-10°C to +75°C" },
        ],
        products: [{ code: "RT1216HRS", description: "Fast Food Tray with Handle", size: "12\" x 17\"", casePack: "50" }],
        note: "Transparent available only in SAN.",
        certs: ["food", "dishwasher", "freezer", "microwave", "tuv"],
      },
      {
        id: "doughnut-tray",
        name: "Doughnut Tray",
        material: "ABS",
        materialCode: "ABS",
        surface: "Plain",
        colors: ["white", "black"] as ColorKey[],
        specs: [
          { label: "Performance", value: "Excellent" },
          { label: "Stacking lugs", value: "Yes" },
          { label: "Dishwasher safe", value: "Yes" },
          { label: "Break resistance", value: "Good" },
          { label: "Heat resistance", value: "-10°C to +82°C" },
        ],
        products: [{ code: "RTD", description: "Doughnut Tray", size: "650mm x 230mm", casePack: "24" }],
        certs: ["food", "dishwasher", "freezer", "tuv"],
      },
    ],
  },
  {
    id: "compartment",
    name: "Compartment Trays & Plates",
    shortName: "Compartment Trays",
    kicker: "Portion control",
    tagline: "One tray, every course — sorted.",
    paragraphs: [
      "Sturdy and attractive compartment plates for self-serve, quick-serve dining across cafeterias, food courts, hospitals, schools, colleges and restaurants.",
      "Moulded in highly durable, long-lasting Co-Polymer with an attractively textured surface that hides scratches — available with translucent snap lids for pre-packed, on-the-go meals.",
    ],
    bullets: [
      "Sturdy and attractive, for solid, user-friendly service",
      "Made from virgin, food-contact-safe material",
      "Perfect for cafeterias, food courts, hospitals, schools, colleges and restaurants",
      "Highly durable, long-lasting Co-Polymer construction",
      "Attractively textured surface hides scratches",
    ],
    heroImage: "/gallery/studio-trays-stack.webp",
    backdropImage: "/gallery/studio-trays-stack.webp",
    secondaryImages: [
      "/gallery/compartment-trays-fan.webp",
      "/gallery/compartment-trays-six.webp",
      "/gallery/compartment-trays-three.webp",
      "/gallery/compartment-trays-black.webp",
      "/gallery/compartment-trays-stack.webp",
      "/gallery/compartment-tray-green.webp",
      "/gallery/compartment-tray-lidded.webp",
      "/gallery/compartment-tray-lid-red.webp",
      "/gallery/compartment-tray-lid-clear.webp",
      "/gallery/compartment-carrier-open.webp",
      "/gallery/compartment-carrier-loaded.webp",
    ],
    thumb: "/gallery/compartment-trays-colours.webp",
    theme: "brand",
    groups: [
      {
        id: "comp-03",
        name: "03 Compartment Plate",
        material: "Co-Polymer",
        materialCode: "5 PP",
        surface: "Textured",
        colors: ["white", "yellow", "brown", "beige", "green", "crimson", "blue", "black"],
        specs: [
          { label: "Performance", value: "Excellent" },
          { label: "Stacking lugs", value: "Yes" },
          { label: "Dishwasher safe", value: "Yes" },
          { label: "Chemical resistance", value: "Excellent" },
          { label: "Break resistance", value: "Excellent" },
          { label: "Scratch resistance", value: "Very good" },
          { label: "Heat resistance", value: "-10°C to +75°C" },
        ],
        products: [
          { code: "RTCOMP03RS", description: "03 Compartment Plate", size: "10\" x 8\"", casePack: "50" },
          { code: "03COMP-L", description: "03 Compartment Translucent Lid", size: "10\" x 8\"", casePack: "50" },
        ],
        certs: ["food", "dishwasher", "freezer", "microwave", "tuv"],
      },
      {
        id: "comp-04",
        name: "04 Compartment Plate",
        material: "Co-Polymer",
        materialCode: "5 PP",
        surface: "Textured",
        colors: ["white", "yellow", "brown", "beige", "green", "crimson", "blue", "black"],
        specs: [
          { label: "Performance", value: "Excellent" },
          { label: "Stacking lugs", value: "Yes" },
          { label: "Dishwasher safe", value: "Yes" },
          { label: "Break resistance", value: "Excellent" },
          { label: "Heat resistance", value: "-10°C to +75°C" },
        ],
        products: [{ code: "RTCOMP04RS", description: "04 Compartment Plate", size: "10\" x 12\"", casePack: "50" }],
        certs: ["food", "dishwasher", "freezer", "microwave", "tuv"],
      },
      {
        id: "comp-06",
        name: "06 Compartment Plate",
        material: "Co-Polymer",
        materialCode: "5 PP",
        surface: "Textured",
        colors: ["white", "yellow", "brown", "beige", "green", "crimson", "blue", "black"],
        specs: [
          { label: "Performance", value: "Excellent" },
          { label: "Stacking lugs", value: "Yes" },
          { label: "Dishwasher safe", value: "Yes" },
          { label: "Break resistance", value: "Excellent" },
          { label: "Heat resistance", value: "-10°C to +75°C" },
        ],
        products: [
          { code: "RTCOMP06RS", description: "06 Compartment Plate", size: "10\" x 14\"", casePack: "50" },
          { code: "06COMP-L", description: "06 Compartment Translucent Lid", size: "10\" x 14\"", casePack: "50" },
        ],
        certs: ["food", "dishwasher", "freezer", "microwave", "tuv"],
      },
      {
        id: "comp-07",
        name: "07 Compartment Plate",
        material: "Co-Polymer",
        materialCode: "5 PP",
        surface: "Textured",
        colors: ["white", "yellow", "brown", "beige", "green", "crimson", "blue", "black"],
        specs: [
          { label: "Performance", value: "Excellent" },
          { label: "Stacking lugs", value: "Yes" },
          { label: "Dishwasher safe", value: "Yes" },
          { label: "Break resistance", value: "Excellent" },
          { label: "Heat resistance", value: "-10°C to +75°C" },
        ],
        products: [{ code: "RTCOMP07RS", description: "07 Compartment Plate", size: "10\" x 16\"", casePack: "50" }],
        certs: ["food", "dishwasher", "freezer", "microwave", "tuv"],
      },
      {
        id: "comp-06-new",
        name: "06 Compartment Tray (New)",
        material: "Co-Polymer",
        materialCode: "5 PP",
        surface: "Plain",
        colors: ["white", "yellow", "brown", "beige", "green", "crimson", "blue", "black"],
        specs: [
          { label: "Performance", value: "Excellent" },
          { label: "Break resistance", value: "Excellent" },
          { label: "Heat resistance", value: "-10°C to +75°C" },
        ],
        products: [
          { code: "RTX04T", description: "06 Compartment Tray", size: "10\" x 13\"", casePack: "50" },
          { code: "RTX04L", description: "06 Compartment Translucent Lid", size: "10\" x 13\"", casePack: "50" },
        ],
        highlight:
          "Purpose-built for insulated pan carriers such as the HBI X04 — 24 trays fit per carrier, keeping pre-packed meals at temperature from kitchen to table. Colour-coded for different dietary meal types.",
        certs: ["food", "dishwasher", "freezer", "microwave", "tuv"],
      },
    ],
  },
  {
    id: "dinnerware",
    name: "Dinnerware",
    shortName: "Dinnerware",
    kicker: "On the table",
    tagline: "The look of glass. None of the breakage.",
    paragraphs: [
      "Ruskav Dinnerware has set the industry standard for functional beauty and lasting value — dependable Polycarbonate and Co-Polymer pieces that feature the look and feel of glass, at a fraction of the risk.",
      "They weigh up to 50% less than glass, making service easier and safer for staff, and cost about 33% less than comparable glassware. Less breakage means lower replacement costs and less time spent cleaning up broken glass.",
    ],
    bullets: [
      "Sturdy and attractive, for solid, user-friendly service",
      "Made from virgin, food-contact-safe material",
      "Perfect for hotels, caterers, hospitals, cafeterias, food courts & schools",
      "Highly durable, long-lasting PC and Co-Polymer construction",
    ],
    heroImage: "/gallery/dinnerware-set-table.webp",
    backdropImage: "/gallery/dinnerware-set-table.webp",
    secondaryImages: [
      "/gallery/plate-polycarbonate-rim.webp",
      "/gallery/plate-copolymer-white.webp",
      "/gallery/bowls-yellow-white.webp",
      "/gallery/bowls-clear-row.webp",
      "/gallery/bowls-lidded-clear.webp",
    ],
    thumb: "/gallery/bowls-lidded-clear.webp",
    theme: "brand",
    groups: [
      {
        id: "pc-plates",
        name: "Polycarbonate Plates",
        material: "Polycarbonate (PC)",
        materialCode: "PC",
        surface: "Plain",
        colors: ["white", "yellow", "green", "transparent"],
        products: [
          { code: "RCP", description: "Catering Plate", size: "330mm / 13\"", casePack: "72" },
          { code: "RDP", description: "Dinner Plate", size: "270mm / 10¾\"", casePack: "72" },
          { code: "RQP", description: "Quarter Plate", size: "210mm / 8\"", casePack: "72" },
        ],
        highlight: "Crystal-clear, virtually unbreakable polycarbonate with the brilliance of glass.",
        certs: ["food", "dishwasher", "freezer", "microwave", "tuv"],
      },
      {
        id: "copolymer-plates",
        name: "Co-Polymer Plates",
        material: "Co-Polymer",
        materialCode: "5 PP",
        surface: "Plain",
        colors: ["white", "beige", "green", "red", "yellow", "brown", "blue", "black"],
        specs: [
          { label: "Performance", value: "Excellent" },
          { label: "Stacking lugs", value: "Yes" },
          { label: "Dishwasher safe", value: "Yes" },
          { label: "Chemical resistance", value: "Excellent" },
          { label: "Break resistance", value: "Excellent" },
          { label: "Scratch resistance", value: "Very good" },
          { label: "Heat resistance", value: "-10°C to +75°C" },
        ],
        products: [
          { code: "RCPRS", description: "Catering Plate", size: "330mm / 13\"", casePack: "72" },
          { code: "RDPRS", description: "Dinner Plate", size: "270mm / 10¾\"", casePack: "72" },
          { code: "RQPRS", description: "Quarter Plate", size: "210mm / 8\"", casePack: "72" },
        ],
        certs: ["food", "dishwasher", "freezer", "microwave", "tuv"],
      },
      {
        id: "bowls",
        name: "Bowls",
        material: "Polycarbonate (PC)",
        materialCode: "PC",
        colors: ["white", "yellow", "green", "transparent"],
        products: [
          { code: "RSB", description: "Round Small Bowl", size: "3.5\"", casePack: "72" },
          { code: "RMB", description: "Round Medium Bowl", size: "4.0\"", casePack: "72" },
          { code: "RBB", description: "Round Big Bowl", size: "5.0\"", casePack: "72" },
          { code: "RB500", description: "Ruskav Bowl", size: "5.0 Oz", casePack: "72" },
          { code: "RB600", description: "Ruskav Bowl", size: "6.0 Oz", casePack: "72" },
          { code: "RB750", description: "Ruskav Bowl", size: "7.5 Oz", casePack: "72" },
          { code: "RB1000", description: "Ruskav Bowl", size: "10.0 Oz", casePack: "72" },
          { code: "RB56", description: "Bowl with Lid", size: "6.0 Oz", casePack: "72" },
        ],
        note: "Also available in Co-Polymer and SAN.",
        certs: ["food", "dishwasher", "freezer", "tuv"],
      },
    ],
  },
  {
    id: "drinkware",
    name: "Drinkware",
    shortName: "Drinkware",
    kicker: "Beverage service",
    tagline: "Glassware looks. Zero shatter risk.",
    paragraphs: [
      "Ruskav drinkware features the look and feel of glass while offering the cost savings and lightweight handling of break-resistant plastic — up to 50% lighter, making it easier and safer for staff to carry and serve.",
      "Every piece is finished with a Sani-Rim lip for sanitary drinking, a textured exterior that resists scratching, and a smooth interior for easy cleaning. Stacking lugs make storage and transport effortless.",
    ],
    bullets: [
      "Sturdy and attractive, for solid, user-friendly service",
      "Made from virgin, food-contact-safe material",
      "The look and feel of glass in virtually unbreakable Polycarbonate or Co-Polymer",
      "Textured exterior resists scratching, smooth interior for easy cleaning",
      "Designed with a Sani-Rim lip for sanitary drinking",
    ],
    heroImage: "/gallery/tumblers-colourways.webp",
    backdropImage: "/gallery/tumblers-row-table.webp",
    secondaryImages: [
      "/gallery/tumblers-poured.webp",
      "/gallery/tumblers-frosted-table.webp",
      "/gallery/tumblers-clear-pair.webp",
      "/gallery/tumbler-frosted.webp",
      "/gallery/tumblers-row-table.webp",
    ],
    thumb: "/gallery/tumbler-in-service.webp",
    theme: "brand",
    groups: [
      {
        id: "tumblers",
        name: "Frosted & Crinkle Tumblers",
        material: "Polycarbonate (PC)",
        materialCode: "PC",
        colors: ["transparent"],
        products: [
          { code: "RT0500", description: "Ruskav Frosted Tumbler", size: "5.0 Oz", casePack: "72" },
          { code: "RT0950", description: "Ruskav Frosted Tumbler", size: "9.5 Oz", casePack: "72" },
          { code: "RT1200", description: "Ruskav Frosted Tumbler", size: "12.0 Oz", casePack: "72" },
          { code: "RTD8", description: "Ruskav Crinkle Tumbler", size: "8.0 Oz", casePack: "72" },
          { code: "RTD12", description: "Ruskav Crinkle Tumbler", size: "12.0 Oz", casePack: "72" },
        ],
        note: "Also available in Co-Polymer and SAN. Transparent colours available subject to availability.",
        certs: ["food", "dishwasher", "freezer", "tuv"],
      },
      {
        id: "chai-round-glass",
        name: "Chai & Round Glass",
        material: "Polycarbonate (PC)",
        materialCode: "PC",
        colors: ["transparent"],
        products: [
          { code: "RCG300", description: "Ruskav Chai Glass", size: "3.0 Oz", casePack: "72" },
          { code: "RCG450", description: "Ruskav Chai Glass", size: "4.5 Oz", casePack: "72" },
          { code: "RTR12", description: "Ruskav Round Glass", size: "12.0 Oz", casePack: "72" },
        ],
        note: "Also available in Co-Polymer and SAN.",
        certs: ["food", "dishwasher", "freezer", "tuv"],
      },
    ],
  },
];

export const bioCategory = {
  id: "bio",
  name: "Bio-Composite Range",
  shortName: "Bio-Composite",
  kicker: "Sustainable line",
  tagline: "Farm waste, reimagined as tableware.",
  paragraphs: [
    "Biocomposites made with fast-renewable starch, bamboo, rice husk, coffee husk and olefin-based binders that are either bio-based, recycled or fossil-based.",
    "Instead of crop residue such as rice husk being burnt, we help farmers put it to use — reducing CO2 emissions by working it directly into the biocomposite material.",
    "It's a choice that supports the circular economy and environmental sustainability: affordable, scalable sustainability that delivers real value in reduced carbon footprint and conserved resources.",
  ],
  points: [
    { label: "Rice & coffee husk", detail: "Crop residue diverted from burning, into raw material" },
    { label: "Fast-renewable inputs", detail: "Starch, bamboo and olefin-based binders" },
    { label: "Circular economy", detail: "Supports farmers while cutting CO2 emissions" },
    { label: "Full range", detail: "Trays, plates, bowls, cups and compartment trays" },
  ],
  heroImage: "/gallery/bio-place-setting.webp",
  backdropImage: "/gallery/bio-bowls.webp",
  secondaryImages: [
    "/gallery/bio-compartment-tray.webp",
    "/gallery/bio-cups.webp",
    "/gallery/bio-plates.webp",
    "/gallery/bio-bowls.webp",
  ],
  thumb: "/gallery/bio-bowls-overhead.webp",
  theme: "bio" as const,
};

export const companyInfo = {
  name: "RUSKAV Food Service Products",
  addressLines: ["# 31, 5th Main Road, Srirampuram,", "Bangalore 560 021, India"],
  street: "# 31, 5th Main Road, Srirampuram",
  city: "Bangalore",
  postalCode: "560021",
  region: "Karnataka",
  country: "IN",
  phone: "+91 88840 00097",
  // Digits only, country code first — the format wa.me expects.
  whatsapp: "918884000097",
  email: "info@shahputra.com",
  tagline: "Proudly Made in India",
};
