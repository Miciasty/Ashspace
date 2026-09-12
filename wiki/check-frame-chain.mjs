// Numerical acceptance checks for the interactive model, independently of SVG.
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context=vm.createContext({window:{}});
vm.runInContext(await readFile(new URL('./assets/frame-chain-3d.js',import.meta.url),'utf8'),context);
const coordinates=context.window.WikiFrameChain3D.coordinates;
const near=(actual,expected)=>{
  for(const [index,axis] of ['x','y','z'].entries()) assert.ok(Math.abs(actual[axis]-expected[index])<1e-12,`${axis}: ${actual[axis]} != ${expected[index]}`);
};
// These are also asserted against the actual library in FrameChainExample.java.
for(const [state,world,seat] of [
  [{shipX:4,shipYaw:0,toolYaw:0},[7,1,0],[5,1,0]],
  [{shipX:8,shipYaw:90,toolYaw:0},[8,1,-3],[5,1,0]],
  [{shipX:8,shipYaw:90,toolYaw:90},[7,1,-2],[4,1,-1]],
  [{shipX:4,shipYaw:-90,toolYaw:-90},[3,1,2],[4,1,1]]
]) {
  const result=coordinates(state);
  near(result.world,world);near(result.seat,seat);near(result.tool,[1,0,0]);
}
let cases=0;
for(const toolYaw of [-135,-90,-45,0,45,90,135]) {
  const baseline=coordinates({shipX:0,shipYaw:0,toolYaw});
  for(const shipX of [0,4,8]) for(const shipYaw of [-180,-90,-25,0,25,90,180]) {
    const result=coordinates({shipX,shipYaw,toolYaw});
    near(result.seat,[baseline.seat.x,baseline.seat.y,baseline.seat.z]);
    near(result.ship,[baseline.ship.x,baseline.ship.y,baseline.ship.z]);
    near(result.tool,[1,0,0]);
    assert.ok(Math.abs(Math.hypot(result.ship.x-2,result.ship.y-1,result.ship.z)-1)<1e-12,'Rigid rotation must preserve the tool arm length.');
    assert.ok(Math.abs(Math.hypot(result.world.x-shipX,result.world.z)-Math.hypot(result.ship.x,result.ship.z))<1e-12,'Ship rotation must preserve horizontal distance from its origin.');
    cases++;
  }
}
console.log(`Checked 3D frame-chain coordinates: 4 reference poses and ${cases} relative-coordinate/length cases.`);
