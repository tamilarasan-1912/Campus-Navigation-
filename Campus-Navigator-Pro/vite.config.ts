import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The current UI imports Lucide's Map icon under the name `Map`, while the
// routing implementation also constructs the native JavaScript Map type.
// Keep the existing UI source intact and make the runtime distinction explicit
// during the Vite production transform.
function repairNativeMapShadowing() {
  return {
    name: "repair-native-map-shadowing",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (!id.endsWith("/src/main.tsx")) return;
      const fixed = code.replace(/\bnew Map(?=\s*[<(])/g, "new globalThis.Map");
      if (fixed === code) return;
      return { code: fixed, map: null };
    },
  };
}

export default defineConfig({
  plugins: [react(), repairNativeMapShadowing()],
});
