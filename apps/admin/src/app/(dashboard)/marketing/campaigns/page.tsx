import { PageHeader } from "@/components/layout/page-header";
import { ModuleShell } from "@/components/ui/module-shell";

export default function CampaignsPage() {
  return (
    <div>
      <PageHeader
        title="کمپین‌ها"
        description="اسکلت فاز ۱ — بنرها در مسیر /marketing/banners فعال است."
      />
      <ModuleShell
        columns={["نام", "کانال", "وضعیت", "بازه"]}
        emptyLabel="کمپین‌ها در فاز بعد. فعلاً از بنرها استفاده کنید."
      />
    </div>
  );
}
