import { AnimModule } from './animBase.js';

export class ColorShift extends AnimModule {
  constructor(animator, element, options = {}) {
    super(animator);
    this.animator = animator;
    this.element = element;
    this.infoDiv = null;
    this.hue = options.startingHue ?? Math.random() * 360;
    this.styleProperty = options.styleProperty ?? 'background-color';

    // Color ranges with option overrides
    this.SAT_MIN = options.SAT_MIN ?? 30;
    this.SAT_MAX = options.SAT_MAX ?? 100;
    this.LIGHT_MIN = options.LIGHT_MIN ?? 40;
    this.LIGHT_MAX = options.LIGHT_MAX ?? 75;

    // Animation parameters with option overrides (per minute)
    this.HUE_SPEED_RPM = options.HUE_SPEED_RPM ?? 0.2;
    this.SAT_SPEED_CPM = options.SAT_SPEED_CPM ?? 1.0;
    this.LIGHT_SPEED_CPM = options.LIGHT_SPEED_CPM ?? 0.6;

    // Show controls by default
    const showControls = options.showControls ?? false;
    if (showControls) {
      this.createControls();
    }
  }

  /*
    createControls - Creates UI controls for adjusting color shift parameters
  */
  createControls() {
    // Create info element
    this.infoDiv = document.createElement('div');
    this.infoDiv.id = 'colorInfo';
    this.infoDiv.style.cssText = 'position: fixed; top: 10px; left: 10px; background: rgba(255,255,255,0.5); padding: 12px 16px; border-radius: 8px; font-family: monospace; font-size: 1rem; z-index: 10; user-select: none;';
    document.body.appendChild(this.infoDiv);

    // Create controls element
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = 'position: fixed; bottom: 20px; left: 20px; background: rgba(255,255,255,0.5); padding: 16px; border-radius: 8px; font-family: monospace; font-size: 0.9rem; z-index: 10; min-width: 250px;';

    const controlHTML = `
      <div id="colorShiftClose" class="close-btn">×</div>
      <div class="control-group">
        <label>Hue Speed (rotations/min): <span class="value" id="hueSpeedValue">${this.HUE_SPEED_RPM.toFixed(1)}</span></label>
        <input type="range" id="hueSpeedSlider" min="0" max="60" step="0.1" value="${this.HUE_SPEED_RPM}">
      </div>
      <div class="control-group">
        <label>Saturation Frequency (cycles/min): <span class="value" id="satFreqValue">${this.SAT_SPEED_CPM.toFixed(1)}</span></label>
        <input type="range" id="satFreqSlider" min="0" max="60" step="0.1" value="${this.SAT_SPEED_CPM}">
      </div>
      <div class="control-group">
        <label>Lightness Frequency (cycles/min): <span class="value" id="lightFreqValue">${this.LIGHT_SPEED_CPM.toFixed(1)}</span></label>
        <input type="range" id="lightFreqSlider" min="0" max="60" step="0.1" value="${this.LIGHT_SPEED_CPM}">
      </div>
    `;
    controlsDiv.innerHTML = controlHTML;
    
    // Add CSS for control groups if not already present
    if (!document.getElementById('colorShiftStyles')) {
      const style = document.createElement('style');
      style.id = 'colorShiftStyles';
      style.textContent = `
        .close-btn {
          position: absolute;
          top: 4px;
          right: 8px;
          cursor: pointer;
          font-size: 1.2rem;
          font-weight: bold;
          line-height: 1;
          opacity: 0.6;
        }
        .close-btn:hover {
          opacity: 1;
        }
        .control-group {
          margin-bottom: 12px;
        }
        .control-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: bold;
        }
        .control-group input {
          width: 100%;
          cursor: pointer;
        }
        .control-group .value {
          display: inline-block;
          margin-left: 8px;
          color: inherit;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(controlsDiv);

    this.setupControls(controlsDiv);
  }

  setupControls(controlsDiv) {
    const hueSpeedSlider = document.getElementById('hueSpeedSlider');
    const satFreqSlider = document.getElementById('satFreqSlider');
    const lightFreqSlider = document.getElementById('lightFreqSlider');
    const hueSpeedValue = document.getElementById('hueSpeedValue');
    const satFreqValue = document.getElementById('satFreqValue');
    const lightFreqValue = document.getElementById('lightFreqValue');
    const closeBtn = document.getElementById('colorShiftClose');

    closeBtn?.addEventListener('click', () => {
      controlsDiv?.remove();
      this.infoDiv?.remove();
      this.infoDiv = null;
    });

    hueSpeedSlider?.addEventListener('input', (e) => {
      this.HUE_SPEED_RPM = parseFloat(e.target.value);
      hueSpeedValue.textContent = this.HUE_SPEED_RPM.toFixed(1);
    });

    satFreqSlider?.addEventListener('input', (e) => {
      this.SAT_SPEED_CPM = parseFloat(e.target.value);
      satFreqValue.textContent = this.SAT_SPEED_CPM.toFixed(1);
    });

    lightFreqSlider?.addEventListener('input', (e) => {
      this.LIGHT_SPEED_CPM = parseFloat(e.target.value);
      lightFreqValue.textContent = this.LIGHT_SPEED_CPM.toFixed(1);
    });
  }

  update(time, dt) {
    // Convert RPM to degrees per millisecond: (RPM * 360) / 60000
    this.hue = (this.hue + (this.HUE_SPEED_RPM * 360 * dt / 60000)) % 360;

    const elapsedMinutes = time / 60000;
    const satRange = (this.SAT_MAX - this.SAT_MIN) / 2;
    const sat = this.SAT_MIN + satRange + satRange * Math.sin(elapsedMinutes * this.SAT_SPEED_CPM * 2 * Math.PI);

    const lightRange = (this.LIGHT_MAX - this.LIGHT_MIN) / 2;
    const light = this.LIGHT_MIN + lightRange + lightRange * Math.sin(elapsedMinutes * this.LIGHT_SPEED_CPM * 2 * Math.PI);

    const hsl = `hsl(${this.hue.toFixed(1)}, ${sat.toFixed(1)}%, ${light.toFixed(1)}%)`;
    this.element.style[this.styleProperty.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = hsl;
    if (this.infoDiv) {
      this.infoDiv.textContent = hsl;
    }
  }
}

// based on background-color property, sets color property. checks parents if needed
export class TextContrast extends AnimModule {
  constructor(animator, element, options = {}) {
    super(animator);
    this.element = element;
    this.lightColor = options.lightColor ?? '#ffffff';
    this.darkColor = options.darkColor ?? '#000000';
    this.targetProperty = options.targetProperty ?? 'color';
  }

  update() {
    const bgColor = this.getBackgroundColor();
    if (!bgColor) return;

    const luminance = this.calculateLuminance(bgColor);
    const textColor = luminance > 0.57 ? this.darkColor : this.lightColor;
    
    if (this.targetProperty.startsWith('--')) {
      if (this.element.style.getPropertyValue(this.targetProperty).trim() !== textColor) {
        this.element.style.setProperty(this.targetProperty, textColor);
      }
    } else {
      if (this.element.style[this.targetProperty] !== textColor) {
        this.element.style[this.targetProperty] = textColor;
      }
    }
  }

  getBackgroundColor() {
    let el = this.element;
    while (el) {
      const bgColor = window.getComputedStyle(el).backgroundColor;
      // Check for various forms of transparency
      if (bgColor && 
          bgColor !== 'rgba(0, 0, 0, 0)' && 
          bgColor !== 'transparent' && 
          bgColor !== '') {
        return bgColor;
      }
      el = el.parentElement;
    }
    return null;
  }

  calculateLuminance(color) {
    // Parse HSL or RGB color
    let r, g, b;

    if (color.startsWith('hsl')) {
      [r, g, b] = this.hslToRgb(color);
    } else {
      [r, g, b] = this.parseRgb(color);
    }

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance;
  }

  parseRgb(color) {
    const match = color.match(/\d+/g);
    return match ? [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])] : [0, 0, 0];
  }

  hslToRgb(color) {
    const match = color.match(/\d+\.?\d*/g);
    if (!match) return [0, 0, 0];

    const h = parseInt(match[0]) / 360;
    const s = parseInt(match[1]) / 100;
    const l = parseInt(match[2]) / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = this.hueToRgb(p, q, h + 1 / 3);
      g = this.hueToRgb(p, q, h);
      b = this.hueToRgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
}
