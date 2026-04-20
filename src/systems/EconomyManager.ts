import { STARTING_MONEY, STARTING_REPUTATION } from '../utils/Constants';

type MoneyListener      = (money: number) => void;
type ReputationListener = (rep: number)   => void;

export class EconomyManager {
  private static _inst: EconomyManager;

  private _money: number      = STARTING_MONEY;
  private _reputation: number = STARTING_REPUTATION;

  private _moneyListeners: MoneyListener[]           = [];
  private _reputationListeners: ReputationListener[] = [];

  private constructor() {}

  static getInstance(): EconomyManager {
    if (!EconomyManager._inst) EconomyManager._inst = new EconomyManager();
    return EconomyManager._inst;
  }

  get money():      number { return this._money; }
  get reputation(): number { return this._reputation; }

  addMoney(amount: number): void {
    this._money += amount;
    this._moneyListeners.forEach(cb => cb(this._money));
  }

  spendMoney(amount: number): boolean {
    if (this._money < amount) return false;
    this._money -= amount;
    this._moneyListeners.forEach(cb => cb(this._money));
    return true;
  }

  addReputation(delta: number): void {
    this._reputation = Math.max(0, Math.min(5, this._reputation + delta));
    this._reputationListeners.forEach(cb => cb(this._reputation));
  }

  onMoneyChange(cb: MoneyListener): void {
    this._moneyListeners.push(cb);
  }

  onReputationChange(cb: ReputationListener): void {
    this._reputationListeners.push(cb);
  }

  reset(): void {
    this._money      = STARTING_MONEY;
    this._reputation = STARTING_REPUTATION;
    this._moneyListeners      = [];
    this._reputationListeners = [];
    EconomyManager._inst = this; // keep same instance, just reset state
  }
}
