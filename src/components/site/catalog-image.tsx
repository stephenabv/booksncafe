import { BookOpen, Coffee, CalendarDays } from "lucide-react";
import Image from "next/image";

const ICONS = { book: BookOpen, menu: Coffee, event: CalendarDays } as const;

interface Props {
  src: string | null;
  alt: string;
  kind: keyof typeof ICONS;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/**
 * Responsive catalog image with a fixed aspect-ratio box so cards never shift
 * layout while images load. Falls back to a branded placeholder when no image
 * is set.
 */
export function CatalogImage({ src, alt, kind, sizes, className = "aspect-[4/3]", priority }: Props) {
  const Icon = ICONS[kind];
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-cream-200 to-cream-300 ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-espresso-600/60" aria-hidden>
          <Icon className="size-10" />
        </div>
      )}
    </div>
  );
}
