import { z } from "zod";

export const IRAN_MOBILE_RE = /^09\d{9}$/;

export const addressSchema = z.object({
  full_name: z.string().trim().min(2, "نام و نام خانوادگی گیرنده را وارد کنید"),
  phone: z
    .string()
    .trim()
    .regex(IRAN_MOBILE_RE, "شمارهٔ موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد"),
  province: z.string().trim().min(2, "استان را وارد کنید"),
  city: z.string().trim().min(2, "شهر را وارد کنید"),
  address_line: z.string().trim().min(10, "نشانی را کامل‌تر بنویسید"),
  postal_code: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),
  label: z.string().trim().max(32, "عنوان کوتاه‌تری انتخاب کنید").optional().or(z.literal("")),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

export const profileSchema = z.object({
  first_name: z.string().trim().max(50, "نام طولانی است").optional().or(z.literal("")),
  last_name: z.string().trim().max(50, "نام خانوادگی طولانی است").optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("ایمیل معتبر نیست")
    .optional()
    .or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(IRAN_MOBILE_RE, "شمارهٔ موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد"),
});

export const otpCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "کد ۶ رقمی را وارد کنید"),
});
