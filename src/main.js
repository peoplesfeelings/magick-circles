import { regularVerts, polygons, createPathElement, createCircle } from './geometry.js?v=2';
import { Animator } from './animBase.js';
import { ColorShift, TextContrast } from './colorShift.js';

// state
window.state = {};
polygons.forEach(d => window.state[d.key] = false);

// Stroke width: single base value (scaled proportionally with size)
const BASE_STROKE = 3;
const BASE_SIZE = 800; // reference size for scaling

const svg = document.getElementById('svg');
const downloadBtn = document.getElementById('download');
const controls = document.getElementById('controls');
const chevronBtn = document.getElementById('chevronBtn');

const urlParams = new URLSearchParams(window.location.search);
const showControls = urlParams.has('colorcontrols');
const presentationMode = urlParams.has('presentation');

// Initialize animator and color shift for background
const animator = new Animator();

new ColorShift(animator, document.documentElement, {
  SAT_MIN: 30,
  SAT_MAX: 100,
  LIGHT_MIN: 35,
  LIGHT_MAX: 65,
  showControls: showControls
});

new TextContrast(animator, svg, {
  targetProperty: '--line'
});

new TextContrast(animator, controls);
// Ensure download button text contrasts with its background
new TextContrast(animator, downloadBtn);

// new TextContrast(animator, controls, {
//   targetProperty: '--line'
// });

new TextContrast(animator, chevronBtn);



animator.start();

// draw everything given a pixel canvas size
function draw(sz) {
  svg.setAttribute('viewBox', `0 0 ${sz} ${sz}`);
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const cx = sz/2, cy = sz/2;
  const outerR = Math.min(sz, sz) * 0.42;
  const strokeWidth = Math.max(2, (BASE_STROKE * sz) / BASE_SIZE);

  // background outer circle
  svg.appendChild(createCircle(cx, cy, outerR, strokeWidth));

  for (const d of polygons) {
    if (!window.state[d.key]) continue;

    if (d.components) {
      for (const c of d.components) {
         const verts = regularVerts(c.n, cx, cy, outerR, c.rotation);
         svg.appendChild(createPathElement(verts, c.step, strokeWidth));
      }
    } else {
      const verts = regularVerts(d.n, cx, cy, outerR, d.rotation);
      svg.appendChild(createPathElement(verts, d.step, strokeWidth));
    }
  }
}

// initial draw
draw(BASE_SIZE);

chevronBtn.addEventListener('click', (e) => {
  document.getElementById('controls').classList.toggle('minimized');
  e.currentTarget.classList.toggle('closed');
});
// Generic shape visibility toggles
(function installGenericToggles() {
  polygons.forEach(d => {
    const name = d.key;
    const el = document.querySelector(`input[name="${name}"]`);
    if (!el) return;
    el.addEventListener('change', (e) => {
      window.state[name] = e.target.checked;
      draw(BASE_SIZE);
    });
  });
})();

// download as PNG by rendering SVG to canvas
downloadBtn.addEventListener('click', () => {
  const size = BASE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // collect computed CSS vars dynamically
  const style = getComputedStyle(document.documentElement);
  const bg = style.backgroundColor;
  const line = style.getPropertyValue('--line').trim();

  const svgClone = svg.cloneNode(true);
  svgClone.setAttribute('width', size);
  svgClone.setAttribute('height', size);

  const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleElement.textContent = `
    svg { background: ${bg}; }
    circle, path { stroke: ${line}; }
  `;
  svgClone.insertBefore(styleElement, svgClone.firstChild);

  const svgData = new XMLSerializer().serializeToString(svgClone);
  const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
  const reader = new FileReader();

  reader.onload = function(e) {
    const img = new Image();
    img.onerror = function() { console.error('Image failed to load'); };
    img.onload = function() {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'magick-shapes.png';
      a.click();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(svgBlob);
});

// Presentation mode
if (presentationMode) {
  const presentationControls = document.getElementById('presentationControls');
  presentationControls.style.display = 'block';

  controls.classList.add('minimized');
  chevronBtn.classList.add('closed');

  let wakeLock = null;
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  };
  requestWakeLock();

  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      await requestWakeLock();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  const combos = [
    ['doubleSquare', 'hexagon'],
    ['nonagon', 'nonagram_9_2', 'nonagram_9_4', 'tripleTriangle'],
    ['pentagram', 'pentagon', 'heptagram_7_2', 'heptagram_7_3', 'heptagon'],
    ['heptagram_7_2', 'nonagram_9_2'],
    ['triangleUp', 'hexagon', 'nonagram_9_2'],
    ['hexagon', 'heptagram_7_3', 'nonagram_9_2'],
    ['tripleTriangle', 'pentagon', 'heptagram_7_2'],
    ['heptagon','heptagram_7_2','heptagram_7_3' ],
    ['hexagon','triangleUp' ],
    ['octagram','octagon','doubleSquare'],
    ['tripleTriangle','nonagram_9_2'],
    ['hexagon','heptagon','octagon','nonagon'],
    ['doubleTriangle','nonagram_9_4'],
    ['pentagram','heptagram_7_3','nonagram_9_4']
  ];

  let comboIndex = Math.floor(Math.random() * combos.length);
  let combosShown = [comboIndex];

  const pickRandomComboIndex = () => {
    // If we've shown all combos, reset the list
    if (combosShown.length === combos.length) {
      combosShown = [];
    }

    // Find candidates not in combosShown
    let candidates = [];
    for (let i = 0; i < combos.length; i++) {
      if (!combosShown.includes(i)) {
        candidates.push(i);
      }
    }

    // If we just reset (full deck), don't repeat previous combo immediately
    if (combosShown.length === 0 && combos.length > 1) {
      candidates = candidates.filter(i => i !== comboIndex);
    }
    
    const newIndex = candidates[Math.floor(Math.random() * candidates.length)];
    combosShown.push(newIndex);
    return newIndex;
  };
  const intervalTime = 25000; 
  let timer = null;

  // Function to apply a specific combo
  const applyCombo = (index) => {
    const combo = combos[index];
    console.log('Current combo:', JSON.stringify(combo));
    
    // Reset all states
    Object.keys(window.state).forEach(k => window.state[k] = false);
    
    // Set combo states
    combo.forEach(k => {
      if (window.state.hasOwnProperty(k)) {
        window.state[k] = true;
      }
    });

    // Update UI checkboxes
    polygons.forEach(d => {
      const el = document.querySelector(`input[name="${d.key}"]`);
      if (el) el.checked = window.state[d.key];
    });

    draw(BASE_SIZE);
  };

  const transitionToNext = () => {
    svg.classList.add('fade-out');

    setTimeout(() => {
      comboIndex = pickRandomComboIndex();
      applyCombo(comboIndex);
      svg.classList.remove('fade-out');
    }, 2000);
  };

  const startTimer = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(transitionToNext, intervalTime);
  };

  const stopTimer = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  const manualTransition = () => {
    stopTimer();
    comboIndex = pickRandomComboIndex();
    applyCombo(comboIndex);
    startTimer();
  };

  // Start immediately
  applyCombo(comboIndex);
  startTimer();

  // Click on SVG to advance
  svg.addEventListener('click', manualTransition);

  // Button handlers
  const stopBtn = document.getElementById('stopBtn');
  const nextBtn = document.getElementById('nextBtn');

  const handleKeydown = (e) => {
    if (e.key === 'f' || e.key === 'F') {
      manualTransition();
    }
  };

  nextBtn.addEventListener('click', () => manualTransition());
  stopBtn.addEventListener('click', () => {
    stopTimer();
    svg.removeEventListener('click', manualTransition);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('keydown', handleKeydown);
    presentationControls.style.display = 'none';
    if (wakeLock) {
      wakeLock.release().then(() => {
        wakeLock = null;
      });
    }
  });

  document.addEventListener('keydown', handleKeydown);
}
