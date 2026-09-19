import type { Metadata } from "next";

import { SearchView } from "@/features/catalog/search-view";

export const metadata: Metadata = {
  title: "جستجو",
  description: "جستجو در محصولات ORF Wear.",
};

export default function SearchPage() {
  return <SearchView />;
}
