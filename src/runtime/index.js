import { createCore } from "../core/index.js";
import { createAlgo } from "../algo/index.js";
import { createHw } from "../hw/index.js";

export function startRuntime() {
  const algo = createAlgo();
  const hw = createHw();
  const core = createCore({ algo, hw });

  core.start();
}
