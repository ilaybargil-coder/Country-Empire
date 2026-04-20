import { STARTING_MONEY } from '../utils/Constants';

export class EconomyManager {
  private static instance: EconomyManager;

  private _money: number = STARTING_MONEY;
  private _onChangeCallbacks: Array<(money: number) => void> = [];

  private constructor() {}

  static getInstance(): EconomyManager {
    if (!EconomyManager.instance) {
      EconomyManager.instance = new EconomyManager();
    }
    return EconomyManager.instance;
  }

  get money(): number {
    return this._money;
  }

  addMoney(amount: number): void {
    this._money += amount;
    this.notifyChange();
  }

  spendMoney(amount: number): boolean {
    if (this._money < amount) return false;
    this._money -= amount;
    this.notifyChange();
    return true;
  }

  onChange(cb: (money: number) => void): void {
    this._onChangeCallbacks.push(cb);
  }

  private notifyChange(): void {
    for (const cb of this._onChangeCallbacks) {
      cb(this._money);
    }
  }

  reset(): void {
    this._money = STARTING_MONEY;
    this._onChangeCallbacks = [];
  }
}
