"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Users,
  UserCircle,
  Search,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    {
      href: "/",
      label: "Home",
      icon: House,
    },
    {
      href: "/directory",
      label: "Directory",
      icon: Users,
    },
    {
      href: "/relationship",
      label: "Search",
      icon: Search,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: UserCircle,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur md:hidden">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-3 text-xs transition ${
                active
                  ? "text-indigo-600"
                  : "text-slate-500"
              }`}
            >
              <Icon size={22} />

              <span className="mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}