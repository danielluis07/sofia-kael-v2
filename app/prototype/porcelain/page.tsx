// PROTOTYPE (issue #6): throwaway route. Lives on the prototype/porcelain-specimen branch only.
import type { Metadata } from "next";
import { PorcelainPrototype } from "./porcelain-prototype";

export const metadata: Metadata = { title: "Prototype · Porcelain specimen" };

export default function Page() {
  return <PorcelainPrototype />;
}
