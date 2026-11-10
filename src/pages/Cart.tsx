import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { PlateArt } from "@/components/PlateArt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, Trash2 } from "lucide-react";
import { pickupSlots } from "@/lib/store";

export default function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const utils = trpc.useUtils();
  const { data: cart, isLoading } = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: branches } = trpc.menu.branches.useQuery();
  const setQty = trpc.cart.setQty.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });
  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (res) => {
      utils.cart.list.invalidate();
      utils.orders.list.invalidate();
      navigate(`/orders?placed=${res.orderId}`);
    },
  });

  const [branch, setBranch] = useState<string>("");
  const [slot, setSlot] = useState<string>("");
  const [note, setNote] = useState("");
  const slots = useMemo(pickupSlots, []);

  const total = cart?.reduce((s, i) => s + i.product.priceHkd * i.qty, 0) ?? 0;
  const canCheckout = !!branch && !!slot && (cart?.length ?? 0) > 0 && !createOrder.isPending;

  if (authLoading || !isAuthenticated) return null;

  return (
    <StorefrontLayout>
      <h1 className="mb-4 text-2xl font-bold">購物車</h1>

      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground">載入中…</p>
      ) : !cart || cart.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">購物車暫時是空的</p>
          <Button className="mt-4" asChild>
            <Link to="/menu">去睇菜單</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <PlateArt
                  plateColor={item.product.plateColor}
                  category={item.product.category}
                  className="h-16 w-16 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{item.product.nameZh}</h3>
                  <p className="text-sm text-primary font-semibold">${item.product.priceHkd}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="減少"
                    onClick={() => setQty.mutate({ cartItemId: item.id, qty: item.qty - 1 })}
                  >
                    {item.qty === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  </Button>
                  <span className="w-6 text-center font-semibold">{item.qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="增加"
                    disabled={item.qty >= 20}
                    onClick={() => setQty.mutate({ cartItemId: item.id, qty: item.qty + 1 })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-xl border bg-card p-4 md:sticky md:top-20">
            <h2 className="mb-3 font-bold">取餐資料</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="branch">取餐分店</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger id="branch" className="h-11">
                    <SelectValue placeholder="選擇分店" />
                  </SelectTrigger>
                  <SelectContent>
                    {(branches ?? []).map((b) => (
                      <SelectItem key={b} value={b}>{b}分店</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slot">取餐時間</Label>
                <Select value={slot} onValueChange={setSlot}>
                  <SelectTrigger id="slot" className="h-11">
                    <SelectValue placeholder="選擇時間" />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">備註（可留空）</Label>
                <Input
                  id="note"
                  value={note}
                  maxLength={200}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例如：不要芥末"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-muted-foreground">合計</span>
              <span className="text-xl font-bold text-primary">${total}</span>
            </div>
            {createOrder.isError && (
              <p className="mt-2 text-sm text-destructive">{createOrder.error.message}</p>
            )}
            <Button
              className="mt-3 h-12 w-full text-base font-bold"
              disabled={!canCheckout}
              onClick={() =>
                createOrder.mutate({
                  branch: branch as never,
                  pickupTime: slot,
                  note: note || undefined,
                })
              }
            >
              確認落單 · ${total}
            </Button>
          </div>
        </div>
      )}
    </StorefrontLayout>
  );
}
