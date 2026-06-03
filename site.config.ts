export const siteConfig = {
  name: "One House Decor",
  tagline: "Honest Reviews for a Beautiful Home",
  description: "Expert-tested home decor product reviews to help you create a space you love, without the guesswork.",
  domain: "onehousedecor.com",
  niche: "home-decor",
  amazonTag: "onehousedecor-20",
  locale: "en-US",

  theme: {
    colorPrimary:      "#2D4A3E",
    colorPrimaryLight: "#3D6455",
    colorAccent:       "#B8732E",
    colorBg:           "#FAFAF8",
    colorBgSubtle:     "#F2EDE5",
    colorBgDark:       "#1A2D24",
    colorText:         "#1A1A18",
    colorTextMuted:    "#666560",
    colorBorder:       "#E2DDD6",
    colorPro:          "#276936",
    colorCon:          "#B83232",
    colorStar:         "#E8A020",
    fontHeading:       "'Playfair Display', Georgia, serif",
    fontBody:          "'Inter', system-ui, sans-serif",
  },

  nav: [
    { label: "Living Room",    href: "/living-room/" },
    { label: "Bedroom",        href: "/bedroom/" },
    { label: "Kitchen",        href: "/kitchen-dining/" },
    { label: "Bathroom",       href: "/bathroom/" },
    { label: "Outdoor",        href: "/outdoor/" },
  ],

  categories: [
    { slug: "living-room",    label: "Living Room" },
    { slug: "bedroom",        label: "Bedroom" },
    { slug: "kitchen-dining", label: "Kitchen & Dining" },
    { slug: "bathroom",       label: "Bathroom" },
    { slug: "outdoor",        label: "Outdoor & Patio" },
  ],

  // Layout preset — AI gen-site selects this automatically based on niche
  // home:    "grid"       3-col card grid (lifestyle/decor)
  //          "hero"       large featured article + horizontal cards (editorial)
  // article: "default"   bordered cards, centered image, pros/cons section (decor/lifestyle)
  //          "wirecutter" clean editorial, image sidebar, inline pros/cons (tech/appliances)
  layout: {
    home:    "grid"    as "grid" | "hero",
    article: "default" as "default" | "wirecutter",
  },

  social: {
    pinterest: "https://pinterest.com/onehousedecor",
  },

  pages: {
    about: {
      headline: "We Help You Create a Home You Love",
      body: `One House Decor was started by a small team of interior decorating enthusiasts who got tired of wading through sponsored content and vague advice. We research, analyze, and test home decor products so you don't have to.\n\nEvery product recommendation on this site is backed by real data: Amazon ratings, verified customer reviews, price history, and our own editorial analysis. We only recommend products we'd genuinely put in our own homes.`,
    },
    contact: {
      email: "hello@onehousedecor.com",
      body: "Have a product suggestion, a correction, or just want to say hi? We read every message.",
    },
    privacy: {
      lastUpdated: "June 3, 2026",
    },
    disclaimer: {
      lastUpdated: "June 3, 2026",
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
export type Category = typeof siteConfig.categories[number];
