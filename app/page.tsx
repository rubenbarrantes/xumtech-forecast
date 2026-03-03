import dynamic from "next/dynamic";

const XumtechSystem = dynamic(() => import("@/components/XumtechSystem"), { ssr: false });

export default function Home() {
  return <XumtechSystem />;
}