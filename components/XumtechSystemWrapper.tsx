"use client";
import dynamic from "next/dynamic";

const XumtechSystem = dynamic(() => import("./XumtechSystem"), { ssr: false });

export default function XumtechSystemWrapper() {
  return <XumtechSystem />;
}