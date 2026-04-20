import { GuestMood } from '../utils/Enums';

export class MoodManager {
  private waitStart: Map<string, number> = new Map();

  startWaiting(guestId: string): void {
    this.waitStart.set(guestId, Date.now());
  }

  stopWaiting(guestId: string): void {
    this.waitStart.delete(guestId);
  }

  getMood(guestId: string): GuestMood {
    const t = this.waitStart.get(guestId);
    if (t === undefined) return GuestMood.HAPPY;
    const elapsed = Date.now() - t;
    if (elapsed < 6000)  return GuestMood.HAPPY;
    if (elapsed < 16000) return GuestMood.NEUTRAL;
    return GuestMood.SAD;
  }

  remove(guestId: string): void {
    this.waitStart.delete(guestId);
  }
}
