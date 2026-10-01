/** Serialize writes and retain edits made while an earlier request is in flight. */
export class SaveQueue<T> {
  private pending = new Map<string, T>();
  private running: Promise<void> | null = null;
  private blocked = new Set<string>();

  constructor(private write: (id: string, data: T) => Promise<unknown>) {}

  set(id: string, data: T) { this.pending.set(id, data); }
  get dirty() { return this.pending.size > 0; }
  has(id: string) { return this.pending.has(id); }
  block(id: string) { this.blocked.add(id); }
  discard(id: string) { this.pending.delete(id); this.blocked.delete(id); }

  flush(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.drain().finally(() => { this.running = null; });
    return this.running;
  }

  private async drain() {
    let conflict: unknown;
    while (this.pending.size) {
      const next = [...this.pending.entries()].find(([id]) => !this.blocked.has(id));
      if (!next) break;
      const [id, data] = next;
      try {
        await this.write(id, data);
      } catch (error) {
        if (!this.blocked.has(id)) throw error;
        conflict = error;
        continue;
      }
      // Never acknowledge a newer edit with an older request's response.
      if (this.pending.get(id) === data) this.pending.delete(id);
    }
    if (conflict) throw conflict;
  }
}
