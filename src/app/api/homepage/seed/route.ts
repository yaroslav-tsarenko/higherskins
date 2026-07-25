import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // ── Utility Links ──────────────────────────────────
    const utilityLinks = [
      { label: "About Us", linkUrl: "/about", icon: "Info", position: "left", sortOrder: 0 },
      { label: "Shipping & Delivery", linkUrl: "/policies/shipping", icon: "Truck", position: "left", sortOrder: 1 },
      { label: "Returns", linkUrl: "/policies/returns", icon: "RotateCcw", position: "left", sortOrder: 2 },
      { label: "Warranty", linkUrl: "/policies/warranty", icon: "ShieldCheck", position: "left", sortOrder: 3 },
      { label: "Track Order", linkUrl: "/account/orders", icon: "Package", position: "left", sortOrder: 4 },
      { label: "Contact", linkUrl: "/contact", icon: "Phone", position: "right", sortOrder: 5 },
    ];

    for (const link of utilityLinks) {
      await prisma.utilityLink.upsert({
        where: { id: `seed-utility-${link.sortOrder}` },
        update: link,
        create: { id: `seed-utility-${link.sortOrder}`, ...link },
      });
    }

    // ── Promo Strip Items ──────────────────────────────
    const promoStripItems = [
      { icon: "Truck", title: "Free UK Delivery", subtitle: "On orders over £100", sortOrder: 0 },
      { icon: "RotateCcw", title: "30-Day Returns", subtitle: "No fine print", sortOrder: 1 },
      { icon: "ShieldCheck", title: "2-Year Warranty", subtitle: "Manufacturer-backed", sortOrder: 2 },
      { icon: "Shield", title: "Secure Payment", subtitle: "PCI-DSS · 256-bit SSL", sortOrder: 3 },
      { icon: "Zap", title: "Same-Day Dispatch", subtitle: "Order before 14:00 GMT", sortOrder: 4 },
    ];

    for (const item of promoStripItems) {
      await prisma.promoStripItem.upsert({
        where: { id: `seed-promo-${item.sortOrder}` },
        update: item,
        create: { id: `seed-promo-${item.sortOrder}`, ...item },
      });
    }

    // ── Homepage Tabs (quick-access chips) ─────────────
    const tabs = [
      { label: "Deals", icon: "Zap", linkUrl: "/catalog?onSale=true", color: "#2E7DFF", sortOrder: 0 },
      { label: "Audio", icon: "Headphones", linkUrl: "/catalog/audio-headphones", color: "#2E7DFF", sortOrder: 1 },
      { label: "Laptops", icon: "Cpu", linkUrl: "/catalog/laptops-computers", color: "#2E7DFF", sortOrder: 2 },
      { label: "Smartphones", icon: "Smartphone", linkUrl: "/catalog/smartphones-tablets", color: "#7C5CFF", sortOrder: 3 },
      { label: "Monitors", icon: "Monitor", linkUrl: "/catalog/displays-monitors", color: "#7C5CFF", sortOrder: 4 },
      { label: "Gaming", icon: "Gamepad2", linkUrl: "/catalog/gaming-consoles", color: "#3ED598", sortOrder: 5 },
      { label: "Peripherals", icon: "Keyboard", linkUrl: "/catalog/peripherals", color: "#2E7DFF", sortOrder: 6 },
      { label: "Cameras", icon: "Camera", linkUrl: "/catalog/cameras-drones", color: "#7C5CFF", sortOrder: 7 },
      { label: "New in", icon: "Sparkles", linkUrl: "/catalog?sort=newest", color: "#3ED598", sortOrder: 8 },
    ];

    for (const tab of tabs) {
      await prisma.homepageTab.upsert({
        where: { id: `seed-tab-${tab.sortOrder}` },
        update: tab,
        create: { id: `seed-tab-${tab.sortOrder}`, ...tab },
      });
    }

    // ── Hero Slides ────────────────────────────────────
    const heroSlides = [
      {
        type: "HERO" as const,
        title: "Precision-engineered audio",
        subtitle: "Reference series",
        description: "Studio-grade headphones, spatial speakers and reference DACs — hand-picked for spec, tuned by ear.",
        linkUrl: "/catalog/audio-headphones",
        ctaLabel: "Shop audio",
        bgColor: "#0B0E14",
        textColor: "#EDF1F5",
        badgeText: "SERIES 01",
        sortOrder: 0,
      },
      {
        type: "HERO" as const,
        title: "Ultra-portable compute",
        subtitle: "Silicon-native laptops",
        description: "ProMotion displays, 20-hour batteries, sub-1kg chassis — laptops built for sustained performance.",
        linkUrl: "/catalog/laptops-computers",
        ctaLabel: "Shop laptops",
        bgColor: "#12233F",
        textColor: "#EDF1F5",
        badgeText: "SERIES 02",
        sortOrder: 1,
      },
      {
        type: "HERO" as const,
        title: "The house, aware",
        subtitle: "Ambient smart home",
        description: "Matter-native hubs, sensors and lighting that responds. Fewer boxes on the wall, more moments of calm.",
        linkUrl: "/catalog/smart-home",
        ctaLabel: "Shop smart home",
        bgColor: "#1F1A3A",
        textColor: "#EDF1F5",
        badgeText: "SERIES 03",
        sortOrder: 2,
      },
    ];

    for (let i = 0; i < heroSlides.length; i++) {
      await prisma.banner.upsert({
        where: { id: `seed-hero-${i}` },
        update: heroSlides[i],
        create: { id: `seed-hero-${i}`, ...heroSlides[i] },
      });
    }

    // ── Deal Cards ─────────────────────────────────────
    const dealCards = [
      {
        type: "DEAL_CARD" as const,
        title: "Reference Studio Monitors",
        subtitle: "Calibrated pair",
        description: "Studio-grade near-field monitors with balanced-drive tweeters — 0% finance available.",
        linkUrl: "/catalog/audio-headphones",
        ctaLabel: "Shop now",
        bgColor: "#141821",
        textColor: "#EDF1F5",
        oldPrice: "£1,549.00",
        newPrice: "£1,249.00",
        discountText: "-19%",
        sortOrder: 0,
      },
      {
        type: "DEAL_CARD" as const,
        title: "Pro 14 · M-series · 32GB",
        subtitle: "Ultra-portable",
        description: "16-core neural engine, ProMotion, sub-1kg. Trade-in credit up to £700.",
        linkUrl: "/catalog/laptops-computers",
        ctaLabel: "Shop now",
        bgColor: "#12233F",
        textColor: "#EDF1F5",
        oldPrice: "£2,499.00",
        newPrice: "£2,199.00",
        discountText: "-12%",
        sortOrder: 1,
      },
    ];

    for (let i = 0; i < dealCards.length; i++) {
      await prisma.banner.upsert({
        where: { id: `seed-deal-${i}` },
        update: dealCards[i],
        create: { id: `seed-deal-${i}`, ...dealCards[i] },
      });
    }

    // ── Small Promo Banners (department tiles) ─────────
    const smallPromos = [
      {
        type: "PROMO_SMALL" as const,
        title: "Audio & Headphones",
        subtitle: "Studio-grade, tuned by ear",
        linkUrl: "/catalog/audio-headphones",
        ctaLabel: "Shop Audio",
        bgColor: "#0B0E14",
        textColor: "#EDF1F5",
        sortOrder: 0,
      },
      {
        type: "PROMO_SMALL" as const,
        title: "Laptops & Computers",
        subtitle: "Silicon-native performance",
        linkUrl: "/catalog/laptops-computers",
        ctaLabel: "Shop Laptops",
        bgColor: "#12233F",
        textColor: "#EDF1F5",
        sortOrder: 1,
      },
      {
        type: "PROMO_SMALL" as const,
        title: "Smart Home",
        subtitle: "Matter-native, aware",
        linkUrl: "/catalog/smart-home",
        ctaLabel: "Shop Smart Home",
        bgColor: "#1F1A3A",
        textColor: "#EDF1F5",
        sortOrder: 2,
      },
    ];

    for (let i = 0; i < smallPromos.length; i++) {
      await prisma.banner.upsert({
        where: { id: `seed-promo-small-${i}` },
        update: smallPromos[i],
        create: { id: `seed-promo-small-${i}`, ...smallPromos[i] },
      });
    }

    // ── Wide Promo Banner ──────────────────────────────
    const widePromo = {
      type: "PROMO_WIDE" as const,
      title: "Free UK shipping over £100",
      subtitle: "Same-day dispatch on orders before 14:00",
      description: "Precision-engineered electronics shipped from the United Kingdom. 30-day returns, 2-year warranty, no fine print.",
      linkUrl: "/catalog",
      ctaLabel: "Shop the catalog",
      bgColor: "#0B0E14",
      textColor: "#EDF1F5",
      badgeText: "ALWAYS ON",
      sortOrder: 0,
    };

    await prisma.banner.upsert({
      where: { id: "seed-promo-wide-0" },
      update: widePromo,
      create: { id: "seed-promo-wide-0", ...widePromo },
    });

    // ── Brands ─────────────────────────────────────────
    const brands = [
      "Apple", "Samsung", "LG", "Sony", "HP", "Dell", "Lenovo", "ASUS",
      "Acer", "MSI", "Logitech", "Microsoft", "Intel", "AMD",
    ];

    for (let i = 0; i < brands.length; i++) {
      const slug = brands[i].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await prisma.brand.upsert({
        where: { id: `seed-brand-${i}` },
        update: { name: brands[i], logoUrl: `/brands/${slug}.svg`, linkUrl: `/catalog`, sortOrder: i },
        create: {
          id: `seed-brand-${i}`,
          name: brands[i],
          logoUrl: `/brands/${slug}.svg`,
          linkUrl: `/catalog`,
          sortOrder: i,
        },
      });
    }

    // ── Homepage Sections ──────────────────────────────
    // categorySlug values match real Category.slug rows in the DB.
    const sections = [
      {
        title: "Best Deals",
        subtitle: "Save on selected electronics",
        slug: "best-deals",
        filterType: "onSale",
        maxProducts: 5,
        viewAllUrl: "/catalog?onSale=true",
        viewAllLabel: "View all deals",
        bgStyle: "white",
        columns: 5,
        sortOrder: 0,
      },
      {
        title: "New Arrivals",
        subtitle: "Fresh drops this week",
        slug: "new-arrivals",
        filterType: "newest",
        maxProducts: 5,
        viewAllUrl: "/catalog?sort=newest",
        viewAllLabel: "View all new",
        bgStyle: "gray",
        columns: 5,
        sortOrder: 1,
      },
      {
        title: "Laptops & Computers",
        subtitle: "Silicon-native, sustained performance",
        slug: "laptops-computers",
        filterType: "category",
        categorySlug: "laptops-computers",
        maxProducts: 5,
        viewAllUrl: "/catalog/laptops-computers",
        viewAllLabel: "Shop laptops",
        bgStyle: "white",
        columns: 5,
        sortOrder: 2,
      },
      {
        title: "Audio & Headphones",
        subtitle: "Studio-grade cans, IEMs & speakers",
        slug: "audio-headphones",
        filterType: "category",
        categorySlug: "audio-headphones",
        maxProducts: 5,
        viewAllUrl: "/catalog/audio-headphones",
        viewAllLabel: "Shop audio",
        bgStyle: "white",
        columns: 5,
        sortOrder: 3,
      },
      {
        title: "Smartphones & Tablets",
        subtitle: "Flagship phones, pro tablets",
        slug: "smartphones-tablets",
        filterType: "category",
        categorySlug: "smartphones-tablets",
        maxProducts: 5,
        viewAllUrl: "/catalog/smartphones-tablets",
        viewAllLabel: "Shop mobile",
        bgStyle: "gray",
        columns: 5,
        sortOrder: 4,
      },
      {
        title: "Displays & Monitors",
        subtitle: "4K IPS, ultrawide, calibrated OLED",
        slug: "displays-monitors",
        filterType: "category",
        categorySlug: "displays-monitors",
        maxProducts: 5,
        viewAllUrl: "/catalog/displays-monitors",
        viewAllLabel: "Shop displays",
        bgStyle: "white",
        columns: 5,
        sortOrder: 5,
      },
      {
        title: "Featured",
        subtitle: "Hand-picked by our team",
        slug: "featured",
        filterType: "featured",
        maxProducts: 5,
        viewAllUrl: "/catalog",
        viewAllLabel: "View all featured",
        bgStyle: "white",
        columns: 5,
        sortOrder: 6,
      },
      {
        title: "All Products",
        subtitle: "Browse the full catalog",
        slug: "all-products",
        filterType: "all",
        maxProducts: 10,
        viewAllUrl: "/catalog",
        viewAllLabel: "View all products",
        bgStyle: "white",
        columns: 5,
        sortOrder: 7,
      },
    ];

    for (const section of sections) {
      await prisma.homepageSection.upsert({
        where: { slug: section.slug },
        update: section,
        create: section,
      });
    }

    return NextResponse.json({
      success: true,
      seeded: {
        utilityLinks: utilityLinks.length,
        promoStripItems: promoStripItems.length,
        tabs: tabs.length,
        heroSlides: heroSlides.length,
        dealCards: dealCards.length,
        smallPromos: smallPromos.length,
        widePromos: 1,
        brands: brands.length,
        sections: sections.length,
      },
    });
  } catch (error) {
    console.error("Error seeding homepage data:", error);
    return NextResponse.json({ error: "Failed to seed homepage data" }, { status: 500 });
  }
}
