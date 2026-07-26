/**
 * Central brand identity for Higherskins.
 * Import from here instead of hardcoding company details in components.
 */

export const brand = {
  name: "higherskins",
  displayName: "HigherSkins",
  domain: "higherskins.com",
  url: "https://higherskins.com",
  tagline: "The fast, fair CS2 skins marketplace.",
  description:
    "HigherSkins — a modern CS2 skins marketplace. Browse thousands of skins with live float, pattern and price data, compare across markets, track price history, and trade instantly via your Steam account.",
  applicationName: "HigherSkins",

  company: {
    legalName: "RYE FLOUR COOKIES LTD",
    number: "15107933",
    address: {
      line1: "304d, The Big Peg",
      line2: "120 Vyse St",
      city: "Birmingham",
      region: "England",
      postcode: "B18 6ND",
      country: "United Kingdom",
    },
  },

  contact: {
    email: "info@higherskins.com",
    emailB2B: "info@higherskins.com",
    phone: "+44 7450 581147",
    phoneHref: "tel:+447450581147",
    contactPage: "/contact",
  },

  social: {
    linkedin: "https://www.linkedin.com/company/higherskins-uk/",
    instagram: "https://www.instagram.com/higherskins.uk/",
    twitter: "@higherskins",
  },
} as const;

export const brandAddressLine = [
  brand.company.address.line1,
  brand.company.address.line2,
  brand.company.address.city,
  brand.company.address.region,
  brand.company.address.postcode,
  brand.company.address.country,
].join(", ");

export const brandLegalLine = `${brand.company.legalName} · Company No. ${brand.company.number} · ${brand.company.address.line1}, ${brand.company.address.line2}, ${brand.company.address.city}, ${brand.company.address.postcode}, ${brand.company.address.country}`;
