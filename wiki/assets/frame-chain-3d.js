/* A local, dependency-free 3D illustration of FrameGraph3. Cuboid faces are
   projected through an orbit camera and depth-sorted into SVG. No Java runtime,
   Minecraft objects, network requests or continuous animation are involved. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  let sequence = 0;
  const radians = degrees => degrees * Math.PI / 180;
  const point = (x = 0, y = 0, z = 0) => ({x, y, z});
  const add = (a, b) => point(a.x + b.x, a.y + b.y, a.z + b.z);
  const sub = (a, b) => point(a.x - b.x, a.y - b.y, a.z - b.z);
  const scale = (a, n) => point(a.x * n, a.y * n, a.z * n);
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const cross = (a, b) => point(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  const unit = a => scale(a, 1 / Math.hypot(a.x, a.y, a.z));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const fmt = value => (Math.abs(value) < 0.0005 ? 0 : value).toFixed(2);
  const tuple = p => `(${fmt(p.x)}, ${fmt(p.y)}, ${fmt(p.z)})`;
  const rotate = (p, angle) => {
    const c = Math.cos(radians(angle)), s = Math.sin(radians(angle));
    return point(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  };
  const defaults = Object.freeze({shipX: 4, shipYaw: 0, toolYaw: 0, frame: 'seat', axes: true});
  const initialCamera = Object.freeze({yaw: 42, pitch: 32, distance: 17});
  const toolPoint = Object.freeze(point(1, 0, 0));
  const origins = {world: point(), ship: point(), seat: point(-2, 0, 0), tool: point(2, 1, 0)};

  function toWorld(p, frame, state) {
    if (frame === 'world') return p;
    const inShip = frame === 'tool' ? add(rotate(p, state.toolYaw), origins.tool)
      : frame === 'seat' ? add(p, origins.seat) : p;
    return add(rotate(inShip, state.shipYaw), point(state.shipX, 0, 0));
  }
  // Direct relative conversion deliberately excludes the common ship pose.
  function coordinates(state) {
    const ship = add(rotate(toolPoint, state.toolYaw), origins.tool);
    return {tool: {...toolPoint}, ship, seat: sub(ship, origins.seat), world: toWorld(ship, 'ship', state)};
  }
  const routes = {
    world: {nodes: ['tool', 'ship', 'world'], ancestor: 'world'},
    ship: {nodes: ['tool', 'ship'], ancestor: 'ship'},
    seat: {nodes: ['tool', 'ship', 'seat'], ancestor: 'ship'},
    tool: {nodes: ['tool'], ancestor: 'tool'}
  };
  const buttonClass = 'cursor-pointer appearance-none rounded-md border border-line bg-transparent px-3 py-[7px] text-[11px] leading-[1.4] text-muted hover:bg-[var(--diagram-muted-surface)] hover:text-foreground';
  const segmentClass = 'cursor-pointer rounded border-0 bg-transparent px-3 py-1.5 text-xs font-[550] leading-[1.4] text-muted hover:text-foreground aria-pressed:bg-[var(--diagram-muted-surface)] aria-pressed:text-foreground aria-pressed:shadow-[0_1px_2px_#00000012]';
  function slider(id, key, label, min, max, suffix) {
    return `<div class="diagram-control min-w-0"><div class="mb-[9px] flex flex-col items-start gap-1"><label class="text-xs text-foreground" for="${id}-${key}">${label}</label><output class="font-mono text-[11px] text-muted tabular-nums" for="${id}-${key}" data-value="${key}"></output></div><input class="m-0 block h-[18px] w-full cursor-pointer p-0 accent-accent" type="range" id="${id}-${key}" data-control="${key}" min="${min}" max="${max}" step="1" value="${defaults[key]}"><div class="mt-[5px] flex justify-between text-[10px] text-muted" aria-hidden="true"><span>${min}${suffix}</span><span>${max}${suffix}</span></div></div>`;
  }
  function element(parent, tag, attrs = {}, text) {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function mount(host) {
    const id = `frame-chain-3d-${++sequence}`;
    const state = {...defaults}, camera = {...initialCamera};
    host.innerHTML = `<figure class="diagram-component frame3d mx-0 my-[26px] overflow-hidden rounded-xl border border-line bg-surface font-sans text-[13px] leading-normal text-foreground print:break-inside-avoid" aria-label="Interactive 3D frame hierarchy">
      <div class="diagram-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-line px-[18px] py-3.5 max-[620px]:p-3"><span class="text-xs font-semibold">One point, four coordinate frames</span><span class="text-[11px] text-muted">Interactive 3D · 1 unit = 1 block</span></div>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-[18px] py-3 max-[620px]:px-3"><span class="text-[11px] text-muted">Read point in</span><div class="diagram-segmented inline-flex flex-wrap items-center rounded-[7px] border border-line bg-page p-[3px]" role="group" aria-label="Point coordinate frame">${['world', 'ship', 'seat', 'tool'].map(frame => `<button type="button" class="${segmentClass}" data-frame="${frame}" aria-pressed="${frame === state.frame}">${frame}</button>`).join('')}</div></div>
      <div class="frame3d-layout">
        <div class="frame3d-viewport">
          <svg class="frame3d-scene" tabindex="0" role="img" aria-label="3D ship with a seat, tool and point P. Drag to orbit. Arrow keys rotate the camera; plus and minus zoom; Home restores the view." aria-describedby="${id}-camera-help"></svg>
          <div class="frame3d-scene-key" aria-hidden="true"><span><i class="frame3d-point-key"></i> Point P</span><span><i class="frame3d-axis-x"></i>X</span><span><i class="frame3d-axis-y"></i>Y</span><span><i class="frame3d-axis-z"></i>Z</span></div>
        </div>
        <aside class="frame3d-hierarchy" aria-label="Conversion path"><div><p class="frame3d-kicker">FRAME HIERARCHY</p><svg class="frame3d-tree" viewBox="0 0 150 205" role="img" aria-label="world is parent of ship; ship is parent of seat and tool."></svg></div><div class="frame3d-path-info"><p class="frame3d-kicker">COMPOSED PATH</p><output class="frame3d-path" data-path></output><p class="frame3d-kicker">COMMON ANCESTOR</p><output class="frame3d-ancestor" data-ancestor></output><p class="frame3d-edge-help" data-edge-help></p></div></aside>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-[18px] py-3 max-[620px]:px-3 print:hidden"><p class="m-0 text-[11px] text-muted" id="${id}-camera-help">Drag to orbit · scroll to zoom<br>Keyboard: arrows, + / −, Home</p><div class="flex flex-wrap gap-1.5" role="group" aria-label="Camera controls"><button type="button" class="${buttonClass}" data-camera="out" aria-label="Zoom out">−</button><button type="button" class="${buttonClass}" data-camera="in" aria-label="Zoom in">+</button><button type="button" class="${buttonClass}" data-camera="reset">Reset view</button><button type="button" class="${buttonClass} aria-pressed:bg-[var(--diagram-muted-surface)] aria-pressed:text-foreground" data-axes aria-pressed="true">Axes</button></div></div>
      <div class="frame3d-readout border-y border-line px-5 py-4 max-[620px]:px-3.5" aria-live="polite" aria-atomic="true"><div><span class="block text-[11px] text-muted" data-result-label></span><output class="frame3d-result" data-result></output><code class="frame3d-call" data-call></code></div><div><span class="block text-[11px] text-muted">Same point in world</span><output class="frame3d-world" data-world></output><span class="block text-[11px] leading-relaxed text-muted">Fixed input in tool: (1, 0, 0)</span></div></div>
      <div class="grid grid-cols-3 items-start gap-5 px-5 pt-[19px] pb-4 max-[620px]:grid-cols-2 max-[620px]:gap-[18px] max-[620px]:px-3.5 print:hidden">${slider(id, 'shipX', 'Ship world X', 0, 8, '')}${slider(id, 'shipYaw', 'Ship Y rotation', -180, 180, '°')}${slider(id, 'toolYaw', 'Tool Y rotation', -135, 135, '°')}</div>
      <div class="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 max-[620px]:px-3.5"><p class="m-0 max-w-[460px] text-[11px] leading-relaxed text-muted" data-explanation></p><button type="button" class="diagram-reset ${buttonClass} print:hidden" data-reset>Reset all</button></div>
      <figcaption class="diagram-caption px-5 pb-[18px] text-[11px] leading-[1.7] text-muted max-[620px]:px-3.5">The seat origin is (−2, 0, 0) in ship space. The tool origin is (2, 1, 0); P is (1, 0, 0) in tool space. Both rotations use +Y and the right-hand rule. The fixed world grid lies at Y = −1. The camera stays centered on the scene so ship movement remains visible. The block models illustrate frame poses; Ashspace supplies coordinate math, not these meshes. Axes and the dashed point vector remain visible over objects.</figcaption>
    </figure>`;
    const figure = host.querySelector('figure'), svg = host.querySelector('.frame3d-scene');
    const tree = host.querySelector('.frame3d-tree');
    const listeners = [];
    let scheduled = 0, disposed = false, drag = null, size = {width: 550, height: 410};
    function on(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      listeners.push(() => target.removeEventListener(event, handler, options));
    }
    function schedule() {
      if (!scheduled && !disposed) scheduled = requestAnimationFrame(() => { scheduled = 0; drawScene(); });
    }
    function palette() {
      const style = getComputedStyle(figure);
      const light = document.documentElement.dataset.theme === 'light';
      return {bg: style.getPropertyValue('--diagram-plot').trim(), grid: style.getPropertyValue('--diagram-grid').trim(),
        text: style.getPropertyValue('--text').trim(), muted: style.getPropertyValue('--muted').trim(), accent: style.getPropertyValue('--accent').trim(),
        x: style.getPropertyValue('--diagram-x').trim(), y: style.getPropertyValue('--diagram-y').trim(), z: style.getPropertyValue('--diagram-z').trim(),
        deck: light ? '#c5a77c' : '#83694b', hull: light ? '#a98b69' : '#4c5666', rim: light ? '#566c83' : '#38485c',
        seat: light ? '#55a687' : '#477a6c', tool: light ? '#669ebc' : '#4d7f9f', metal: light ? '#8b9bab' : '#75899b',
        line: light ? '#3f5261' : '#192632', warm: light ? '#99630d' : '#ffcd75'};
    }
    function projection() {
      const yaw = radians(camera.yaw), pitch = radians(camera.pitch), target = point(4, 0, 0);
      const eye = add(target, point(camera.distance * Math.cos(pitch) * Math.sin(yaw), camera.distance * Math.sin(pitch), camera.distance * Math.cos(pitch) * Math.cos(yaw)));
      const forward = unit(sub(target, eye)), right = unit(cross(forward, point(0, 1, 0))), up = cross(right, forward);
      const focal = Math.min(size.width * .95, size.height * 1.38);
      return {eye, project(p) {
        const relative = sub(p, eye), depth = dot(relative, forward);
        return {x: size.width / 2 + dot(relative, right) * focal / depth, y: size.height * 0.53 - dot(relative, up) * focal / depth, depth};
      }};
    }
    function drawScene() {
      if (disposed) return;
      const colors = palette(), {eye, project} = projection(), values = coordinates(state);
      svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
      svg.replaceChildren();
      element(svg, 'title', {}, 'Ship, seat and tool coordinate frames in 3D');
      element(svg, 'desc', {}, `P in ${state.frame}: ${tuple(values[state.frame])}. In world: ${tuple(values.world)}. Ship X ${state.shipX}, ship Y rotation ${state.shipYaw} degrees, tool Y rotation ${state.toolYaw} degrees. Camera azimuth ${Math.round(camera.yaw)} degrees, elevation ${Math.round(camera.pitch)} degrees and distance ${fmt(camera.distance)} blocks.`);
      const gridLayer = element(svg, 'g', {'stroke': colors.grid, 'stroke-width': 1});
      function path3(parent, points, attrs) {
        const projected = points.map(project);
        if (projected.some(p => p.depth < 0.4)) return;
        return element(parent, 'polyline', {points: projected.map(p => `${p.x},${p.y}`).join(' '), fill: 'none', ...attrs});
      }
      for (let x = -8; x <= 16; x++) path3(gridLayer, [point(x, -1, -10), point(x, -1, 10)]);
      for (let z = -10; z <= 10; z++) path3(gridLayer, [point(-8, -1, z), point(16, -1, z)]);
      // A ship-aligned shadow helps separate its deck from the fixed world grid.
      const shadow = [[-3.7,-1.6],[3.7,-1.6],[4.3,0],[3.7,1.6],[-3.7,1.6]].map(([x,z]) => toWorld(point(x,-0.97,z),'ship',state));
      const projectedShadow = shadow.map(project);
      if (projectedShadow.every(p => p.depth > 0.4)) element(svg,'polygon',{points:projectedShadow.map(p=>`${p.x},${p.y}`).join(' '),fill:colors.line,opacity:.18});
      const faces = [];
      function box(frame, min, dimensions, color) {
        const [x,y,z] = min, [w,h,d] = dimensions;
        const vertices = [[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]].map(v => toWorld(point(...v),frame,state));
        const indices = [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]];
        for (const face of indices) {
          const corners = face.map(i=>vertices[i]), normal = unit(cross(sub(corners[1],corners[0]),sub(corners[2],corners[0])));
          if (dot(normal,sub(eye,corners[0])) <= 0) continue;
          const projected = corners.map(project);
          if (projected.some(p=>p.depth < .4)) continue;
          const brightness = .64 + .36 * Math.max(0,dot(normal,unit(point(-.3,1,.6))));
          const channels = color.slice(1).match(/../g).map(c=>Math.round(parseInt(c,16)*brightness));
          faces.push({points:projected.map(p=>`${p.x},${p.y}`).join(' '),depth:projected.reduce((sum,p)=>sum+p.depth,0)/4,fill:`rgb(${channels.join(' ')})`});
        }
      }
      box('ship',[-3,-.85,-1],[6,.5,2],colors.hull);
      for (let x=-3; x<=3; x++) for (let z=-1; z<=1; z++) box('ship',[x-.49,-.35,z-.49],[.98,.35,.98],colors.deck);
      box('ship',[3.5,-.35,-.5],[.65,.35,1],colors.deck);
      box('ship',[-3.55,0,-1.55],[7.1,.18,.15],colors.rim);
      box('ship',[-3.55,0,1.4],[7.1,.18,.15],colors.rim);
      box('ship',[-3.55,0,-1.4],[.15,.18,2.8],colors.rim);
      box('seat',[-.48,0,-.48],[.96,.23,.96],colors.metal);
      box('seat',[-.4,.23,-.4],[.8,.22,.8],colors.seat);
      box('seat',[-.5,.23,-.45],[.2,.85,.9],colors.seat);
      box('ship',[1.72,0,-.28],[.56,.8,.56],colors.metal);
      box('tool',[-.4,-.2,-.4],[.8,.4,.8],colors.tool);
      box('tool',[0,-.11,-.11],[1,.22,.22],colors.metal);
      faces.sort((a,b)=>b.depth-a.depth);
      const solids = element(svg,'g',{'stroke':colors.line,'stroke-width':.7,'stroke-linejoin':'round'});
      for (const face of faces) element(solids,'polygon',{points:face.points,fill:face.fill});

      // Annotation vectors are intentionally drawn over the solid scene.
      function arrow3(a,b,color,width=1.4,dashed=false) {
        const pa=project(a),pb=project(b);
        if (pa.depth < .4 || pb.depth < .4) return;
        element(svg,'line',{x1:pa.x,y1:pa.y,x2:pb.x,y2:pb.y,stroke:color,'stroke-width':width,...(dashed?{'stroke-dasharray':'4 4'}:{})});
        const angle=Math.atan2(pb.y-pa.y,pb.x-pa.x),len=5;
        element(svg,'path',{d:`M${pb.x-len*Math.cos(angle-.5)},${pb.y-len*Math.sin(angle-.5)} L${pb.x},${pb.y} L${pb.x-len*Math.cos(angle+.5)},${pb.y-len*Math.sin(angle+.5)}`,fill:'none',stroke:color,'stroke-width':width});
      }
      const textStyle = {'font-family':'inherit','font-size':11,'font-weight':550,'paint-order':'stroke',stroke:colors.bg,'stroke-width':3,'stroke-linejoin':'round'};
      const labels=[];
      for (const frame of ['world','ship','seat','tool']) {
        const origin=toWorld(point(),frame,state), p=project(origin);
        if(p.depth < .4) continue;
        const selected=frame===state.frame;
        if(state.axes) {
          const length=selected ? 1.45 : .9;
          for(const [axis,endpoint] of [['x',point(length,0,0)],['y',point(0,length,0)],['z',point(0,0,length)]]) arrow3(origin,toWorld(endpoint,frame,state),colors[axis],selected?2:1.2);
        }
        element(svg,'circle',{cx:p.x,cy:p.y,r:selected?4:2.6,fill:selected?colors.accent:colors.text,stroke:colors.bg,'stroke-width':1.5});
        labels.push({frame,p,selected});
      }
      arrow3(toWorld(point(),state.frame,state),values.world,colors.warm,1.5,true);
      for(const {frame,p,selected} of labels) {
        const offset=frame==='tool' ? -15 : 19;
        element(svg,'text',{x:clamp(p.x+7,8,size.width-45),y:clamp(p.y+offset,16,size.height-15),fill:selected?colors.accent:colors.text,...textStyle},frame);
      }
      const p=project(values.world);
      if(p.depth>.4) {
        element(svg,'circle',{cx:p.x,cy:p.y,r:11,fill:colors.warm,opacity:.16});
        element(svg,'circle',{cx:p.x,cy:p.y,r:5,fill:colors.warm,stroke:colors.bg,'stroke-width':2});
        element(svg,'text',{x:clamp(p.x+10,8,size.width-22),y:clamp(p.y-12,16,size.height-15),fill:colors.warm,...textStyle,'font-size':13},'P');
      }
    }
    function drawTree() {
      const route=routes[state.frame], positions={world:[75,23],ship:[75,88],seat:[35,169],tool:[115,169]};
      tree.replaceChildren();
      element(tree,'title',{},`Conversion: ${route.nodes.join(' to ')}. Common ancestor: ${route.ancestor}.`);
      for(const [child,parent] of [['ship','world'],['seat','ship'],['tool','ship']]) {
        const active=route.nodes.includes(child)&&route.nodes.includes(parent);
        const [x1,y1]=positions[child], [x2,y2]=positions[parent];
        element(tree,'line',{x1,y1:y1-16,x2,y2:y2+16,class:active?'frame3d-tree-edge active':'frame3d-tree-edge'});
        if(active) {
          const up=child!=='seat', from=up?[x1,y1-18]:[x2,y2+18],to=up?[x2,y2+18]:[x1,y1-18];
          const mx=(from[0]+to[0])/2,my=(from[1]+to[1])/2,a=Math.atan2(to[1]-from[1],to[0]-from[0]);
          element(tree,'path',{d:`M${mx-5*Math.cos(a-.5)},${my-5*Math.sin(a-.5)} L${mx},${my} L${mx-5*Math.cos(a+.5)},${my-5*Math.sin(a+.5)}`,class:'frame3d-tree-arrow'});
        }
      }
      for(const [frame,[x,y]] of Object.entries(positions)) {
        const group=element(tree,'g');
        element(group,'rect',{x:x-30,y:y-16,width:60,height:32,rx:6,class:route.nodes.includes(frame)?'frame3d-tree-node active':'frame3d-tree-node'});
        element(group,'text',{x,y:y+4,'text-anchor':'middle',class:'frame3d-tree-label'},frame);
        if(frame==='tool'||frame===state.frame) element(group,'text',{x,y:y+31,'text-anchor':'middle',class:'frame3d-tree-role'},frame==='tool'?(state.frame==='tool'?'source = target':'source'):'target');
      }
      host.querySelector('[data-path]').textContent=route.nodes.join(' → ');
      host.querySelector('[data-ancestor]').textContent=route.ancestor;
      host.querySelector('[data-edge-help]').textContent=state.frame==='seat'?'Up to ship, then inverse into seat.':state.frame==='tool'?'Same frame: identity transform.':'Follow parent transforms upward.';
    }
    function update() {
      const values=coordinates(state);
      for(const input of host.querySelectorAll('[data-control]')) {
        const key=input.dataset.control, value=state[key]+(key==='shipX'?' blocks':'°');
        input.value=state[key]; input.setAttribute('aria-valuetext',value);
        host.querySelector(`[data-value="${key}"]`).textContent=value;
      }
      for(const button of host.querySelectorAll('[data-frame]')) button.setAttribute('aria-pressed',String(button.dataset.frame===state.frame));
      host.querySelector('[data-axes]').setAttribute('aria-pressed',String(state.axes));
      host.querySelector('[data-result-label]').textContent=`Point P in ${state.frame} coordinates`;
      host.querySelector('[data-result]').textContent=tuple(values[state.frame]);
      host.querySelector('[data-world]').textContent=tuple(values.world);
      host.querySelector('[data-call]').textContent=`frames.transform(tool, ${state.frame})`;
      host.querySelector('[data-explanation]').textContent=state.frame==='world'?'World coordinates follow both the ship pose and the tool rotation.':state.frame==='tool'?'P stays at (1, 0, 0) in its own tool frame, through every pose change.':'Move or rotate the ship: the relative result stays fixed. Rotate the tool: the relative result changes.';
      drawTree(); schedule();
    }
    for(const input of host.querySelectorAll('[data-control]')) on(input,'input',()=>{state[input.dataset.control]=Number(input.value);update();});
    for(const button of host.querySelectorAll('[data-frame]')) on(button,'click',()=>{state.frame=button.dataset.frame;update();});
    on(host.querySelector('[data-axes]'),'click',()=>{state.axes=!state.axes;update();});
    function cameraAction(action) {
      if(action==='reset') Object.assign(camera,initialCamera);
      else camera.distance=clamp(camera.distance*(action==='in'?.87:1.15),12,30);
      schedule();
    }
    for(const button of host.querySelectorAll('[data-camera]')) on(button,'click',()=>cameraAction(button.dataset.camera));
    on(host.querySelector('[data-reset]'),'click',()=>{Object.assign(state,defaults);Object.assign(camera,initialCamera);update();});
    on(svg,'pointerdown',event=>{
      if(event.button!==0||!event.isPrimary) return;
      svg.focus({preventScroll:true}); drag={id:event.pointerId,x:event.clientX,y:event.clientY};
      svg.setPointerCapture(event.pointerId); svg.classList.add('is-dragging');
    });
    on(svg,'pointermove',event=>{
      if(!drag||drag.id!==event.pointerId) return;
      camera.yaw=(camera.yaw-(event.clientX-drag.x)*.45)%360;
      camera.pitch=clamp(camera.pitch+(event.clientY-drag.y)*.35,12,78);
      drag.x=event.clientX; drag.y=event.clientY; schedule();
    });
    function endDrag(event) {
      if(!drag||drag.id!==event.pointerId) return;
      drag=null; svg.classList.remove('is-dragging');
      if(svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    }
    on(svg,'pointerup',endDrag); on(svg,'pointercancel',endDrag); on(svg,'lostpointercapture',endDrag);
    on(svg,'wheel',event=>{
      // Preserve browser pinch zoom, and handle ordinary wheel motion in the scene.
      if(event.ctrlKey) return;
      event.preventDefault();
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?size.height:1);
      camera.distance=clamp(camera.distance*Math.exp(clamp(delta,-150,150)*.002),12,30);schedule();
    },{passive:false});
    on(svg,'keydown',event=>{
      if(event.ctrlKey||event.metaKey||event.altKey) return;
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key)) return;
      event.preventDefault();
      if(event.key==='ArrowLeft') camera.yaw-=8;
      if(event.key==='ArrowRight') camera.yaw+=8;
      if(event.key==='ArrowUp') camera.pitch=clamp(camera.pitch+6,12,78);
      if(event.key==='ArrowDown') camera.pitch=clamp(camera.pitch-6,12,78);
      if(event.key==='+'||event.key==='=') cameraAction('in');
      if(event.key==='-') cameraAction('out');
      if(event.key==='Home') cameraAction('reset');
      schedule();
    });
    const resize=new ResizeObserver(entries=>{
      const rect=entries[0].contentRect;
      if(rect.width>0&&rect.height>0) {size={width:rect.width,height:rect.height};schedule();}
    });
    resize.observe(svg);
    const theme=new MutationObserver(schedule);
    theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    update();
    return ()=>{
      disposed=true; if(scheduled) cancelAnimationFrame(scheduled);
      if(drag&&svg.hasPointerCapture(drag.id)) svg.releasePointerCapture(drag.id);
      listeners.forEach(remove=>remove());resize.disconnect();theme.disconnect();
    };
  }
  window.WikiFrameChain3D=Object.freeze({mount,coordinates});
})();
