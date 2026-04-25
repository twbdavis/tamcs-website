"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/app/actions/auth";

export function UserMenu({ email }: { email: string }) {
  const initials = email ? email.slice(0, 2).toUpperCase() : "??";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label="Account menu"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-white/20 text-primary-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Signed in as</span>
              <span className="truncate text-sm text-foreground">{email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="p-0">
            <Link href="/dashboard" className="w-full px-1.5 py-1">
              Dashboard
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logoutAction();
          }}
          variant="destructive"
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
