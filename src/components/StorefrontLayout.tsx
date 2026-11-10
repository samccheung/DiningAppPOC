import { Link, NavLink, useNavigate } from "react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ShoppingCart, UtensilsCrossed, ReceiptText } from "lucide-react";

const NAV = [
  { to: "/menu", label: "菜單", icon: UtensilsCrossed },
  { to: "/cart", label: "購物車", icon: ShoppingCart },
  { to: "/orders", label: "我的訂單", icon: ReceiptText },
];

export function StorefrontLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link to="/menu" className="flex items-center gap-2 font-bold text-lg tracking-wide shrink-0">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary font-black">
              元
            </span>
            元気壽司
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${
                    isActive ? "bg-white/20" : "hover:bg-white/10"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
            {isLoading ? null : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full hover:bg-white/10 text-primary-foreground">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar ?? undefined} alt={user?.name ?? "user"} />
                      <AvatarFallback className="bg-white/25 text-primary-foreground text-xs">
                        {(user?.name ?? "U").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-xs">{user?.email ?? user?.name}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()} className="gap-2 cursor-pointer">
                    <LogOut className="h-4 w-4" /> 登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="ml-1 h-10 font-semibold"
                onClick={() => navigate("/login")}
              >
                登入
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24">{children}</main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Genki Sushi POC — 只作示範用途，與元気壽司官方無關
      </footer>
    </div>
  );
}
