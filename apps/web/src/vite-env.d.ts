/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "world-atlas/land-110m.json" {
  const value: import("topojson-specification").Topology;
  export default value;
}

interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string;
}
