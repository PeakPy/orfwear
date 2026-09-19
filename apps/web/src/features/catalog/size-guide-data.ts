/** Shared between the PDP size sheet and the full /size-guide page. */
export const SIZE_GUIDE_ROWS = [
  { size: "XS", chest: "۸۲–۸۶", waist: "۶۴–۶۸", hip: "۸۸–۹۲" },
  { size: "S", chest: "۸۷–۹۱", waist: "۶۹–۷۳", hip: "۹۳–۹۷" },
  { size: "M", chest: "۹۲–۹۷", waist: "۷۴–۷۹", hip: "۹۸–۱۰۳" },
  { size: "L", chest: "۹۸–۱۰۴", waist: "۸۰–۸۶", hip: "۱۰۴–۱۱۰" },
  { size: "XL", chest: "۱۰۵–۱۱۲", waist: "۸۷–۹۴", hip: "۱۱۱–۱۱۸" },
] as const;

export const TROUSER_SIZE_ROWS = [
  { size: "۳۰", waist: "۷۶", inseam: "۷۸" },
  { size: "۳۲", waist: "۸۱", inseam: "۷۹" },
  { size: "۳۴", waist: "۸۶", inseam: "۸۰" },
  { size: "۳۶", waist: "۹۱", inseam: "۸۱" },
] as const;
