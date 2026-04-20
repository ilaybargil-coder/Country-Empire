import { EconomyManager } from '../systems/EconomyManager';
import { FacilityType } from '../utils/Enums';
import { Guest } from '../entities/Guest';

type BuildCb = (type: FacilityType) => void;
type GuestCountCb = () => number;

// ─── SVG icon helpers (inline data URLs) ─────────────────────────────────────
const ICON_GYM  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M18 4v16M3 8h4M17 8h4M3 16h4M17 16h4"/></svg>`;
const ICON_POOL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20M2 17c2 2 4 2 6 0s4-2 6 0 4 2 6 0M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM7 7v5"/></svg>`;
const ICON_SPA  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c0 0-8-5-8-12a8 8 0 1 1 16 0c0 7-8 12-8 12z"/></svg>`;

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function css(el: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  Object.assign(el.style, styles);
}

export class UIManager {
  private root:        HTMLDivElement;
  private moneyEl!:    HTMLElement;
  private guestEl!:    HTMLElement;
  private repStars!:   HTMLElement[];
  private inspector!:  HTMLDivElement;
  private activeTab:   FacilityType = FacilityType.GYM;

  constructor(
    private eco:      EconomyManager,
    private onBuild:  BuildCb,
    private getCount: GuestCountCb,
  ) {
    this.root = document.createElement('div');
    css(this.root, {
      position:   'absolute', top: '0', left: '0',
      width:      '100%',     height: '100%',
      pointerEvents: 'none',
      fontFamily: "'Segoe UI', 'Roboto', Arial, sans-serif",
      zIndex:     '100',
      userSelect: 'none',
    });
    document.body.appendChild(this.root);

    this.buildHUD();
    this.buildLogo();
    this.buildBottomBar();
    this.buildInspector();

    eco.onMoneyChange(m => {
      this.moneyEl.textContent = `$${m.toLocaleString()}`;
    });
    eco.onReputationChange(r => this.updateStars(r));
  }

  // ─── Top-left logo ──────────────────────────────────────────────────────────
  private buildLogo(): void {
    const wrap = document.createElement('div');
    css(wrap, {
      position:   'absolute', top: '10px', left: '10px',
      pointerEvents: 'none',
    });

    const title = document.createElement('div');
    title.innerHTML = `<span style="color:#f59e0b;text-shadow:0 2px 6px #00000088;font-weight:900;font-size:22px;letter-spacing:1px;line-height:1">COUNTRY CLUB</span><br><span style="color:#ffffff;text-shadow:0 2px 6px #00000088;font-weight:900;font-size:28px;letter-spacing:2px">TYCOON</span>`;
    css(title, {
      background: 'linear-gradient(135deg,rgba(15,30,60,0.9) 0%,rgba(10,20,40,0.85) 100%)',
      border:     '2px solid rgba(245,158,11,0.6)',
      borderRadius: '10px',
      padding:    '8px 14px',
      lineHeight: '1.3',
      boxShadow:  '0 4px 20px rgba(0,0,0,0.5)',
    });

    wrap.appendChild(title);
    this.root.appendChild(wrap);
  }

  // ─── Top-right HUD ──────────────────────────────────────────────────────────
  private buildHUD(): void {
    const hud = document.createElement('div');
    css(hud, {
      position:      'absolute', top: '10px', right: '10px',
      display:       'flex',    gap: '8px',
      pointerEvents: 'none',
    });

    const moneyChip = this.makeHUDChip('💰 MONEY', `$${this.eco.money.toLocaleString()}`, '#4ade80');
    const guestChip = this.makeHUDChip('👥 GUESTS', String(this.getCount()), '#60a5fa');
    this.moneyEl = moneyChip.val;
    this.guestEl = guestChip.val;
    hud.appendChild(moneyChip.chip);
    hud.appendChild(guestChip.chip);

    this.root.appendChild(hud);
  }

  private makeHUDChip(label: string, value: string, accent: string): { chip: HTMLDivElement; val: HTMLDivElement } {
    const chip = document.createElement('div');
    css(chip, {
      background: 'linear-gradient(135deg,rgba(10,20,45,0.92) 0%,rgba(15,30,60,0.88) 100%)',
      border:     `1.5px solid ${accent}44`,
      borderRadius: '10px',
      padding:    '6px 14px',
      display:    'flex',  flexDirection: 'column',
      alignItems: 'center', gap: '1px',
      boxShadow:  '0 4px 14px rgba(0,0,0,0.45)',
      minWidth:   '96px',
    });

    const lbl = document.createElement('div');
    lbl.textContent = label;
    css(lbl, { fontSize: '9px', opacity: '0.65', color: '#ffffff', letterSpacing: '1px', fontWeight: '600' });

    const val = document.createElement('div');
    val.textContent = value;
    css(val, { fontSize: '18px', fontWeight: '800', color: accent, lineHeight: '1.1' });

    chip.appendChild(lbl);
    chip.appendChild(val);
    return { chip, val };
  }

  updateGuestCount(n: number): void {
    if (this.guestEl) this.guestEl.textContent = String(n);
  }

  // ─── Reputation stars ────────────────────────────────────────────────────────
  private buildRepBar(): HTMLDivElement {
    const wrap = document.createElement('div');
    css(wrap, {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
    });

    const lbl = document.createElement('div');
    lbl.textContent = 'REPUTATION';
    css(lbl, { fontSize: '9px', color: '#ffffff', opacity: '0.65', letterSpacing: '1px', fontWeight: '600' });

    const stars = document.createElement('div');
    css(stars, { display: 'flex', gap: '3px' });
    this.repStars = [];
    for (let i = 0; i < 5; i++) {
      const s = document.createElement('div');
      s.textContent = '★';
      css(s, {
        fontSize: '16px',
        color: i < this.eco.reputation ? '#f59e0b' : '#374151',
        transition: 'color 0.3s',
      });
      this.repStars.push(s);
      stars.appendChild(s);
    }
    wrap.appendChild(lbl);
    wrap.appendChild(stars);
    return wrap;
  }

  private updateStars(rep: number): void {
    this.repStars.forEach((s, i) => {
      s.style.color = i < rep ? '#f59e0b' : '#374151';
    });
  }

  // ─── Bottom build bar ────────────────────────────────────────────────────────
  private buildBottomBar(): void {
    const bar = document.createElement('div');
    css(bar, {
      position:      'absolute', bottom: '0', left: '0', width: '100%',
      display:       'flex',    justifyContent: 'center', alignItems: 'flex-end',
      pointerEvents: 'none',
      paddingBottom: '0',
    });

    const panel = document.createElement('div');
    css(panel, {
      background:   'linear-gradient(180deg,rgba(8,14,35,0.97) 0%,rgba(5,10,28,1) 100%)',
      border:       '1.5px solid rgba(99,179,237,0.3)',
      borderBottom: 'none',
      borderRadius: '16px 16px 0 0',
      padding:      '10px 24px 14px',
      display:      'flex',
      flexDirection:'column',
      alignItems:   'center',
      gap:          '8px',
      pointerEvents:'all',
      boxShadow:    '0 -6px 30px rgba(0,0,0,0.7)',
      minWidth:     '520px',
    });

    // Tab header
    const tabHeader = document.createElement('div');
    css(tabHeader, { display: 'flex', gap: '6px', alignItems: 'center' });

    for (const tab of ['BUILD', 'STAFF', 'SETTINGS'] as const) {
      const t = document.createElement('button');
      t.textContent = tab;
      css(t, {
        background:   tab === 'BUILD' ? 'rgba(56,189,248,0.15)' : 'transparent',
        border:       tab === 'BUILD' ? '1px solid rgba(56,189,248,0.5)' : '1px solid transparent',
        borderRadius: '6px',
        color:        tab === 'BUILD' ? '#7dd3fc' : '#64748b',
        padding:      '3px 12px',
        fontSize:     '11px',
        fontWeight:   '700',
        letterSpacing:'0.8px',
        cursor:       'pointer',
      });
      tabHeader.appendChild(t);
    }
    panel.appendChild(tabHeader);

    // Cards row
    const cardsRow = document.createElement('div');
    css(cardsRow, { display: 'flex', gap: '10px' });

    const facilityDefs = [
      { type: FacilityType.GYM,  label: 'GYM',          cost: 150,  icon: ICON_GYM,  accent: '#f59e0b', rep: '+⭐' },
      { type: FacilityType.POOL, label: 'POOL',          cost: 300,  icon: ICON_POOL, accent: '#38bdf8', rep: '+⭐⭐' },
      { type: FacilityType.SPA,  label: 'SPA',           cost: 500,  icon: ICON_SPA,  accent: '#f472b6', rep: '+⭐⭐⭐' },
    ];

    for (const def of facilityDefs) {
      cardsRow.appendChild(this.makeFacilityCard(def));
    }

    panel.appendChild(cardsRow);

    // Right: reputation + money mini stats
    const rightInfo = document.createElement('div');
    css(rightInfo, { display: 'flex', gap: '14px', alignItems: 'center', marginTop: '4px' });
    rightInfo.appendChild(this.buildRepBar());

    panel.appendChild(rightInfo);
    bar.appendChild(panel);
    this.root.appendChild(bar);
  }

  private makeFacilityCard(def: {
    type: FacilityType; label: string; cost: number;
    icon: string; accent: string; rep: string;
  }): HTMLDivElement {
    const card = document.createElement('div');
    css(card, {
      background:   `linear-gradient(160deg, rgba(30,30,60,0.95) 0%, rgba(20,20,45,0.98) 100%)`,
      border:       `2px solid ${def.accent}66`,
      borderRadius: '12px',
      padding:      '10px 14px',
      display:      'flex',
      flexDirection:'column',
      alignItems:   'center',
      gap:          '5px',
      cursor:       'pointer',
      transition:   'all 0.18s ease',
      minWidth:     '110px',
      boxShadow:    `0 2px 14px ${def.accent}22`,
    });

    // Icon
    const iconWrap = document.createElement('div');
    css(iconWrap, {
      width: '48px', height: '48px',
      background: `radial-gradient(circle, ${def.accent}22 0%, ${def.accent}08 100%)`,
      borderRadius: '10px',
      border: `1.5px solid ${def.accent}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    const iconImg = document.createElement('img');
    iconImg.src = svgToDataUri(def.icon.replace('currentColor', def.accent));
    css(iconImg, { width: '28px', height: '28px' });
    iconWrap.appendChild(iconImg);

    // Label
    const lbl = document.createElement('div');
    lbl.textContent = def.label;
    css(lbl, { fontSize: '12px', fontWeight: '800', color: def.accent, letterSpacing: '1.2px' });

    // Cost
    const costEl = document.createElement('div');
    costEl.textContent = `$${def.cost}`;
    css(costEl, { fontSize: '14px', fontWeight: '700', color: '#4ade80' });

    // Rep gain
    const repEl = document.createElement('div');
    repEl.textContent = def.rep;
    css(repEl, { fontSize: '10px', color: '#f59e0b', opacity: '0.85' });

    card.append(iconWrap, lbl, costEl, repEl);

    card.addEventListener('mouseenter', () => {
      card.style.border        = `2px solid ${def.accent}cc`;
      card.style.boxShadow     = `0 6px 28px ${def.accent}44`;
      card.style.transform     = 'translateY(-3px)';
      card.style.background    = `linear-gradient(160deg, rgba(40,40,80,0.98) 0%, rgba(25,25,55,1) 100%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.border        = `2px solid ${def.accent}66`;
      card.style.boxShadow     = `0 2px 14px ${def.accent}22`;
      card.style.transform     = '';
      card.style.background    = `linear-gradient(160deg, rgba(30,30,60,0.95) 0%, rgba(20,20,45,0.98) 100%)`;
    });
    card.addEventListener('click', () => this.onBuild(def.type));

    return card;
  }

  // ─── Guest Inspector panel ───────────────────────────────────────────────────
  private buildInspector(): void {
    this.inspector = document.createElement('div');
    css(this.inspector, {
      position:     'absolute', top: '60px', right: '10px',
      background:   'linear-gradient(135deg,rgba(10,20,50,0.97) 0%,rgba(8,16,40,0.95) 100%)',
      border:       '1.5px solid rgba(99,179,237,0.4)',
      borderRadius: '12px',
      padding:      '14px 18px',
      width:        '200px',
      pointerEvents:'all',
      display:      'none',
      boxShadow:    '0 8px 32px rgba(0,0,0,0.6)',
    });
    this.root.appendChild(this.inspector);
  }

  showInspector(guest: Guest): void {
    const info = guest.getInfo();

    const moodColor =
      info.mood === 'HAPPY'   ? '#4ade80' :
      info.mood === 'NEUTRAL' ? '#fbbf24' : '#f87171';
    const moodEmoji =
      info.mood === 'HAPPY'   ? '😊' :
      info.mood === 'NEUTRAL' ? '😐' : '😤';

    this.inspector.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="color:#7dd3fc;font-weight:800;font-size:14px">GUEST</span>
        <button id="inspector-close" style="background:none;border:none;color:#64748b;font-size:16px;cursor:pointer;line-height:1">×</button>
      </div>
      <div style="color:#ffffff;font-size:17px;font-weight:700;margin-bottom:8px">${info.name}</div>
      <div style="display:flex;flex-direction:column;gap:6px;font-size:12px">
        <div style="display:flex;justify-content:space-between">
          <span style="color:#94a3b8">Status</span>
          <span style="color:#e2e8f0;font-weight:600">${info.state}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#94a3b8">Mood</span>
          <span style="color:${moodColor};font-weight:600">${moodEmoji} ${info.mood}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#94a3b8">Facility</span>
          <span style="color:#e2e8f0;font-weight:600">${info.facility}</span>
        </div>
      </div>
    `;

    this.inspector.style.display = 'block';
    const closeBtn = this.inspector.querySelector('#inspector-close') as HTMLButtonElement | null;
    closeBtn?.addEventListener('click', () => { this.inspector.style.display = 'none'; });
  }

  destroy(): void {
    this.root.remove();
  }
}
