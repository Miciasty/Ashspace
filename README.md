# Ashspace

Java library for coordinate frames, rigid transforms, and world/local-to-grid conversions, so a point on a moving object can be located in the world and in a voxel grid.

Version **2.0.0** is available from [Maven Central](https://central.sonatype.com/artifact/dev.nasaka.blackframe/ashspace/2.0.0).

> [!NOTE]
> Ashspace handles coordinate frames, rigid transforms, and world/local conversion rules.  
> Voxel storage/traversal belongs to Ashgrid, and pathfinding belongs to Ashnav.

## When to use it

Use Ashspace when:

- you need deterministic frame-to-frame conversion in 3D,
- you need rigid transforms (rotation + translation, no scale),
- you need consistent floor-based mapping from world space to Ashgrid cells/chunks/chunk-local coordinates.

Do not use Ashspace when:

- you need scene graph runtime systems,
- you need rendering, meshing, or pathfinding pipelines,
- you need non-rigid transforms (scale/shear).

## Example: tools on a moving ship

A frame gives a name to an origin and orientation: a tool at `(1, 0, 0)` on a ship
moves in world space when that ship moves.

1. A vehicle has its own local frame (`ship`).
2. Turrets and tools use child frames (`turret`, `drill`).
3. You convert hit rays from local tool space to world space.
4. You map world hit positions to Ashgrid cells with strict `floor` rules.

The caller supplies the ship pose and keeps it stable during the complete query. Ashspace does not detect a hit, simulate vehicle motion or decide whether a creature can walk through a cell.

## Requirements and quick start

Use JDK 21 or newer. Add this dependency to your Maven project:

```xml
<dependency>
  <groupId>dev.nasaka.blackframe</groupId>
  <artifactId>ashspace</artifactId>
  <version>2.0.0</version>
</dependency>
```

Maven downloads Ashspace and its transitive dependencies, Ashcore 1.2.0 and Ashgrid 1.3.0,
from Maven Central. No additional repository configuration or local dependency installation is required.

To build Ashspace from source, use Maven 3.9+ and run `mvn -B clean verify` in this checkout.

Save the following as `AshspaceQuickStart.java` in a consumer project using that dependency:

```java
import nsk.nu.ashcore.api.collision.CollisionTests;
import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.geometry.Capsule;
import nsk.nu.ashcore.api.geometry.OrientedBox;
import nsk.nu.ashcore.api.geometry.Sphere;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.geometry.GeometryTransforms3;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.grid.FrameGridSpaceMapper3;
import nsk.nu.ashspace.api.space.SpaceConverter3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

public final class AshspaceQuickStart {
    public static void main(String[] args) {
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId world = frames.root();
        FrameId ship = new FrameId("ship");
        frames.define(ship, world, new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2.0),
                new Vector3(10, 0, -4)
        ));

        SpaceConverter3 converter = new SpaceConverter3(frames);
        Vector3 worldPoint = converter.toWorldPoint(ship, new Vector3(0.9, -0.1, 0.9));

        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                0.5,
                Vector3.ZERO,
                new SquareXZChunkScheme(16)
        );
        System.out.println("world=" + worldPoint);
        System.out.println("cell=" + mapper.worldToCell(worldPoint));
        System.out.println("chunkAddress=" + mapper.worldToChunkAddress(worldPoint));

        Capsule tool = new Capsule(Vector3.ZERO, new Vector3(0, 2, 0), 0.5);
        System.out.println("toolRadius=" + converter.capsule(tool, ship, world).radius());
        AxisAlignedBox localBox = new AxisAlignedBox(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        OrientedBox worldBox = converter.orientedBox(localBox, ship, world);
        System.out.println("localHalfExtents=" + converter.orientedBox(worldBox, world, ship).halfExtents());

        RigidTransform3 turn = new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4), Vector3.ZERO);
        OrientedBox rotatedShape = GeometryTransforms3.orientedBox(turn, localBox);
        AxisAlignedBox enclosure = GeometryTransforms3.axisAlignedBox(turn, localBox);
        Vector3 probe = new Vector3(1.3, 0, 1.3);
        System.out.println("insideEnclosure=" + enclosure.contains(probe));
        System.out.println("insideShape=" + CollisionTests.sphereVsOrientedBox(new Sphere(probe, 0), rotatedShape));

        FrameGraph3 queryFrames = frames.snapshot();
        FrameGridSpaceMapper3 shipGrid = new FrameGridSpaceMapper3(
                queryFrames, ship, 0.5, Vector3.ZERO, new SquareXZChunkScheme(16)
        );
        CellIndex3 shipCell = new CellIndex3(1, 0, 1);
        Vector3 shipCellInWorld = shipGrid.cellCenter(shipCell);
        System.out.println("shipCell=" + shipGrid.worldToCell(shipCellInWorld));
        frames.remove(ship);
        System.out.println("snapshotShipCell=" + shipGrid.worldToCell(shipCellInWorld));
    }
}
```

> [!NOTE]
> `SquareXZChunkScheme` is currently provided by Ashgrid under `implementation` and is the standard chunk scheme for XZ chunk layouts.

The ship rotates 90 degrees about Y, then moves to `(10, 0, -4)` in world units. Ashcore's axis-angle method takes **radians**. The grid has half-unit cells: this is a mapping parameter, not scale applied to the ship. Chunk size `16` means 16 cells along X and Z, or 8 world units with this cell size. Chunk-local Y remains the global cell Y.

The first mapper describes a world-aligned grid. `shipGrid` describes the ship's own cells: a world point is converted into the ship frame before indexing. Its `gridOrigin` and `cellSize` are measured in that frame. `cellCenter(cell)` returns a world point; `cellCenter(cell, targetFrame)` returns it in another frame. Likewise, `localToCell(sourceFrame, point)` converts directly between the source and grid frames. This avoids unnecessary world-coordinate rounding for tools on the same vehicle.

The example uses one graph snapshot for a complete query. Removing the ship from the live graph afterward leaves that snapshot usable; both `shipCell` lines print `CellIndex3[x=1, y=0, z=1]`. A mapper constructed with the live graph observes later motion and rejects queries referencing a removed frame. `shipGrid.snapshot()` freezes that frame-attached mapper's frame state. Grid storage belongs to Ashgrid and is not copied by either snapshot operation.

The tool capsule keeps radius `0.5`, and converting the box to the world and back keeps half extents `(1, 1, 1)`. For the separate 45-degree cube, `(1.3, 0, 1.3)` is inside its enclosing AABB but outside the rotated shape: the last geometry checks print `true` and `false`. The zero-radius sphere is Ashcore's point-contact query; Ashspace supplies only the conversion.

## How it works

1. `FrameGraph3` stores an acyclic parent chain of frames with `parentFromFrame` transforms. It supports leaf/subtree removal and queryable frozen snapshots.
2. `RigidTransform3` applies point/vector conversions and supports composition/inversion.
3. `SpaceConverter3` resolves transforms between any two connected frames and applies them to points and Ashcore geometry.
4. `GridSpaceMapper3` converts world/local points and AABBs to Ashgrid indices using explicit `cellSize`, `worldOrigin`, and a square XZ chunk size obtained from `ChunkScheme`.
   `FrameGridSpaceMapper3` attaches a grid to a frame, so its origin and axes move with that frame.
5. Values returned by conversions are immutable. Frame-based conversions read the current graph each time and allocate intermediate values along the parent chains.

> [!NOTE]
> Rotated AABBs are enclosed in the destination grid frame before range mapping, so range results are conservative.

New `FrameGraph3` instances are mutable and not thread-safe. A graph returned by `snapshot()` is frozen and supports concurrent reads after safe publication. A conservative range can contain cells that the actual rotated box never touches; it is not an exact shape test or a minimal cell set.

## Operation costs

Definitions:

- `h`: frame depth from node to root; `hs` and `ht` are the source and target depths.
- `d`: number of edges from both frames to their nearest common ancestor.
- `n`: number of defined frames. Hash-map lookups are assumed to take constant expected time.

| Operation | Complexity | Notes |
| --- | --- | --- |
| `RigidTransform3.transformPoint` / `transformVector` | `O(1)` | Fixed-size math. |
| `RigidTransform3.then` / `inverse` | `O(1)` | Fixed quaternion/vector operations. |
| `FrameGraph3.define` | `O(h)` | Parent-chain walk for cycle safety. |
| `FrameGraph3.transform(source, target)` | `O(hs + ht)` | Inspects parent links; composes only the `d` edges below the common ancestor. Identical existing frames take `O(1)`. |
| `FrameGraph3.frames()` | `O(n)` | Copies definitions in first-definition order; `O(n)` additional memory. |
| `FrameGraph3.snapshot()` | `O(n)` | Copies definitions into a frozen graph; `O(n)` additional memory. On a snapshot, returns itself in `O(1)`. |
| `FrameGraph3.remove(frame)` | `O(n)` | Checks that the frame is a non-root leaf; `O(1)` additional memory. |
| `FrameGraph3.removeSubtree(frame)` | `O(n)` | Builds child lists and removes descendants iteratively; `O(n)` additional memory. |
| `SpaceConverter3.point/vector/ray/...` | `O(h)` | Includes frame transform lookup. |
| `GridSpaceMapper3.worldToCell/worldToChunk/worldToChunkLocal` | `O(1)` | Constant-time floor/index math. |
| `GridSpaceMapper3.worldAabbToCells` | `O(1)` | Fixed number of scalar ops. |
| `GridSpaceMapper3.worldAabbToChunks` | `O(1)` | Fixed number of scalar ops + chunk projection. |
| `FrameGridSpaceMapper3` point/center/range conversion | `O(hs + ht)` | One frame conversion plus fixed-size mapping; `O(1)` live additional memory. |
| `GeometryTransforms3.axisAlignedBox` | `O(1)` | 8 transformed corners. |
| `GeometryTransforms3.capsule/orientedBox` | `O(1)` | Fixed-size coordinate/orientation math; `O(1)` additional memory, with allocation. |

Transform walks need `O(1)` live additional memory and create `O(d)` temporary transform values plus constant overhead. `rootFrom` composes all `h` parent edges. There is no transform cache: deeper chains require more parent-link inspection, while nearby frames under a deep common ancestor still need only their relative edges composed. These are operation counts, not latency measurements or an allocation-free guarantee. No benchmark claim is made.

## Coordinates, state and numerical limits

Coordinates are right-handed with Y up. `parentFromFrame` converts child coordinates into parent coordinates. `a.then(b)` applies `a` first, then `b`. A point is rotated and translated; a vector or direction is only rotated, retaining its length within rounding. No scale or shear is supported.

`RigidTransform3` uses Ashcore's quaternion normalization. Zero rotation components retain the earlier identity convention. A nonzero quaternion is accepted only when its computed squared norm is finite and at least `Double.MIN_NORMAL`; extreme magnitudes are rejected rather than silently producing a different rotation. The normalized squared norm must be within an absolute, dimensionless `1e-12` of one. Points, vectors, translations and results must be finite; invalid values or arithmetic overflow raise `IllegalArgumentException` (null object arguments raise `NullPointerException`). A transformed ray requires a valid finite Ashcore ray with nonzero unit direction. Its parameter remains distance in the same world units, within rounding, because a rigid transform preserves length.

`GeometryTransforms3.capsule` transforms both endpoints and copies the radius exactly. `orientedBox(transform, aabb)` returns the rotated shape as an Ashcore OBB; `orientedBox(transform, obb)` moves its center, applies the existing box orientation first and the transform rotation second, and copies half extents exactly. `SpaceConverter3` provides the same three conversions with source/target frame arguments. Each obtains one relative transform and follows the same live/snapshot rules as point conversion. Geometry conversion does not freeze storage or a tracing index.

Capsule radii and OBB half extents must be finite and non-negative, as enforced by Ashcore constructors. Equal capsule endpoints represent a sphere; zero radius represents a segment or point. Zero box extents represent a rectangle, segment or point. OBB orientation must be a finite nonzero quaternion and is normalized by Ashcore; unlike `RigidTransform3`, a zero OBB orientation is invalid. AABB conversion rejects non-finite bounds, and all conversions reject non-finite transformed coordinates. Coordinates, radii and half extents use compatible position units; there is no scale or shear.

Shape preservation describes the rigid model within double rounding. Converting AABB bounds into a center and half extents can lose small dimensions; for example, half of `Double.MIN_VALUE` rounds to zero. Large translations can make distinct capsule endpoints or surface points indistinguishable. The AABB adapter avoids overflow of a full side length when its half remains representable, but this does not promise that subsequent Ashcore collision queries support the same extreme bounds. Existing `axisAlignedBox` still encloses its eight computed corners, and grid range mapping still uses that conservative enclosure. The new surface/round-trip tests use `1e-12` absolute coordinate tolerance for moderate coordinates (tens of units), with exact assertions for copied radii and half extents; this is test evidence, not a universal geometric error bound.

Cell lookup evaluates `floor((world - worldOrigin) / cellSize)` with rounded double subtraction and division, matching `VoxelSpace` for finite, representable cell indices. If a nonzero quotient underflows to signed zero, the mapper preserves its side of the boundary for floor/ceil selection: a negative offset remains in cell -1 and a positive offset in cell 0. The same rule applies to half-open range endpoints. With unit cells at zero, `-0.2` maps to `-1`. No epsilon moves an ordinary point across a cell boundary. Even a mathematically exact decimal boundary can round to one side.

Both mappers support only zero-based square XZ chunks within the grid's coordinate frame, using floor division of integer cell indices. They capture the supplied scheme's positive `chunkSize()` at construction. All mapping routes use this one size; custom point, range, bounds and neighborhood methods on the scheme are not consulted. Changing the scheme later does not change that captured size. `GridSpaceMapper3.worldOrigin` locates the grid in world units; `FrameGridSpaceMapper3.gridOrigin` locates it in grid-frame units. The attached frame can translate and rotate the entire grid, including its chunks. Irregular chunks or an independent chunk layout within the grid are outside this model.

`cellSize` may be any positive finite double, including subnormal values. Inputs and intermediate/output coordinates must be finite; all point-mapping routes require all three floored cell coordinates to fit a signed 32-bit `int`. Tiny sizes can overflow the division, and subtraction can overflow for opposite large coordinates. Those cases are rejected. Preserving an underflowed quotient's sign does not restore lost distance precision or distinguish all extents collapsed by rounding.

AABB mapping treats the normalized maximum as excluded and returns half-open integer ranges. This differs from geometric contact tests that include the box boundary. Zero extent in any axis makes a cell range empty; chunk ranges use only XZ and ignore Y extent. Ashcore's AABB constructor rejects reversed endpoints before the mapper receives them. The exclusive maximum must fit `int`, so a cell range cannot include cell `Integer.MAX_VALUE`, although point lookup can return that cell. Chunk ranges can include it only if their exclusive chunk maximum fits. Each returned range dimension is also limited to `Integer.MAX_VALUE`. Bound the total cell count with checked arithmetic and caller-owned limits before allocation or iteration.

Finite values alone do not guarantee useful spatial resolution. For example, at world origin X = `2^54` with unit cells, the centers of cells 0 and 1 round to the same point. Subtracting the origin later cannot recover the lost bit. Use origins near the work area, and choose cell sizes large enough to remain distinguishable. No arbitrary-large-world or universal center round-trip guarantee is made.

Tests cover center round trips for sizes `0.1`, `0.3`, `0.5`, `1`, `2`, origins `(0,0,0)` and `(10,-7,-4)`, and representative signed indices from `Integer.MIN_VALUE` to `Integer.MAX_VALUE`. Exact integer results are asserted without tolerance. Transform examples at moderate magnitudes use absolute coordinate tolerances from `1e-12` to `1e-9`; these are test tolerances, not global error bounds. Large translations and long composition chains can require a different error budget.

For a mutable graph, keep it unchanged throughout the entire logical query, including conversion, tracing and any later grid lookup that must describe the same pose. Synchronization is the caller's responsibility and must include writers. Alternatively, obtain `FrameGraph3 snapshot = frames.snapshot()` while the source is stable and pass that same frozen graph to every adapter involved. Snapshot creation copies definitions without computing world transforms. Subsequent reads need no graph locking after safe publication; all graph mutations on a snapshot throw `UnsupportedOperationException`. Taking a snapshot of a snapshot returns the same instance.

`SpaceConverter3` and both grid mappers accept the frozen graph through their existing `FrameGraph3` parameters. `frame()`, `frames()` and returned transforms also remain unchanged after live updates. Redefinition changes later live queries; reparenting keeps children attached and interprets the supplied pose relative to the new parent, without preserving the old world pose. `remove(id)` removes only a non-root leaf and rejects a frame with children. `removeSubtree(id)` removes that frame and its current descendants and returns their count. Both reject the root, unknown ids and null. Rejected operations leave state unchanged. Surviving frames retain their order; defining a removed id appends a new definition at the end. Every frame referenced by a conversion must exist, even for conversion to itself.

Relative transformations find the nearest common ancestor and compose only the edges below it. For example, tool frames one unit apart remain one unit apart even when their shared ship has world translation `2^54`. This also permits relative queries when the shared ancestor's accumulated world pose would overflow. `rootFrom` and actual world conversions still have the earlier numerical limits, and lost precision in an already computed world point cannot be recovered.

Repeatability requires equal numeric inputs, frame definitions, configuration, dependency versions and a stable graph during queries. Snapshot iteration follows first-definition order; updating a frame preserves its position. Arithmetic results do not depend on the order in which an otherwise identical valid graph was defined. The guarantee covers repeated queries in the same runtime environment. Bitwise agreement across operating systems/JDKs or library releases is not promised.

## Supported API and migration

The supported surface includes public types and members under `nsk.nu.ashspace.api` and the existing public `implementation.grid.ChunkLocalIndexer`. No public type, constructor or method has been removed or moved. Public signatures expose Ashcore/Ashgrid types, so upgrading dependencies also needs integration testing. The dependency versions above are the tested baseline, not a claim that every later version is compatible. Ashgrid's `SquareXZChunkScheme` remains owned by Ashgrid.

Version **2.0.0** uses a major version for the stricter behavior: decimal-boundary mapping now uses division; chunk queries use the same int-cell contract as cell/address queries and ignore custom scheme methods; invalid extreme rotations and non-finite transform results fail; unknown-to-itself frame conversion fails. Ordinary standard XZ usage keeps the same source and binary signatures. Consumers relying on the earlier acceptance or rounding behavior must account for these changes when upgrading from 1.0.0.

Frame removal, frozen graphs and the frame-attached mapper are additive APIs in 2.0.0. Common-ancestor composition preserves transform direction and order but can change floating-point rounding relative to the previous root-based calculation. No existing constructor, method or return type was changed. Snapshot mutability is explicit through `isSnapshot()`; snapshot instances reject `define`, `remove` and `removeSubtree`.

Capsule and OBB conversions are additive APIs in `2.0.0`. They require Ashcore `1.2.0`, which owns `OrientedBox`; do not force an older Ashcore onto the runtime classpath. No existing method or conservative mapping behavior changes.

Ashtrace and Ashnav consumers should test the corrected boundary examples, confirm their chunk layout is standard XZ, handle the explicit validation failures and keep a single stable frame configuration for each query. There are no guaranteed serialized formats or cross-release bitwise result streams.

## Glossary

- `frame`: named coordinate system node in a parent-linked graph.
- `root frame`: top frame with no parent (default `world`).
- `rigid transform`: rotation + translation, without scale.
- `parentFromFrame`: transform mapping child-frame coordinates into parent-frame coordinates.
- `floor mapping`: index conversion where each axis uses `floor` (e.g. `-0.2 -> -1`).
- `half-open range`: interval `[min, max)` where `max` is excluded.
- `chunk address`: pair `(chunkIndex, chunkLocal)` for a mapped cell.
- `space convention`: right-handed coordinates with `Y` as up axis.
- `capsule`: a segment thickened by a radius, with spherical ends.
- `oriented box` (OBB): a box described by its center, half side lengths and orientation; its axes can rotate.
- `axis-aligned box` (AABB): a box whose sides follow the current coordinate axes; enclosing a rotated shape can add space.

## License

Apache License 2.0. See [LICENSE](LICENSE).
