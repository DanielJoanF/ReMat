import { APP_NAME, DESCRIPTION } from "@remat/config";
import { Button, Badge } from "@remat/ui";

export default function MarketplacePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="mb-4">
          <Badge variant="success">Marketplace Active</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-3">
          {APP_NAME} Marketplace
        </h1>
        <p className="text-slate-600 mb-6">{DESCRIPTION}</p>
        <div className="flex gap-4 justify-center">
          <Button>Jelajahi Material</Button>
        </div>
      </div>
    </main>
  );
}
