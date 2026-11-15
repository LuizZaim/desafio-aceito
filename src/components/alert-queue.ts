/** A dismissed dialog must never consume the next dialog or repeat its callback. */
export class AlertQueue<T extends object> {
  private pending: T[] = [];
  get current(): T | null { return this.pending[0] || null; }
  enqueue(request: T): boolean {
    this.pending.push(request);
    return this.pending.length === 1;
  }
  consume(expected: T): T | null {
    if (this.current !== expected) return null;
    return this.pending.shift() || null;
  }
  clear() { this.pending = []; }
}
