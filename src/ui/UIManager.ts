import { EconomyManager } from '../systems/EconomyManager';

type BuildCallback = (type: 'pool') => void;

export class UIManager {
  private container: HTMLDivElement;
  private moneyEl: HTMLSpanElement;
  private guestCountEl: HTMLSpanElement;
  private onBuild: BuildCallback;

  constructor(onBuild: BuildCallback) {
    this.onBuild = onBuild;
    this.container = document.createElement('div');
    this.applyContainerStyles();

    this.moneyEl = document.createElement('span');
    this.guestCountEl = document.createElement('span');

    this.buildUI();
    document.body.appendChild(this.container);

    EconomyManager.getInstance().onChange(money => {
      this.moneyEl.textContent = `$${money}`;
    });
  }

  private applyContainerStyles(): void {
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      zIndex: '100',
    });
  }

  private buildUI(): void {
    const hud = this.createHUD();
    const buildMenu = this.createBuildMenu();
    this.container.appendChild(hud);
    this.container.appendChild(buildMenu);
  }

  private createHUD(): HTMLDivElement {
    const hud = document.createElement('div');
    Object.assign(hud.style, {
      position: 'absolute',
      top: '12px',
      left: '12px',
      display: 'flex',
      gap: '12px',
      pointerEvents: 'none',
    });

    hud.appendChild(this.createPanel('💰 Money', this.moneyEl, '$500'));
    hud.appendChild(this.createPanel('👥 Guests', this.guestCountEl, '0'));

    return hud;
  }

  private createPanel(label: string, valueEl: HTMLSpanElement, initialValue: string): HTMLDivElement {
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      background: 'rgba(10,20,40,0.82)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '8px',
      padding: '8px 16px',
      color: '#fff',
      fontSize: '14px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
    });

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    Object.assign(labelEl.style, { fontSize: '11px', opacity: '0.7' });

    valueEl.textContent = initialValue;
    Object.assign(valueEl.style, { fontSize: '18px', fontWeight: 'bold', color: '#7dd3fc' });

    panel.appendChild(labelEl);
    panel.appendChild(valueEl);
    return panel;
  }

  private createBuildMenu(): HTMLDivElement {
    const menu = document.createElement('div');
    Object.assign(menu.style, {
      position: 'absolute',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(10,20,40,0.88)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '12px',
      padding: '12px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      pointerEvents: 'all',
    });

    const title = document.createElement('div');
    title.textContent = 'Build Menu';
    Object.assign(title.style, {
      color: '#fff',
      fontSize: '13px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      opacity: '0.8',
    });

    const poolBtn = this.createBuildButton('Swimming Pool', '$200', 0x1e90ff, () => {
      this.onBuild('pool');
    });

    menu.appendChild(title);
    menu.appendChild(poolBtn);
    return menu;
  }

  private createBuildButton(name: string, cost: string, _color: number, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    Object.assign(btn.style, {
      background: 'rgba(30,144,255,0.2)',
      border: '1px solid rgba(30,144,255,0.6)',
      borderRadius: '8px',
      color: '#fff',
      padding: '8px 18px',
      cursor: 'pointer',
      fontSize: '13px',
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      transition: 'background 0.15s',
    });
    btn.innerHTML = `<span style="color:#7dd3fc;font-weight:bold">${name}</span><span style="opacity:0.7">${cost}</span>`;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(30,144,255,0.45)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(30,144,255,0.2)';
    });
    btn.addEventListener('click', onClick);
    return btn;
  }

  updateGuestCount(count: number): void {
    this.guestCountEl.textContent = String(count);
  }

  destroy(): void {
    this.container.remove();
  }
}
