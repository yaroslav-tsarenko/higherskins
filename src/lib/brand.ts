/**
 * Central brand identity for Higherskins.
 * Import from here instead of hardcoding company details in components.
 */

export const brand = {
  name: "higherskins",
  displayName: "HigherSkins",
  domain: "higherskins.com",
  url: "https://higherskins.com",
  tagline: "The fast, fair CS2 skins store.",
  description:
    "HigherSkins — a modern CS2 skins store. Browse thousands of skins with live float, pattern and price data, compare across markets, track price history, and get them delivered instantly to your Steam account.",
  applicationName: "HigherSkins",

  company: {
    legalName: "HIGHER MARGINS LTD",
    number: "15605091",
    address: {
      line1: "20 Wenlock Road",
      line2: "",
      city: "London",
      region: "England",
      postcode: "N1 7GU",
      country: "United Kingdom",
    },
  },

  contact: {
    email: "info@higherskins.com",
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
]
  .filter(Boolean)
  .join(", ");

export const brandLegalLine = `${brand.company.legalName} · Company No. ${brand.company.number} · ${brandAddressLine}`;
