import Image from "next/image";
import Link from "next/link";
import banner from "@/assets/banner.webp";
import { getNavLinks, getSiteSettings } from "@/server/repositories/site";
import { CartLink } from "./cart-link";
import { HeaderFrame } from "./header-frame";
import { PrimaryNav } from "./primary-nav";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const [links, settings] = await Promise.all([getNavLinks("header"), getSiteSettings()]);
  return (
    <HeaderFrame>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-amber-brand focus:px-3 focus:py-2 focus:text-night-950">
        Skip to content
      </a>
      <div className="container-page relative flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" aria-label={`${settings.businessName} home`}>
          <Image src={banner} alt="" width={60} height={40} className="h-10 w-[60px] rounded-md object-cover" priority sizes="60px" />
          <span className="font-display text-lg font-semibold tracking-tight">{settings.businessName}</span>
        </Link>
        <div className="flex items-center gap-1">
          <PrimaryNav items={links} />
          <ThemeToggle />
          <CartLink />
        </div>
      </div>
    </HeaderFrame>
  );
}
