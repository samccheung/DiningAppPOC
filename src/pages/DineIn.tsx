import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, TrainFront, UtensilsCrossed, QrCode } from "lucide-react";

export default function DineIn() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [params] = useSearchParams();
  const { data: stores, isLoading } = trpc.menu.stores.useQuery();

  // QR deep link: /dine-in?store=<id>&table=<no> pre-fills and skips selection
  const qrStore = params.get("store");
  const qrTable = params.get("table");
  const [selected, setSelected] = useState<string | null>(qrStore);
  const [tableNo, setTableNo] = useState(qrTable ?? "");

  const store = useMemo(
    () => stores?.find((s) => s.id === selected) ?? null,
    [stores, selected]
  );
  const tableValid = /^[A-Za-z0-9]{1,6}$/.test(tableNo.trim());
  const canStart = !!store && tableValid;

  const start = () => {
    if (!canStart) return;
    const target = `/menu?mode=dinein&store=${store.id}&table=${tableNo.trim().toUpperCase()}`;
    if (!isAuthenticated) {
      // useAuth saves this location before bouncing to /login; the OAuth
      // callback sends the user back here after signing in
      sessionStorage.setItem("post_login_next", target);
    }
    navigate(target);
  };

  return (
    <StorefrontLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          店內用餐
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          掃描桌上 QR Code 或直接選擇分店同枱號，手機落單，高速線直送到枱
        </p>
      </div>

      {qrStore && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <QrCode className="h-4 w-4 text-primary shrink-0" />
          已透過 QR Code 進入{qrTable ? ` · 枱號 ${qrTable}` : ""}，確認分店即可開始點餐
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        {/* store list */}
        <div>
          <h2 className="mb-3 font-bold">選擇分店</h2>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(stores ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`rounded-xl border p-4 text-left transition-shadow hover:shadow-md ${
                    selected === s.id ? "border-primary ring-2 ring-primary/30 bg-card" : "bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{s.name}</h3>
                    {s.highSpeed && (
                      <Badge className="bg-primary px-1.5 text-[10px] shrink-0 gap-1">
                        <TrainFront className="h-3 w-3" /> 高速線
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                    {s.address}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* table + start */}
        <div className="h-fit rounded-xl border bg-card p-4 md:sticky md:top-20">
          <h2 className="mb-3 font-bold">枱號</h2>
          <div className="space-y-1.5">
            <Label htmlFor="tableNo">桌上 QR Code 下方嘅枱號</Label>
            <Input
              id="tableNo"
              value={tableNo}
              maxLength={6}
              placeholder="例如 T12"
              className="h-11 uppercase"
              onChange={(e) => setTableNo(e.target.value)}
            />
            {tableNo && !tableValid && (
              <p className="text-xs text-destructive">枱號格式：1-6 位字母或數字</p>
            )}
          </div>
          <div className="mt-4 border-t pt-3 text-sm text-muted-foreground space-y-1">
            <p>落單後廚房即刻製作</p>
            <p>高速線分店會用火車直送到你張枱</p>
            <p>食完用自助機或手機埋單都得</p>
          </div>
          <Button
            className="mt-4 h-12 w-full text-base font-bold"
            disabled={!canStart}
            onClick={start}
          >
            開始點餐{store ? ` · ${store.name.replace("元気寿司", "").replace("高速線", "")}` : ""}
          </Button>
        </div>
      </div>
    </StorefrontLayout>
  );
}
