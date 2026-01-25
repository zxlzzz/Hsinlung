export function createHw() {
  function set_frame(seq, grid) {
    void seq;
    void grid;
  }

  function on_button_event(handler) {
    void handler;
  }

  function report_error(message) {
    void message;
  }

  return {
    set_frame,
    on_button_event,
    report_error,
  };
}
