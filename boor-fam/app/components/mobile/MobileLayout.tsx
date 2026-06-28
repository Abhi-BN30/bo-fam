"use client";

import { ReactNode } from "react";

import BottomNav from "./BottomNav";
import AppHeader from "./AppHeader";

export default function MobileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <AppHeader />

      <main className="pb-24 md:pb-0">
        {children}
      </main>

      <BottomNav />
    </>
  );
}