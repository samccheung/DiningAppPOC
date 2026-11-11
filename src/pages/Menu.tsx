import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { PlateArt } from "@/components/PlateArt";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ShoppingCart } from "lucide-react";
import { CATEGORIES } from "@/lib/store";

export default function Menu() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [params] = useSearchParams();
  // dine-in mode: /menu?mode=dinein&store=<id>&table=<no>
  const dineIn = params.get("mode") === "dinein" ? {
    store: params.get("store") ?? "",
    table: params.get("table") ?? "",
  } : null;
  const { data: stores } = trpc.menu.stores.useQuery(undefined, { enabled: !!dineIn });
  const dineInStore = dineIn ? stores?.find((s) => s.id === dineIn.store) ?? null : null;
  const cartQuery = dineIn ? `?mode=dinein&store=${dineIn.store}&table=${encodeURIComponent(dineIn.table)}` : "";
  const [active, setActive] = useState<string>("sushi");
  const { data: products, isLoading, error } = trpc.menu.list.useQuery();
  const utils = trpc.useUtils();
  const add = trpc.cart.add.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });
  const { data: cart } = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const cartCount = cart?.reduce((s, i) => s + i.qty, 0) ?? 0;

  const grouped = useMemo(() => {
    const map = new Map<string, typeof products>();
    for (const c of CATEGORIES) map.set(c.id, []);
    for (const p of products ?? []) map.get(p.category)?.push(p);
    return map;
  }, [products]);

  return (
    <StorefrontLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">外賣自取菜單</h1>
        <p className="text-sm text-muted-foreground mt-1">
          全線近70間分店取餐 · 網上落單 · 到店即取
        </p>
      </div>

      {dineIn && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <Badge className="bg-primary gap-1">店內用餐</Badge>
          <span className="font-medium">{dineInStore?.name ?? dineIn.store}</span>
          {dineIn.table && <Badge variant="secondary">枱號 {dineIn.table}</Badge>}
          {dineInStore?.highSpeed && <Badge variant="secondary" className="gap-1">高速線送枱</Badge>}
          <button
            className="ml-auto text-xs text-muted-foreground underline underline-offset-2"
            onClick={() => navigate("/dine-in")}
          >
            更改
          </button>
        </div>
      )}

      {/* category tabs */}
      <div className="sticky top-14 z-30 -mx-4 bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
                active === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {c.label}
              <span className="ml-1 text-xs opacity-70">{(grouped.get(c.id) ?? []).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* product grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="py-16 text-center text-destructive">載入菜單失敗，請重新整理。</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {(grouped.get(active) ?? []).map((p) => (
            <div key={p.id} className="group flex flex-col rounded-xl border bg-card p-3 transition-shadow hover:shadow-md">
              <div className="relative">
                <PlateArt plateColor={p.plateColor} category={p.category} className="aspect-square w-full" />
                <div className="absolute left-1 top-1 flex gap-1">
                  {p.isNew && <Badge className="bg-primary px-1.5 text-[10px]">新</Badge>}
                  {p.isLimited && <Badge className="bg-amber-600 px-1.5 text-[10px]">每日限量</Badge>}
                </div>
              </div>
              <h3 className="mt-2 font-semibold leading-tight">{p.nameZh}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="font-bold text-primary">${p.priceHkd}</span>
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  aria-label={`加入 ${p.nameZh}`}
                  disabled={add.isPending}
                  onClick={() => {
                    if (!isAuthenticated) {
                      sessionStorage.setItem("post_login_next", window.location.pathname + window.location.search);
                      navigate("/login");
                      return;
                    }
                    add.mutate({ productId: p.id, qty: 1 });
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* floating cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 ? `${cartCount} 件商品` : "購物車"}
            {dineIn ? " · 堂食" : ""}
          </div>
          <Button className="h-11 px-6 font-semibold" onClick={() => navigate(`/cart${cartQuery}`)}>
            查看購物車
          </Button>
        </div>
      </div>
    </StorefrontLayout>
  );
}
