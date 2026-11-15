/** Concurrent requests share one notice; finishing one must not hide the others. */
export function createConnectionWait() {
  const active = new Set<symbol>();
  const listeners = new Set<() => void>();
  const emit = () => { for (const listener of listeners) listener(); };
  return {
    snapshot: () => active.size > 0,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    begin: () => {
      const key = Symbol(); active.add(key); emit();
      return () => { if (active.delete(key)) emit(); };
    },
  };
}
export const connectionWait = createConnectionWait();
