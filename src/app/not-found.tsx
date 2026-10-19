import { NotFoundContent } from "@/components/site/not-found-content";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function RootNotFound() {
  return <NotFoundContent />;
}
