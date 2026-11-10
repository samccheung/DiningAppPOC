import { Link, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/store";

const STATUS_TONE: Record<string, string> = {
  placed: "bg-primary",
  preparing: "bg-amber-600",
  ready: "bg-emerald-600",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const [params, setParams] = useSearchParams();
  const { data: orders, isLoading } = trpc.orders.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();
  const cancel = trpc.orders.cancel.useMutation({
    onSuccess: () => utils.orders.list.invalidate(),
  });
  const placedId = params.get("placed");

  if (authLoading || !isAuthenticated) return null;

  return (
    <StorefrontLayout>
      <h1 className="mb-4 text-2xl font-bold">我的訂單</h1>

      {placedId && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-600/30 bg-emerald-50 p-4 dark:bg-emerald-950/40">
          <p className="font-medium text-emerald-700 dark:text-emerald-400">
            訂單 #{placedId} 已成功落單！
          </p>
          <Button variant="ghost" size="sm" onClick={() => setParams({})}>關閉</Button>
        </div>
      )}

      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground">載入中…</p>
      ) : !orders || orders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">仲未有訂單</p>
          <Button className="mt-4" asChild>
            <Link to="/menu">立即落單</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {[...orders].reverse().map((o) => (
            <div key={o.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold">訂單 #{o.id}</span>
                  <Badge className={`${STATUS_TONE[o.status] ?? ""} text-white`}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {o.branch}分店 · {o.pickupTime} 取餐
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {o.items.map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span>{i.nameZh} × {i.qty}</span>
                    <span className="text-muted-foreground">${i.priceHkd * i.qty}</span>
                  </li>
                ))}
              </ul>
              {o.note && <p className="mt-2 text-xs text-muted-foreground">備註：{o.note}</p>}
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="font-bold text-primary">合計 ${o.totalHkd}</span>
                {["placed", "preparing"].includes(o.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate({ orderId: o.id })}
                  >
                    取消訂單
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </StorefrontLayout>
  );
}
