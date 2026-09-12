/* Educational illustrations of Ashspace contracts. No library runtime is loaded.
   Source: RigidTransform3, FrameGraph3, GridSpaceMapper3, ChunkLocalIndexer,
   GeometryTransforms3. Controls stay in an ordinary finite numerical range. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const mounted = new WeakMap();
  let sequence = 0;
  const zero = { x: 0, y: 0, z: 0 };
  const fmt = (v, digits = 2) => (Math.abs(v) < 1e-7 ? 0 : v).toFixed(digits);
  const tuple = (p) => `(${fmt(p.x)}, ${fmt(p.y)}, ${fmt(p.z)})`;
  const radians = (degrees) => degrees * Math.PI / 180;
  // Positive Y rotation agrees with Ashcore's right-handed quaternion rotation.
  function rotate(p, degrees, t = zero) {
    const c = Math.cos(radians(degrees)), s = Math.sin(radians(degrees));
    return { x: c * p.x + s * p.z + t.x, y: p.y + t.y, z: -s * p.x + c * p.z + t.z };
  }
  function add(parent, tag, attrs = {}, text) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    parent.appendChild(node);
    return node;
  }
  const line = (svg, a, b, cls = 'diagram-line', extra = {}) => add(svg, 'line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: cls, ...extra });
  const label = (svg, x, y, text, cls = 'diagram-label', anchor = 'start') => add(svg, 'text', { x, y, class: cls, 'text-anchor': anchor }, text);
  const circle = (svg, p, cls = 'diagram-point', r = 5) => add(svg, 'circle', { cx: p.x, cy: p.y, r, class: cls });
  const polygon = (svg, points, cls) => add(svg, 'polygon', { points: points.map((p) => `${p.x},${p.y}`).join(' '), class: cls });
  function begin(svg, id, title, description) {
    svg.replaceChildren();
    add(svg, 'title', { id: `${id}-title` }, title);
    add(svg, 'desc', { id: `${id}-desc` }, description);
    svg.setAttribute('aria-labelledby', `${id}-title ${id}-desc`);
    const defs = add(svg, 'defs');
    ['accent', 'x', 'y', 'z', 'muted', 'warm'].forEach((color) => {
      const marker = add(defs, 'marker', { id: `${id}-${color}`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' });
      add(marker, 'path', { d: 'M1 1 L9 5 L1 9 Z', class: `diagram-fill-${color}` });
    });
  }
  function arrow(svg, a, b, id, color = 'accent', extra = {}) {
    return line(svg, a, b, `diagram-arrow diagram-stroke-${color}`, { 'marker-end': `url(#${id}-${color})`, ...extra });
  }
  function dot(svg, p, name = '', color = 'accent') {
    circle(svg, p, `diagram-halo diagram-fill-${color}`, 11);
    circle(svg, p, `diagram-point diagram-fill-${color}`);
    if (name) label(svg, p.x + 12, p.y - 12, name, `diagram-strong diagram-fill-${color}`);
  }
  function grid(svg, project, minX, maxX, minZ, maxZ, step = 1) {
    const g = add(svg, 'g', { class: 'diagram-grid' });
    for (let x = minX; x <= maxX; x += step) line(g, project(x, minZ), project(x, maxZ), '');
    for (let z = minZ; z <= maxZ; z += step) line(g, project(minX, z), project(maxX, z), '');
  }
  // Keep control states in the same utility layer as their default styles.
  const buttonClass = 'cursor-pointer appearance-none rounded-md border border-line bg-transparent px-3 py-[7px] text-[11px] leading-[1.4] text-muted hover:bg-[var(--diagram-muted-surface)] hover:text-foreground print:hidden';
  const segmentClass = 'cursor-pointer rounded border-0 bg-transparent px-3 py-1.5 text-xs font-[550] leading-[1.4] text-muted hover:text-foreground aria-pressed:bg-[var(--diagram-muted-surface)] aria-pressed:text-foreground aria-pressed:shadow-[0_1px_2px_#00000012]';
  function range(id, key, title, min, max, step, value, suffix = '') {
    return `<div class="diagram-control min-w-0"><div class="diagram-control-label mb-[9px] flex items-baseline justify-between gap-2 max-[620px]:flex-col max-[620px]:items-start max-[620px]:gap-1"><label class="text-xs leading-normal text-foreground" for="${id}-${key}">${title}</label><output class="diagram-control-value whitespace-nowrap font-mono text-[11px] text-muted tabular-nums" for="${id}-${key}" data-value="${key}"></output></div><input class="m-0 block h-[18px] w-full cursor-pointer p-0 accent-accent" id="${id}-${key}" data-control="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><div class="diagram-range-labels mt-[5px] flex justify-between text-[10px] leading-[1.2] text-muted" aria-hidden="true"><span>${min}${suffix}</span><span>${max}${suffix}</span></div></div>`;
  }
  function segments(key, title, options, initial) {
    return `<div class="diagram-segmented inline-flex flex-wrap items-center rounded-[7px] border border-line bg-page p-[3px]" role="group" aria-label="${title}">${options.map(([value, text]) => `<button type="button" class="${segmentClass}" data-choice="${key}" data-option="${value}" aria-pressed="${value === initial}">${text}</button>`).join('')}</div>`;
  }
  function shell(host, config) {
    const id = `ashspace-diagram-${++sequence}`;
    host.innerHTML = `<figure class="diagram-component mx-0 my-[26px] overflow-hidden rounded-xl border border-line bg-surface font-sans text-[13px] leading-normal text-foreground print:break-inside-avoid" aria-label="${config.title}">
      <div class="diagram-toolbar flex items-center justify-between gap-3 border-b border-line px-[18px] py-3.5 max-[620px]:flex-wrap max-[620px]:p-3">${config.choices || `<span class="text-xs font-semibold">${config.title}</span>`}<span class="diagram-plane-label whitespace-nowrap text-[11px] text-muted">${config.badge}</span></div>
      <div class="diagram-scene-wrap"><svg class="diagram-scene block h-auto w-full" viewBox="0 0 720 ${config.height || 360}" role="img"></svg></div>
      <div class="diagram-readout grid grid-cols-2 gap-x-5 gap-y-3 border-y border-line px-5 py-4 max-[620px]:grid-cols-1 max-[620px]:px-3.5" aria-live="polite" aria-atomic="true">${config.stats.map(([key, name]) => `<div class="min-w-0"><span class="block text-[11px] text-muted">${name}</span><output class="diagram-output mt-1 block font-mono text-xs" data-stat="${key}"></output></div>`).join('')}</div>
      <div class="diagram-controls grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[26px] px-5 pt-[19px] pb-[15px] max-[620px]:grid-cols-1 max-[620px]:gap-[18px] max-[620px]:px-3.5 max-[620px]:pt-[17px] max-[620px]:pb-3.5 print:hidden"><div class="grid ${config.singleControl ? 'grid-cols-1' : 'grid-cols-2'} items-center gap-[26px] max-[620px]:gap-[18px]">${config.controls(id)}</div><div class="flex flex-wrap items-center gap-2 max-[620px]:justify-self-start">${config.action || ''}<button type="button" class="diagram-reset ${buttonClass}" data-reset>Reset</button></div></div>
      <figcaption class="diagram-caption px-5 pt-px pb-[18px] text-[11px] leading-[1.7] text-muted max-[620px]:px-3.5 max-[620px]:pt-0 max-[620px]:pb-4">${config.caption}</figcaption></figure>`;
    const cleanups = [];
    return { id, svg: host.querySelector('svg'),
      on(selector, event, fn) { host.querySelectorAll(selector).forEach((node) => { node.addEventListener(event, fn); cleanups.push(() => node.removeEventListener(event, fn)); }); },
      stat(key, value) { host.querySelector(`[data-stat="${key}"]`).textContent = value; },
      value(key, value) { host.querySelector(`[data-value="${key}"]`).textContent = value; host.querySelector(`[data-control="${key}"]`).setAttribute('aria-valuetext', value); },
      choices(state) { host.querySelectorAll('[data-choice]').forEach((b) => b.setAttribute('aria-pressed', String(state[b.dataset.choice] === b.dataset.option))); },
      resetControls(state) { host.querySelectorAll('[data-control]').forEach((input) => { input.value = state[input.dataset.control]; }); },
      cleanup() { cleanups.forEach((fn) => fn()); }
    };
  }
  function controls(f, state, defaults, draw) {
    f.on('[data-control]', 'input', (e) => { state[e.target.dataset.control] = Number(e.target.value); draw(); });
    f.on('[data-choice]', 'click', (e) => { const b = e.currentTarget; state[b.dataset.choice] = b.dataset.option; draw(); });
    f.on('[data-reset]', 'click', () => { Object.assign(state, defaults); f.resetControls(state); draw(); });
    draw();
    return f.cleanup;
  }

  function coordinates(host) {
    const defaults = { angle: 30, offset: 2, kind: 'point' }, state = { ...defaults };
    const local = { x: 2, y: 1, z: 1 };
    const f = shell(host, { title: 'A point moves with its frame', badge: 'Y-up · right-handed',
      choices: segments('kind', 'Value to transform', [['point', 'Point'], ['vector', 'Vector / direction']], 'point'),
      stats: [['local', 'Local input (X, Y, Z)'], ['world', 'World result (X, Y, Z)'], ['formula', 'Operation'], ['rotation', 'Angle passed to the API']],
      controls: (id) => range(id, 'angle', 'Y rotation', -180, 180, 1, 30, '°') + range(id, 'offset', 'Frame origin X', -2, 4, 0.1, 2),
      caption: 'Move the frame origin and compare a point with a vector. A point receives rotation and translation. A vector or direction receives rotation only; its length is not normalized. The illustrated input is (2, 1, 1). Units are blocks in this example; the controls display degrees and convert them to radians.' });
    const project = (p) => ({ x: 325 + (p.x - p.z) * 27, y: 198 + (p.x + p.z) * 12 - p.y * 34 });
    function draw() {
      const origin = { x: state.offset, y: 0, z: 0 }, result = rotate(local, state.angle, state.kind === 'point' ? origin : zero);
      begin(f.svg, f.id, 'Local point and vector conversion', `${state.kind} ${tuple(local)} is rotated ${state.angle} degrees about Y. Frame origin ${tuple(origin)}. World result ${tuple(result)}.`);
      grid(f.svg, (x, z) => project({ x, y: 0, z }), -4, 7, -4, 5);
      const worldOrigin = project(zero);
      [['x', { x: 6, y: 0, z: 0 }, 'X'], ['y', { x: 0, y: 4, z: 0 }, 'Y'], ['z', { x: 0, y: 0, z: 5 }, 'Z']].forEach(([axis, p, name]) => {
        const end = project(p); arrow(f.svg, worldOrigin, end, f.id, axis);
        label(f.svg, end.x + 10, end.y - 8, name, `diagram-strong diagram-fill-${axis}`);
      });
      const corners = [{ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 2, y: 0, z: 1 }, { x: 0, y: 0, z: 1 },
        { x: 0, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 2, y: 1, z: 1 }, { x: 0, y: 1, z: 1 }].map((p) => project(rotate(p, state.angle, origin)));
      [[0, 1, 2, 3], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [4, 5, 6, 7]].forEach((face) => polygon(f.svg, face.map((i) => corners[i]), 'diagram-box'));
      const localOrigin = project(origin);
      [['x', { x: 2.8, y: 0, z: 0 }], ['y', { x: 0, y: 2.2, z: 0 }], ['z', { x: 0, y: 0, z: 2.3 }]].forEach(([axis, p]) => {
        const end = project(rotate(p, state.angle, origin)); arrow(f.svg, localOrigin, end, f.id, axis, { 'stroke-dasharray': '5 4' });
        label(f.svg, end.x + 10, end.y + 12, `${axis}′`, `diagram-label diagram-fill-${axis}`);
      });
      circle(f.svg, worldOrigin, 'diagram-origin', 4); circle(f.svg, localOrigin, 'diagram-open-accent');
      const end = project(result);
      if (state.kind === 'vector') arrow(f.svg, worldOrigin, end, f.id, 'accent', { 'stroke-width': 3 });
      else line(f.svg, end, project({ x: result.x, y: 0, z: result.z }), 'diagram-dashed');
      label(f.svg, 32, 32, state.kind === 'point' ? 'Point attached to the local box' : 'Vector drawn from world origin', 'diagram-muted-label');
      dot(f.svg, end, state.kind === 'point' ? 'P' : 'v');
      label(f.svg, 32, 337, 'Solid axes: world', 'diagram-muted-label'); label(f.svg, 365, 337, 'Dashed axes: local frame', 'diagram-muted-label');
      f.stat('local', tuple(local)); f.stat('world', tuple(result)); f.stat('formula', state.kind === 'point' ? 'transformPoint(p) = R·p + t' : 'transformVector(v) = R·v');
      f.stat('rotation', `${fmt(radians(state.angle), 4)} radians`); f.value('angle', `${state.angle}°`); f.value('offset', `${fmt(state.offset, 1)} blocks`); f.choices(state);
    }
    return controls(f, state, defaults, draw);
  }

  function composition(host) {
    const defaults = { angle: 60, offset: 3, order: 'ab' }, state = { ...defaults }, p = { x: 1, y: 0, z: 1 };
    const f = shell(host, { title: 'The order of then() changes the result', badge: 'XZ plane · top view',
      choices: segments('order', 'Selected transform composition', [['ab', 'a.then(b)'], ['ba', 'b.then(a)']], 'ab'),
      stats: [['operation', 'Selected order'], ['result', 'Result (X, Y, Z)'], ['a', 'Transform a'], ['b', 'Transform b']],
      controls: (id) => range(id, 'angle', 'Rotation a', -180, 180, 1, 60, '°') + range(id, 'offset', 'Translation b along X', 0, 4, 0.1, 3),
      caption: 'Start at P = (1, 0, 1). The blue path applies rotation a, then translation b. The amber path applies translation b, then rotation a. A transform stored in a.then(b) produces the same result as b.transformPoint(a.transformPoint(P)). A filled dot is the final result; an open dot is the intermediate result. The second operation also transforms the translation introduced by the first.' });
    function draw() {
      const t = { x: state.offset, y: 0, z: 0 }, a = rotate(p, state.angle), b = rotate(p, 0, t), ab = rotate(a, 0, t), ba = rotate(b, state.angle);
      begin(f.svg, f.id, 'Transform composition order', `a rotates ${state.angle} degrees about Y. b translates X by ${state.offset}. a then b gives ${tuple(ab)}. b then a gives ${tuple(ba)}.`);
      [{ cx: 177, title: 'a → b', steps: [p, a, ab], color: 'accent', selected: state.order === 'ab' },
        { cx: 537, title: 'b → a', steps: [p, b, ba], color: 'warm', selected: state.order === 'ba' }].forEach((panel) => {
        const project = (x, z) => ({ x: panel.cx + x * 23, y: 187 + z * 23 });
        add(f.svg, 'rect', { x: panel.cx - 164, y: 12, width: 334, height: 336, rx: 8, class: panel.selected ? 'diagram-panel-selected' : 'diagram-panel' });
        label(f.svg, panel.cx, 39, panel.title, `diagram-strong diagram-fill-${panel.color}`, 'middle'); grid(f.svg, project, -6, 6, -5, 5);
        arrow(f.svg, project(-6, 0), project(6, 0), f.id, 'muted'); arrow(f.svg, project(0, -5), project(0, 5), f.id, 'muted');
        label(f.svg, panel.cx + 142, 179, 'X', 'diagram-muted-label'); label(f.svg, panel.cx + 10, 306, 'Z', 'diagram-muted-label');
        const points = panel.steps.map((v) => project(v.x, v.z));
        arrow(f.svg, points[0], points[1], f.id, panel.color, { 'stroke-dasharray': '4 4' }); arrow(f.svg, points[1], points[2], f.id, panel.color, { 'stroke-width': 3 });
        circle(f.svg, points[0], 'diagram-origin', 4); circle(f.svg, points[1], `diagram-open-${panel.color}`); dot(f.svg, points[2], '', panel.color);
        label(f.svg, panel.cx, 332, tuple(panel.steps[2]), 'diagram-mono-label', 'middle');
      });
      f.stat('operation', state.order === 'ab' ? 'a first → b second' : 'b first → a second'); f.stat('result', tuple(state.order === 'ab' ? ab : ba));
      f.stat('a', `Y rotation ${state.angle}°`); f.stat('b', `Translation (${fmt(state.offset)}, 0, 0)`); f.value('angle', `${state.angle}°`); f.value('offset', `${fmt(state.offset, 1)} blocks`); f.choices(state);
    }
    return controls(f, state, defaults, draw);
  }

  function frameChain(host) {
    const defaults = { offset: 10, angle: 0 }, state = { ...defaults };
    const f = shell(host, { title: 'Convert between two frames on one ship', badge: 'tool → seat',
      stats: [['seat', 'Point in seat coordinates'], ['world', 'The same point in world coordinates'], ['path', 'Composed path'], ['ancestor', 'Nearest common ancestor']],
      controls: (id) => range(id, 'offset', 'Ship world X', 0, 100, 1, 10) + range(id, 'angle', 'Tool Y rotation', -90, 90, 1, 0, '°'),
      caption: 'The tool point is (1, 0, 0). The seat origin is (−2, 0, 0) in ship space, and the tool origin is (2, 1, 0). frames.transform(tool, seat) composes tool → ship and the inverse of seat → ship. Moving the shared ship changes world coordinates while preserving the relative result. Only edges below the nearest common ancestor are composed.' });
    function node(x, y, name, detail, active) {
      add(f.svg, 'rect', { x: x - 96, y: y - 28, width: 192, height: 58, rx: 8, class: active ? 'diagram-node-active' : 'diagram-node' });
      label(f.svg, x, y - 4, name, 'diagram-strong', 'middle'); label(f.svg, x, y + 17, detail, 'diagram-muted-label', 'middle');
    }
    function draw() {
      const inShip = rotate({ x: 1, y: 0, z: 0 }, state.angle, { x: 2, y: 1, z: 0 }), inSeat = rotate(inShip, 0, { x: 2, y: 0, z: 0 }), inWorld = rotate(inShip, 0, { x: state.offset, y: 0, z: 0 });
      begin(f.svg, f.id, 'Frame graph and shared ancestor', `world is parent of ship; ship is parent of seat and tool. Ship world X is ${state.offset}. Tool Y rotation is ${state.angle} degrees. Tool point (1,0,0) maps to seat ${tuple(inSeat)} and world ${tuple(inWorld)}.`);
      line(f.svg, { x: 360, y: 74 }, { x: 360, y: 151 }, 'diagram-dashed'); label(f.svg, 375, 110, `X = ${state.offset}`, 'diagram-muted-label'); label(f.svg, 375, 128, 'shared world offset', 'diagram-muted-label');
      arrow(f.svg, { x: 526, y: 260 }, { x: 417, y: 205 }, f.id, 'accent', { 'stroke-width': 3 }); arrow(f.svg, { x: 305, y: 205 }, { x: 194, y: 260 }, f.id, 'accent', { 'stroke-width': 3 });
      label(f.svg, 497, 226, 'to parent'); label(f.svg, 184, 226, 'inverse');
      node(360, 45, 'world', 'root frame', false); node(360, 177, 'ship', 'nearest common ancestor', true); node(156, 294, 'seat', 'target frame', true); node(564, 294, 'tool', 'source frame', true);
      f.stat('seat', tuple(inSeat)); f.stat('world', tuple(inWorld)); f.stat('path', 'tool → ship → seat'); f.stat('ancestor', 'ship'); f.value('offset', `${state.offset} blocks`); f.value('angle', `${state.angle}°`);
    }
    return controls(f, state, defaults, draw);
  }

  function gridFigure(host) {
    const defaults = { x: -0.25, size: 1 }, state = { ...defaults };
    const f = shell(host, { title: 'Negative coordinates still belong to a cell', badge: '16 × 16 XZ chunks', height: 320,
      stats: [['point', 'World point (X, Y, Z)'], ['cell', 'Containing cell (x, y, z)'], ['chunk', 'Chunk index (cx, cz)'], ['local', 'Chunk-local (lx, ly, lz)']],
      controls: (id) => range(id, 'x', 'World point X', -32, 32, 0.25, -0.25) + range(id, 'size', 'Cell size', 0.5, 2, 0.5, 1),
      caption: 'The origin is (0, 0, 0). Cell lookup uses floor((world − origin) / cellSize). Chunk X and Z use floor division by 16; local X and Z use floor modulo. At X = −0.25 with unit cells, cell X is −1, chunk X is −1, and local X is 15. Local Y stays equal to the global cell Y. The lower strip enlarges the selected chunk.' });
    function draw() {
      const p = { x: state.x, y: 64.5, z: -1.25 }, c = { x: Math.floor(p.x / state.size), y: Math.floor(p.y / state.size), z: Math.floor(p.z / state.size) };
      const cx = Math.floor(c.x / 16), cz = Math.floor(c.z / 16), lx = c.x - cx * 16, lz = c.z - cz * 16;
      begin(f.svg, f.id, 'Floor cell lookup and chunk-local addressing', `World ${tuple(p)}, cell size ${state.size}. Cell (${c.x},${c.y},${c.z}). Chunk (${cx},${cz}). Chunk-local (${lx},${c.y},${lz}).`);
      label(f.svg, 40, 31, `World X = ${fmt(state.x)} → normalized X = ${fmt(state.x / state.size)}`, 'diagram-mono-label');
      const start = (cx - 1) * 16;
      for (let chunk = 0; chunk < 3; chunk++) {
        const x = 40 + chunk * 640 / 3;
        add(f.svg, 'rect', { x, y: 65, width: 640 / 3, height: 80, class: chunk === 1 ? 'diagram-cell-selected' : 'diagram-cell' });
        label(f.svg, x + 320 / 3, 167, `chunk X = ${cx + chunk - 1}`, chunk === 1 ? 'diagram-strong diagram-fill-accent' : 'diagram-muted-label', 'middle');
        for (let cell = 1; cell < 16; cell++) line(f.svg, { x: x + cell * 640 / 48, y: 65 }, { x: x + cell * 640 / 48, y: 145 }, 'diagram-grid');
      }
      const wx = 40 + (state.x / state.size - start) * 640 / 48;
      arrow(f.svg, { x: wx, y: 43 }, { x: wx, y: 99 }, f.id); circle(f.svg, { x: wx, y: 106 }, 'diagram-point diagram-fill-accent');
      line(f.svg, { x: 253.333, y: 182 }, { x: 40, y: 218 }, 'diagram-dashed'); line(f.svg, { x: 466.666, y: 182 }, { x: 680, y: 218 }, 'diagram-dashed');
      for (let localX = 0; localX < 16; localX++) {
        add(f.svg, 'rect', { x: 40 + localX * 40, y: 222, width: 40, height: 47, class: localX === lx ? 'diagram-cell-active' : 'diagram-cell' });
        label(f.svg, 60 + localX * 40, 250, localX, localX === lx ? 'diagram-strong diagram-fill-accent' : 'diagram-label', 'middle');
      }
      label(f.svg, 40, 296, `Chunk-local X: ${lx}`, 'diagram-strong diagram-fill-accent'); label(f.svg, 680, 296, `Global cell X: ${c.x}`, 'diagram-muted-label', 'end');
      f.stat('point', tuple(p)); f.stat('cell', `(${c.x}, ${c.y}, ${c.z})`); f.stat('chunk', `(${cx}, ${cz})`); f.stat('local', `(${lx}, ${c.y}, ${lz})`); f.value('x', `${fmt(state.x)} blocks`); f.value('size', `${fmt(state.size, 1)} blocks`);
    }
    return controls(f, state, defaults, draw);
  }

  function ranges(host) {
    const defaults = { min: -0.5, max: 2 }, state = { ...defaults };
    const f = shell(host, { title: 'An exact maximum does not include the next cell', badge: 'AABB → half-open cell range', height: 320,
      stats: [['bounds', 'Geometric X bounds used for mapping'], ['range', 'Returned X cell range'], ['included', 'Included X cell indices'], ['point', 'Separate point lookup at maximum']],
      controls: (id) => range(id, 'min', 'Minimum X', -2, 0, 0.25, -0.5) + range(id, 'max', 'Maximum X', 0, 4, 0.25, 2),
      caption: 'This is the range-mapping rule, not a change to Ashcore AABB contact tests. worldAabbToCells excludes the geometric maximum. With unit cells and origin zero, the lower cell is floor(min) and the exclusive upper bound is ceil(max). A point lookup exactly at max is a separate query. Y and Z bounds are [0, 1) here; a collapsed X extent makes the whole cell range empty.' });
    function draw() {
      const low = Math.floor(state.min), empty = state.max <= state.min, high = empty ? low : Math.ceil(state.max), cells = Array.from({ length: high - low }, (_, i) => low + i), x = (v) => 45 + (v + 2) * 90;
      begin(f.svg, f.id, 'AABB range boundaries', `For range mapping, X is [${state.min},${state.max}). Returned cell range [${low},${high}), ${empty ? 'empty' : 'including cells ' + cells.join(', ')}. Separate point query at maximum maps X to ${Math.floor(state.max)}.`);
      label(f.svg, 45, 30, 'Geometric interval for range mapping', 'diagram-muted-label'); line(f.svg, { x: x(-2), y: 84 }, { x: x(5), y: 84 });
      for (let i = -2; i <= 5; i++) { line(f.svg, { x: x(i), y: 77 }, { x: x(i), y: 91 }); label(f.svg, x(i), 113, i, 'diagram-muted-label', 'middle'); }
      if (!empty) line(f.svg, { x: x(state.min), y: 69 }, { x: x(state.max), y: 69 }, 'diagram-interval');
      circle(f.svg, { x: x(state.min), y: 69 }, 'diagram-point diagram-fill-accent', 6); circle(f.svg, { x: x(state.max), y: 69 }, 'diagram-open-accent', 6);
      label(f.svg, x(state.min) - (empty ? 0 : 7), 52, empty ? 'min = max' : 'min', 'diagram-strong diagram-fill-accent', empty ? 'middle' : 'end');
      if (!empty) label(f.svg, x(state.max) + 7, 52, 'max', 'diagram-strong diagram-fill-accent');
      label(f.svg, 45, 156, 'Cells returned by worldAabbToCells', 'diagram-muted-label');
      for (let cell = -2; cell < 5; cell++) {
        const selected = cell >= low && cell < high;
        add(f.svg, 'rect', { x: x(cell), y: 176, width: 90, height: 64, class: selected ? 'diagram-cell-active' : 'diagram-cell' }); label(f.svg, x(cell) + 45, 214, cell, selected ? 'diagram-strong diagram-fill-accent' : 'diagram-label', 'middle');
      }
      const lookup = Math.floor(state.max);
      arrow(f.svg, { x: x(lookup) + 45, y: 278 }, { x: x(lookup) + 45, y: 249 }, f.id, 'warm'); label(f.svg, 45, 306, `worldToCell at X = max → cell ${lookup}`, 'diagram-strong diagram-fill-warm');
      f.stat('bounds', `[${fmt(state.min)}, ${fmt(state.max)})`); f.stat('range', `[${low}, ${high})${empty ? ' · empty' : ''}`); f.stat('included', empty ? 'No cells' : cells.join(', ')); f.stat('point', `floor(${fmt(state.max)}) = ${lookup}`); f.value('min', `${fmt(state.min)} blocks`); f.value('max', `${fmt(state.max)} blocks`);
    }
    return controls(f, state, defaults, draw);
  }

  function snapshots(host) {
    const defaults = { live: 4, frozen: 0 }, state = { ...defaults };
    const f = shell(host, { title: 'A snapshot keeps the frame definitions it copied', badge: 'live graph / frozen graph', height: 320,
      stats: [['live', 'Converter using the live graph'], ['frozen', 'Converter using the snapshot'], ['at', 'Snapshot captured at ship X'], ['effect', 'Effect of moving the ship']],
      singleControl: true,
      controls: (id) => range(id, 'live', 'Live ship world X', 0, 8, 0.1, 4), action: `<button type="button" class="${buttonClass}" data-capture>Capture new snapshot</button>`,
      caption: 'Both converters transform ship-local point (1, 0, 0) into world space. The live converter observes later frame definitions. A snapshot copies the current definitions and rejects mutations; moving the source graph does not update it. “Capture new snapshot” illustrates taking a new snapshot and using it for the frozen converter. A snapshot does not precompute world transforms.' });
    function draw() {
      begin(f.svg, f.id, 'Live graph and snapshot comparison', `Live ship X is ${state.live}, snapshot ship X is ${state.frozen}. Local point (1,0,0) maps to live world X ${state.live + 1} and snapshot world X ${state.frozen + 1}.`);
      const x = (v) => 64 + v * 62;
      [{ value: state.live, y: 105, name: 'Live graph', color: 'accent' }, { value: state.frozen, y: 222, name: 'Snapshot', color: 'warm' }].forEach((lane) => {
        label(f.svg, 34, lane.y - 61, lane.name, `diagram-strong diagram-fill-${lane.color}`); line(f.svg, { x: x(0), y: lane.y }, { x: x(10), y: lane.y });
        for (let i = 0; i <= 10; i++) { line(f.svg, { x: x(i), y: lane.y - 5 }, { x: x(i), y: lane.y + 6 }, 'diagram-grid'); label(f.svg, x(i), lane.y + 27, i, 'diagram-muted-label', 'middle'); }
        add(f.svg, 'rect', { x: x(lane.value), y: lane.y - 27, width: 124, height: 34, rx: 5, class: lane.color === 'accent' ? 'diagram-box' : 'diagram-box-warm' });
        circle(f.svg, { x: x(lane.value), y: lane.y }, `diagram-open-${lane.color}`); dot(f.svg, { x: x(lane.value + 1), y: lane.y }, '', lane.color); label(f.svg, x(lane.value + 1), lane.y - 35, `P · X = ${fmt(lane.value + 1, 1)}`, `diagram-label diagram-fill-${lane.color}`, 'middle');
      });
      label(f.svg, 34, 298, 'Open circle: ship origin', 'diagram-muted-label'); label(f.svg, 355, 298, 'Filled circle: point in world space', 'diagram-muted-label');
      f.stat('live', tuple({ x: state.live + 1, y: 0, z: 0 })); f.stat('frozen', tuple({ x: state.frozen + 1, y: 0, z: 0 })); f.stat('at', `${fmt(state.frozen, 1)} blocks`); f.stat('effect', state.live === state.frozen ? 'Both currently give the same result' : 'Only the live result follows the change'); f.value('live', `${fmt(state.live, 1)} blocks`);
    }
    f.on('[data-capture]', 'click', () => { state.frozen = state.live; draw(); });
    return controls(f, state, defaults, draw);
  }

  function geometry(host) {
    const defaults = { angle: 35, view: 'both' }, state = { ...defaults };
    const f = shell(host, { title: 'A rotated shape and its enclosing AABB', badge: 'XZ footprint · Y rotation',
      choices: segments('view', 'Visible box geometry', [['both', 'Compare'], ['obb', 'Oriented box'], ['aabb', 'Enclosing AABB']], 'both'),
      stats: [['obb', 'Oriented box XZ area'], ['aabb', 'Enclosing AABB XZ area'], ['bounds', 'Enclosing X and Z bounds'], ['ratio', 'Envelope / shape area']],
      singleControl: true,
      controls: (id) => range(id, 'angle', 'Y rotation', 0, 90, 1, 35, '°'),
      caption: 'The source AABB has side lengths (4, 1, 2), centered at the origin. orientedBox preserves the rotated box within coordinate rounding. axisAlignedBox transforms all eight corners, then encloses their coordinate minima and maxima. The amber area may contain empty space around the blue shape. A cell range derived from this envelope is conservative, so further shape checks may be needed.' });
    function draw() {
      const corners = [{ x: -2, y: 0, z: -1 }, { x: 2, y: 0, z: -1 }, { x: 2, y: 0, z: 1 }, { x: -2, y: 0, z: 1 }].map((p) => rotate(p, state.angle));
      const minX = Math.min(...corners.map((p) => p.x)), maxX = Math.max(...corners.map((p) => p.x)), minZ = Math.min(...corners.map((p) => p.z)), maxZ = Math.max(...corners.map((p) => p.z)), area = (maxX - minX) * (maxZ - minZ);
      begin(f.svg, f.id, 'Rotated box and conservative envelope', `A 4 by 2 XZ footprint rotates ${state.angle} degrees about Y. Oriented box area 8 square blocks. Enclosing AABB area ${fmt(area)} square blocks. X bounds ${fmt(minX)} to ${fmt(maxX)}, Z bounds ${fmt(minZ)} to ${fmt(maxZ)}.`);
      const project = (x, z) => ({ x: 360 + x * 49, y: 177 + z * 49 }); grid(f.svg, project, -6, 6, -3, 3);
      arrow(f.svg, project(-6, 0), project(6, 0), f.id, 'muted'); arrow(f.svg, project(0, -3), project(0, 3), f.id, 'muted'); label(f.svg, 666, 168, 'X', 'diagram-muted-label'); label(f.svg, 374, 327, 'Z', 'diagram-muted-label');
      if (state.view !== 'obb') { const p = project(minX, minZ); add(f.svg, 'rect', { x: p.x, y: p.y, width: (maxX - minX) * 49, height: (maxZ - minZ) * 49, class: 'diagram-envelope' }); }
      if (state.view !== 'aabb') polygon(f.svg, corners.map((p) => project(p.x, p.z)), 'diagram-shape');
      corners.forEach((p) => circle(f.svg, project(p.x, p.z), 'diagram-point diagram-fill-accent', 4));
      label(f.svg, 35, 342, 'Blue: rotated shape', 'diagram-label diagram-fill-accent'); label(f.svg, 390, 342, 'Amber: enclosing AABB', 'diagram-label diagram-fill-warm');
      f.stat('obb', '8.00 blocks²'); f.stat('aabb', `${fmt(area)} blocks²`); f.stat('bounds', `X [${fmt(minX)}, ${fmt(maxX)}] · Z [${fmt(minZ)}, ${fmt(maxZ)}]`); f.stat('ratio', `${fmt(area / 8)}×`); f.value('angle', `${state.angle}°`); f.choices(state);
    }
    return controls(f, state, defaults, draw);
  }

  const factories = { coordinates, composition, 'frame-chain': frameChain, grid: gridFigure, ranges, snapshots, geometry };
  function mount(root = document) {
    const hosts = Array.from(root.querySelectorAll('[data-diagram]'));
    if (root.matches && root.matches('[data-diagram]')) hosts.unshift(root);
    const cleanups = hosts.map((host) => {
      const previous = mounted.get(host); if (previous) previous();
      const create = factories[host.dataset.diagram]; if (!create) return () => {};
      const cleanup = create(host); mounted.set(host, cleanup);
      return () => { if (mounted.get(host) === cleanup) { cleanup(); mounted.delete(host); } };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }
  window.WikiDiagrams = Object.freeze({ mount });
})();
