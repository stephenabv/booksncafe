import { AnnouncementBar } from "@/components/site/announcement-bar";
import { CartProvider } from "@/components/site/cart-context";
import { JsonLd } from "@/components/site/json-ld";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { businessJsonLd, websiteJsonLd } from "@/lib/structured-data";
import { getActiveAnnouncements, getOpeningHours, getSiteSettings, getSocialLinks } from "@/server/repositories/site";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, hours, social, announcements] = await Promise.all([
    getSiteSettings(),
    getOpeningHours(),
    getSocialLinks(),
    getActiveAnnouncements(),
  ]);

  return (
    <CartProvider>
      {/* .site-theme scopes the dark palette to the public site (see globals.css). */}
      <div className="site-theme min-h-dvh bg-cream-50 text-espresso-900 transition-colors duration-300">
        <AnnouncementBar items={announcements} />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
        <SiteFooter />
      </div>
      <JsonLd data={websiteJsonLd(settings.businessName)} />
      <JsonLd data={businessJsonLd(settings, hours, social.map((s) => s.url))} />
    </CartProvider>
  );
}
