const SVG_NS = "http://www.w3.org/2000/svg";

// helper to create SVG elements with attributes
export function make(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k,v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

// create n regular vertices on circle (radius r) with rotation offset (radians)
export function regularVerts(n, cx, cy, r, rotation = -Math.PI/2) {
  const verts = [];
  for (let i = 0; i < n; i++) {
    const theta = rotation + (i * 2 * Math.PI / n);
    verts.push([ cx + r * Math.cos(theta), cy + r * Math.sin(theta) ]);
  }
  return verts;
}

// build path string from verts by stepping k (works for polygon or star {n/k})
export function pathFromVerts(verts, step = 1) {
  const n = verts.length;
  let visited = new Set();
  let idx = 0;
  const parts = [`M ${verts[0][0].toFixed(3)} ${verts[0][1].toFixed(3)}`];
  while (!visited.has(idx)) {
    visited.add(idx);
    const [x,y] = verts[idx];
    parts.push(`L ${x.toFixed(3)} ${y.toFixed(3)}`);
    idx = (idx + step) % n;
  }
  parts.push('Z');
  return parts.join(' ');
}

// descriptor: key maps to state key, n = vertices, step = default step (1 for polygon), rotation
export const shapeDescriptors = [
  { key: 'triangleUp', n: 3, step: 1, rotation: -Math.PI/2 },
  { key: 'tetragram', n: 4, step: 1, rotation: -Math.PI/2 },
  { key: 'hexagon', n: 6, step: 1, rotation: -Math.PI/2 },
  { key: 'pentagon', n: 5, step: 1, rotation: -Math.PI/2 },
  { key: 'pentagram', n: 5, step: 2, rotation: -Math.PI/2 },
  { key: 'heptagon', n: 7, step: 1, rotation: -Math.PI/2 },
  { key: 'octagon', n: 8, step: 1, rotation: -Math.PI/2 },
  { key: 'nonagon', n: 9, step: 1, rotation: -Math.PI/2 },
  { key: 'octagram', n: 8, step: 3, rotation: -Math.PI/2 },
  { key: 'heptagram_7_2', n: 7, step: 2, rotation: -Math.PI/2 },
  { key: 'heptagram_7_3', n: 7, step: 3, rotation: -Math.PI/2 },
  { key: 'nonagram_9_2', n: 9, step: 2, rotation: -Math.PI/2 },
  { key: 'nonagram_9_4', n: 9, step: 4, rotation: -Math.PI/2 },
  { 
    key: 'doubleTriangle', 
    components: [
      { n: 3, step: 1, rotation: -Math.PI/2 },
      { n: 3, step: 1, rotation: -Math.PI/2 + Math.PI/3 }
    ]
  },
  { 
    key: 'doubleSquare', 
    components: [
      { n: 4, step: 1, rotation: 0 },
      { n: 4, step: 1, rotation: -Math.PI/4 }
    ]
  },
  { 
    key: 'tripleTriangle', 
    components: [
      { n: 3, step: 1, rotation: -Math.PI/2 },
      { n: 3, step: 1, rotation: -Math.PI/2 + (40 * Math.PI/180) },
      { n: 3, step: 1, rotation: -Math.PI/2 + (80 * Math.PI/180) }
    ]
  }
];

export function createPathElement(verts, step, strokeWidth) {
  return make('path', {
    d: pathFromVerts(verts, step),
    fill: 'none',
    stroke: 'var(--line)',
    'stroke-width': strokeWidth,
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
    opacity: 0.95
  });
}

export function createCircle(cx, cy, r, strokeWidth) {
  return make('circle', {
    cx, cy, r,
    fill: 'none',
    stroke: 'var(--line)',
    'stroke-width': strokeWidth
  });
}
