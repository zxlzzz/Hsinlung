export function createAlgo() {
  function produce_grid_map() {
    return Array.from({ length: 15 }, () => 0);
  }

  function produce_grid_zoom() {
    return Array.from({ length: 15 }, () => 0);
  }

  return {
    produce_grid_map,
    produce_grid_zoom,
  };
}
