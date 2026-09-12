// Analytical reference poses and geometric invariants, independent of rendering.
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context=vm.createContext({window:{}});
vm.runInContext(await readFile(new URL('./assets/aabb-3d.js',import.meta.url),'utf8'),context);
const geometry=context.window.WikiAabb3D.geometry;
const axes=['x','y','z'], near=(a,b)=>assert.ok(Math.abs(a-b)<1e-11,`${a} != ${b}`);
const aligned=geometry({x:0,y:0,z:0});
near(aligned.volume,8);assert.equal(aligned.cellCount,16);
const turned=geometry({x:0,y:45,z:0});
near(turned.dimensions.x,3*Math.SQRT2);near(turned.dimensions.y,1);near(turned.dimensions.z,3*Math.SQRT2);
near(turned.volume,18);near(turned.ratio,2.25);assert.equal(turned.cellCount,72);
// The article asserts these same two half-open ranges with the Java library.
assert.deepEqual(axes.flatMap(a=>[turned.cellMin[a],turned.cellMax[a]]),[-3,3,-1,1,-3,3]);
assert.deepEqual(axes.flatMap(a=>[aligned.cellMin[a],aligned.cellMax[a]]),[-2,2,-1,1,-1,1]);
let cases=0;
for(const x of [-90,-43,0,20,90]) for(const y of [-90,-21,0,35,45,90]) for(const z of [-90,-17,0,10,90]) {
  const result=geometry({x,y,z});
  // Independent Euler matrix Rz * Ry * Rx: row magnitudes give AABB half extents.
  const [sx,sy,sz]=[x,y,z].map(a=>Math.sin(a*Math.PI/180)), [cx,cy,cz]=[x,y,z].map(a=>Math.cos(a*Math.PI/180));
  const matrix=[[cz*cy,cz*sy*sx-sz*cx,cz*sy*cx+sz*sx],[sz*cy,sz*sy*sx+cz*cx,sz*sy*cx-cz*sx],[-sy,cy*sx,cy*cx]];
  axes.forEach((axis,i)=>{
    const half=matrix[i].reduce((sum,n,j)=>sum+Math.abs(n)*[2,.5,1][j],0);
    near(result.min[axis],-half);near(result.max[axis],half);
    assert.ok(result.cellMin[axis]<=result.min[axis]&&result.cellMax[axis]>=result.max[axis]);
  });
  for(const [index,p] of result.corners.entries()) {
    for(const axis of axes) assert.ok(p[axis]>=result.min[axis]&&p[axis]<=result.max[axis],'Every computed corner must be enclosed.');
    for(let bit=0;bit<3;bit++) {
      const other=result.corners[index^(1<<bit)];
      near(Math.hypot(...axes.map(a=>p[a]-other[a])),[4,1,2][bit]);
    }
  }
  assert.ok(result.volume>=8-1e-11,'Enclosure cannot be smaller than the rigid box.');
  assert.ok(result.cellCount>=result.volume-1e-11,'Unit candidate cells cover the AABB.');
  cases++;
}
console.log(`Checked 3D AABB: 2 reference poses and ${cases} enclosure, rotation-order, edge-length and cell-coverage cases.`);
