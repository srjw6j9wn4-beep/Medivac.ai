// Shim for loglevel — no localStorage, no-op persistence
const noop = () => {};
const log = {
  trace: noop, debug: noop, info: noop, warn: noop, error: noop,
  setLevel: noop, setDefaultLevel: noop, resetLevel: noop,
  enableAll: noop, disableAll: noop,
  getLevel: () => 5,
  levels: { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, SILENT: 5 },
  methodFactory: () => noop,
};
export default log;
module.exports = log;
