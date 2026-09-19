import type { Metadata } from "next";

import { WishlistView } from "@/features/account/wishlist-view";

export const metadata: Metadata = {
  title: "علاقه‌مندی‌ها",
  description: "محصولات ذخیره‌شدهٔ شما.",
};

export default function WishlistPage() {
  return <WishlistView />;
}
