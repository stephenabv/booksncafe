import { notFound } from "next/navigation";

/**
 * Routes unknown URLs through the site layout so visitors get the normal
 * header and footer with a real 404 status.
 */
export default function MissingPage(): never {
  notFound();
}
