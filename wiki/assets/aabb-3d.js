/* Bounded, local illustration of GeometryTransforms3 and worldAabbToCells.
   Eight rotated corners determine the enclosure; the SVG camera only changes
   the view. The browser illustrates the math without running the Java library. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  let sequence = 0;
  const axes = ['x', 'y', 'z'];
  const point = (x = 0, y = 0, z = 0) => ({x, y, z});
  const add = (a, b) => point(a.x+b.x, a.y+b.y, a.z+b.z);
  const sub = (a, b) => point(a.x-b.x, a.y-b.y, a.z-b.z);
  const scale = (a, n) => point(a.x*n, a.y*n, a.z*n);
  const dot = (a, b) => a.x*b.x+a.y*b.y+a.z*b.z;
  const cross = (a, b) => point(a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x);
  const unit = p => scale(p, 1/Math.hypot(p.x,p.y,p.z));
  const radians = degrees => degrees*Math.PI/180;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const fmt = n => (Math.abs(n)<.0005?0:n).toFixed(2);
  const tuple = p => `(${axes.map(axis=>fmt(p[axis])).join(', ')})`;
  const defaults = Object.freeze({x:20, y:35, z:10, view:'both', cells:false});
  const initialCamera = Object.freeze({yaw:38, pitch:28, distance:10.5});
  const faceIndices = [[0,2,3,1],[4,5,7,6],[0,4,6,2],[1,3,7,5],[2,6,7,3],[0,1,5,4]];
  const cornersOf = (min, max) => Array.from({length:8}, (_,mask)=>point(...axes.map((axis,i)=>((mask>>i)&1)?max[axis]:min[axis])));
  function normalized(q) {
    const largest = Math.max(...q.map(Math.abs)), scaled = q.map(n=>n/largest);
    const length = Math.sqrt(scaled.reduce((sum,n)=>sum+n*n,0));
    return scaled.map(n=>n/length);
  }
  function multiply([w,x,y,z], [bw,bx,by,bz]) {
    return [w*bw-x*bx-y*by-z*bz, w*bx+x*bw+y*bz-z*by, w*by-x*bz+y*bw+z*bx, w*bz+x*by-y*bx+z*bw];
  }
  function rotate(p, [w,x,y,z]) {
    const ix=w*p.x+y*p.z-z*p.y, iy=w*p.y+z*p.x-x*p.z, iz=w*p.z+x*p.y-y*p.x, iw=-x*p.x-y*p.y-z*p.z;
    return point(ix*w+iw*(-x)+iy*(-z)-iz*(-y), iy*w+iw*(-y)+iz*(-x)-ix*(-z), iz*w+iw*(-z)+ix*(-y)-iy*(-x));
  }
  // Match the unit-quaternion composition used by rx.then(ry).then(rz).
  function geometry(state) {
    const rotations = axes.map((axis,i)=>{
      const half=radians(state[axis])*.5;
      return normalized([Math.cos(half), ...axes.map((_,j)=>i===j?Math.sin(half):0)]);
    });
    const rotation=rotations.reduce((q,after)=>normalized(normalized(multiply(after,q))));
    const corners=cornersOf(point(-2,-.5,-1),point(2,.5,1)).map(p=>rotate(p,rotation));
    const min=point(...axes.map(axis=>Math.min(...corners.map(p=>p[axis]))));
    const max=point(...axes.map(axis=>Math.max(...corners.map(p=>p[axis]))));
    const dimensions=sub(max,min), volume=dimensions.x*dimensions.y*dimensions.z;
    const cellMin=point(...axes.map(axis=>Math.floor(min[axis]))), cellMax=point(...axes.map(axis=>Math.ceil(max[axis])));
    const cellDimensions=sub(cellMax,cellMin), cellCount=cellDimensions.x*cellDimensions.y*cellDimensions.z;
    return {corners,min,max,dimensions,volume,ratio:volume/8,cellMin,cellMax,cellDimensions,cellCount};
  }
  const buttonClass='cursor-pointer appearance-none rounded-md border border-line bg-transparent px-3 py-[7px] text-[11px] leading-[1.4] text-muted hover:bg-[var(--diagram-muted-surface)] hover:text-foreground';
  const segmentClass='cursor-pointer rounded border-0 bg-transparent px-3 py-1.5 text-xs font-[550] leading-[1.4] text-muted hover:text-foreground aria-pressed:bg-[var(--diagram-muted-surface)] aria-pressed:text-foreground aria-pressed:shadow-[0_1px_2px_#00000012]';
  function element(parent,tag,attrs={},text) {
    const node=document.createElementNS(NS,tag);
    for(const [key,value] of Object.entries(attrs)) node.setAttribute(key,value);
    if(text!==undefined) node.textContent=text;
    parent.appendChild(node); return node;
  }
  function mount(host) {
    const id=`aabb-3d-${++sequence}`, state={...defaults}, camera={...initialCamera};
    host.innerHTML=`<figure class="diagram-component aabb3d mx-0 my-[26px] overflow-hidden rounded-xl border border-line bg-surface font-sans text-[13px] leading-normal text-foreground print:break-inside-avoid" aria-label="Interactive 3D bounding box enclosure">
      <div class="diagram-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-line px-[18px] py-3.5 max-[620px]:p-3"><span class="text-xs font-semibold">A rotated box and its AABB</span><span class="text-[11px] text-muted">Interactive 3D · 1 unit = 1 block</span></div>
      <div class="flex flex-wrap items-center justify-between gap-3 px-[18px] py-3 max-[620px]:px-3"><div class="diagram-segmented inline-flex flex-wrap items-center rounded-[7px] border border-line bg-page p-[3px]" role="group" aria-label="Visible box geometry">${[['both','Compare'],['obb','Oriented box'],['aabb','Enclosing AABB']].map(([value,label])=>`<button type="button" class="${segmentClass}" data-view="${value}" aria-pressed="${state.view===value}">${label}</button>`).join('')}</div><button type="button" class="${buttonClass} aria-pressed:bg-[var(--diagram-muted-surface)] aria-pressed:text-foreground" data-cells aria-pressed="false">Candidate cells</button></div>
      <div class="aabb3d-viewport"><svg class="aabb3d-scene" tabindex="0" role="img" aria-label="Rotated box, axis-aligned enclosure and optional candidate cells in 3D. Drag to orbit; arrow keys rotate the camera; plus and minus zoom; Home restores the view." aria-describedby="${id}-camera-help"></svg><div class="aabb3d-key" aria-hidden="true"><span data-key="obb"><i class="aabb3d-key-box"></i>Oriented box</span><span data-key="aabb"><i class="aabb3d-key-envelope"></i>AABB</span><span data-key="cells" hidden><i class="aabb3d-key-cells"></i>Candidate cells</span></div></div>
      <div class="flex flex-wrap items-center justify-between gap-3 border-y border-line px-[18px] py-3 max-[620px]:px-3 print:hidden"><p class="m-0 text-[11px] text-muted" id="${id}-camera-help">Drag to orbit · scroll to zoom<br>Keyboard: arrows, + / −, Home</p><div class="flex flex-wrap gap-1.5" role="group" aria-label="Camera controls"><button type="button" class="${buttonClass}" data-camera="out" aria-label="Zoom out">−</button><button type="button" class="${buttonClass}" data-camera="in" aria-label="Zoom in">+</button><button type="button" class="${buttonClass}" data-camera="reset">Reset view</button></div></div>
      <div class="aabb3d-stats" aria-live="polite" aria-atomic="true"><div><span>Box volume · constant</span><output data-stat="box">8.00 blocks³</output></div><div><span>AABB volume</span><output data-stat="volume"></output></div><div><span>Enclosure / box</span><output data-stat="ratio"></output></div><div><span>Candidate cells · 1 block³ each</span><output data-stat="cells"></output></div></div>
      <div class="aabb3d-bounds"><div><span>AABB bounds · min → max</span><output data-bounds></output></div><div><span>Cell indices · max excluded</span><output data-range></output></div></div>
      <div class="grid grid-cols-3 items-start gap-5 px-5 pt-[19px] pb-4 max-[620px]:gap-3 max-[620px]:px-3.5 print:hidden">${axes.map(axis=>`<div class="diagram-control min-w-0"><div class="mb-[9px] flex flex-col items-start gap-1"><label class="text-xs text-foreground" for="${id}-${axis}">${axis.toUpperCase()} rotation</label><output class="font-mono text-[11px] text-muted tabular-nums" for="${id}-${axis}" data-value="${axis}"></output></div><input class="m-0 block h-[18px] w-full cursor-pointer p-0 accent-accent" type="range" id="${id}-${axis}" data-control="${axis}" min="-90" max="90" step="1" value="${state[axis]}"><div class="mt-[5px] flex justify-between text-[10px] text-muted" aria-hidden="true"><span>−90°</span><span>90°</span></div></div>`).join('')}</div>
      <div class="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 max-[620px]:px-3.5 print:hidden"><div class="flex flex-wrap gap-1.5" role="group" aria-label="Box rotation presets"><button type="button" class="${buttonClass}" data-pose="aligned">Align with axes</button><button type="button" class="${buttonClass}" data-pose="yaw45">Y = 45°</button></div><button type="button" class="diagram-reset ${buttonClass}" data-reset>Reset all</button></div>
      <figcaption class="diagram-caption px-5 pb-[18px] text-[11px] leading-[1.7] text-muted max-[620px]:px-3.5">The source box is 4 × 1 × 2 blocks, centered at (0, 0, 0). Rotations apply around the fixed X, then Y, then Z axes, using the right-hand rule. The amber AABB encloses all eight computed corners. Candidate cells cover its half-open range in a unit grid with zero origin; they are not confirmed collisions. Values are rounded for display; cell selection uses the computed bounds without an epsilon. Dragging changes only the camera.</figcaption>
    </figure>`;
    const figure=host.querySelector('figure'), svg=host.querySelector('.aabb3d-scene'), listeners=[];
    let size={width:720,height:410}, scheduled=0, disposed=false, drag=null;
    function on(target,event,handler,options) {
      target.addEventListener(event,handler,options);
      listeners.push(()=>target.removeEventListener(event,handler,options));
    }
    function schedule() {
      if(!scheduled&&!disposed) scheduled=requestAnimationFrame(()=>{scheduled=0;drawScene();});
    }
    function drawScene() {
      if(disposed) return;
      const result=geometry(state), style=getComputedStyle(figure), color=name=>style.getPropertyValue(name).trim();
      const colors={box:color('--accent'),envelope:color('--diagram-warm'),cells:color('--diagram-z'),grid:color('--diagram-grid'),bg:color('--diagram-plot'),text:color('--muted')};
      const yaw=radians(camera.yaw), pitch=radians(camera.pitch);
      const eye=point(camera.distance*Math.cos(pitch)*Math.sin(yaw),camera.distance*Math.sin(pitch),camera.distance*Math.cos(pitch)*Math.cos(yaw));
      const forward=unit(scale(eye,-1)), right=unit(cross(forward,point(0,1,0))), up=cross(right,forward), focal=Math.min(size.width*.94,size.height*1.2);
      function project(p) {
        const relative=sub(p,eye), depth=dot(relative,forward);
        return {x:size.width/2+dot(relative,right)*focal/depth,y:size.height*.49-dot(relative,up)*focal/depth,depth};
      }
      function path3(parent,points,attrs={}) {
        const projected=points.map(project);
        if(projected.some(p=>p.depth<.4)) return;
        return element(parent,'polyline',{points:projected.map(p=>`${p.x},${p.y}`).join(' '),fill:'none',...attrs});
      }
      svg.setAttribute('viewBox',`0 0 ${size.width} ${size.height}`);svg.replaceChildren();
      element(svg,'title',{},'Oriented box and axis-aligned enclosure in 3D');
      element(svg,'desc',{},`Rotation X ${state.x}, Y ${state.y}, Z ${state.z} degrees. Box volume 8 cubic blocks; AABB volume ${fmt(result.volume)}; ${result.cellCount} candidate cells. Bounds ${tuple(result.min)} to ${tuple(result.max)}. View ${state.view}; candidate grid ${state.cells?'shown':'hidden'}. Camera azimuth ${Math.round(camera.yaw)} degrees, elevation ${Math.round(camera.pitch)} degrees, distance ${fmt(camera.distance)} blocks.`);
      const ground=element(svg,'g',{stroke:colors.grid,'stroke-width':1});
      for(let i=-5;i<=5;i++) {path3(ground,[point(i,-3,-5),point(i,-3,5)]);path3(ground,[point(-5,-3,i),point(5,-3,i)]);}
      if(state.cells) {
        const grid=element(svg,'g',{'data-layer':'candidate-cells',stroke:colors.cells,'stroke-width':.8,opacity:.3});
        const lo=result.cellMin, hi=result.cellMax;
        for(const axis of axes) {
          const [a,b]=axes.filter(key=>key!==axis);
          for(let i=lo[a];i<=hi[a];i++) for(let j=lo[b];j<=hi[b];j++) {
            const start={[axis]:lo[axis],[a]:i,[b]:j},end={...start,[axis]:hi[axis]};
            path3(grid,[start,end]);
          }
        }
      }
      // Paint enclosing back faces, the solid OBB, then enclosing front faces.
      // The AABB contains the OBB, so this ordering also works with transparency.
      function faces(vertices) {
        return faceIndices.map(indices=>{
          const points=indices.map(i=>vertices[i]), normal=unit(cross(sub(points[1],points[0]),sub(points[2],points[0])));
          const projected=points.map(project);
          return {front:dot(normal,sub(eye,points[0]))>0,normal,projected,depth:projected.reduce((sum,p)=>sum+p.depth,0)/4};
        }).sort((a,b)=>b.depth-a.depth);
      }
      function paint(face,attrs) {
        if(face.projected.some(p=>p.depth<.4)) return;
        element(svg,'polygon',{points:face.projected.map(p=>`${p.x},${p.y}`).join(' '),'stroke-linejoin':'round',...attrs});
      }
      const enclosure=faces(cornersOf(result.min,result.max));
      if(state.view!=='obb') for(const face of enclosure.filter(f=>!f.front)) paint(face,{fill:colors.envelope,'fill-opacity':.035,stroke:colors.envelope,'stroke-opacity':.32,'stroke-width':1,'stroke-dasharray':'4 4'});
      if(state.view!=='aabb') for(const face of faces(result.corners).filter(f=>f.front)) {
        paint(face,{fill:colors.box,stroke:colors.box,'stroke-width':1.4});
        const shade=.12+.35*(1-Math.max(0,dot(face.normal,unit(point(-.3,1,.6)))));
        paint(face,{fill:'#000000','fill-opacity':shade,stroke:'none'});
      }
      if(state.view!=='obb') for(const face of enclosure.filter(f=>f.front)) paint(face,{fill:colors.envelope,'fill-opacity':.07,stroke:colors.envelope,'stroke-width':1.5,'stroke-opacity':.92});
      if(state.view!=='aabb') for(const corner of result.corners) {
        const p=project(corner);
        if(p.depth>.4) element(svg,'circle',{cx:p.x,cy:p.y,r:2.5,fill:colors.box,stroke:colors.bg,'stroke-width':1});
      }
      // A fixed-position orientation key follows the camera, not the box pose.
      const origin={x:36,y:45};
      for(const [axis,v] of [['x',point(1,0,0)],['y',point(0,1,0)],['z',point(0,0,1)]]) {
        const x=origin.x+dot(v,right)*23,y=origin.y-dot(v,up)*23,stroke=color(`--diagram-${axis}`);
        element(svg,'line',{x1:origin.x,y1:origin.y,x2:x,y2:y,stroke,'stroke-width':1.8});
        element(svg,'text',{x:x+(x<origin.x?-8:5),y:y+4,fill:stroke,'font-size':10,'font-family':'inherit'},axis.toUpperCase());
      }
    }
    function update() {
      const result=geometry(state);
      for(const input of host.querySelectorAll('[data-control]')) {
        const axis=input.dataset.control;input.value=state[axis];input.setAttribute('aria-valuetext',`${state[axis]} degrees`);
        host.querySelector(`[data-value="${axis}"]`).textContent=`${state[axis]}°`;
      }
      for(const button of host.querySelectorAll('[data-view]')) button.setAttribute('aria-pressed',String(button.dataset.view===state.view));
      host.querySelector('[data-cells]').setAttribute('aria-pressed',String(state.cells));
      host.querySelector('[data-key="cells"]').hidden=!state.cells;
      host.querySelector('[data-key="obb"]').hidden=state.view==='aabb';host.querySelector('[data-key="aabb"]').hidden=state.view==='obb';
      host.querySelector('[data-stat="volume"]').textContent=`${fmt(result.volume)} blocks³`;
      host.querySelector('[data-stat="ratio"]').textContent=`${fmt(result.ratio)}×`;
      host.querySelector('[data-stat="cells"]').textContent=`${result.cellCount} (${axes.map(a=>result.cellDimensions[a]).join(' × ')})`;
      host.querySelector('[data-bounds]').textContent=`${tuple(result.min)} → ${tuple(result.max)}`;
      host.querySelector('[data-range]').textContent=axes.map(a=>`${a.toUpperCase()} [${result.cellMin[a]}, ${result.cellMax[a]})`).join(' · ');
      schedule();
    }
    for(const input of host.querySelectorAll('[data-control]')) on(input,'input',()=>{state[input.dataset.control]=Number(input.value);update();});
    for(const button of host.querySelectorAll('[data-view]')) on(button,'click',()=>{state.view=button.dataset.view;update();});
    on(host.querySelector('[data-cells]'),'click',()=>{state.cells=!state.cells;update();});
    for(const button of host.querySelectorAll('[data-pose]')) on(button,'click',()=>{Object.assign(state,{x:0,y:button.dataset.pose==='yaw45'?45:0,z:0});update();});
    function cameraAction(action) {
      if(action==='reset') Object.assign(camera,initialCamera);
      else camera.distance=clamp(camera.distance*(action==='in'?.87:1.15),8,22);
      schedule();
    }
    for(const button of host.querySelectorAll('[data-camera]')) on(button,'click',()=>cameraAction(button.dataset.camera));
    on(host.querySelector('[data-reset]'),'click',()=>{Object.assign(state,defaults);Object.assign(camera,initialCamera);update();});
    on(svg,'pointerdown',event=>{
      if(event.button!==0||!event.isPrimary) return;
      svg.focus({preventScroll:true});drag={id:event.pointerId,x:event.clientX,y:event.clientY};svg.setPointerCapture(event.pointerId);svg.classList.add('is-dragging');
    });
    on(svg,'pointermove',event=>{
      if(!drag||drag.id!==event.pointerId) return;
      camera.yaw=(camera.yaw-(event.clientX-drag.x)*.45)%360;camera.pitch=clamp(camera.pitch+(event.clientY-drag.y)*.35,12,78);
      drag.x=event.clientX;drag.y=event.clientY;schedule();
    });
    function endDrag(event) {
      if(!drag||drag.id!==event.pointerId) return;
      drag=null;svg.classList.remove('is-dragging');if(svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    }
    on(svg,'pointerup',endDrag);on(svg,'pointercancel',endDrag);on(svg,'lostpointercapture',endDrag);
    on(svg,'wheel',event=>{
      if(event.ctrlKey) return;
      event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?size.height:1);
      camera.distance=clamp(camera.distance*Math.exp(clamp(delta,-150,150)*.002),8,22);schedule();
    },{passive:false});
    on(svg,'keydown',event=>{
      if(event.ctrlKey||event.metaKey||event.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key)) return;
      event.preventDefault();
      if(event.key==='ArrowLeft') camera.yaw-=8;if(event.key==='ArrowRight') camera.yaw+=8;
      if(event.key==='ArrowUp') camera.pitch=clamp(camera.pitch+6,12,78);if(event.key==='ArrowDown') camera.pitch=clamp(camera.pitch-6,12,78);
      if(event.key==='+'||event.key==='=') cameraAction('in');if(event.key==='-') cameraAction('out');if(event.key==='Home') cameraAction('reset');schedule();
    });
    const resize=new ResizeObserver(entries=>{const r=entries[0].contentRect;if(r.width>0&&r.height>0){size={width:r.width,height:r.height};schedule();}});resize.observe(svg);
    const theme=new MutationObserver(schedule);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    update();
    return ()=>{disposed=true;if(scheduled) cancelAnimationFrame(scheduled);if(drag&&svg.hasPointerCapture(drag.id)) svg.releasePointerCapture(drag.id);listeners.forEach(remove=>remove());resize.disconnect();theme.disconnect();};
  }
  window.WikiAabb3D=Object.freeze({mount,geometry});
})();
