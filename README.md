# Ashspace

Java library for coordinate frames, rigid transforms, and world/local-to-grid conversions, so a point on a moving object can be located in the world and in a voxel grid.

This checkout builds **2.0.0-SNAPSHOT**, an unpublished development version for the Blackframe contract revision 2.0 corrections. Publication status and local verification are recorded in [VERIFICATION.md](VERIFICATION.md).

> [!NOTE]
> Ashspace handles coordinate frames, rigid transforms, and world/local conversion rules.  
> Voxel storage/traversal belongs to Ashgrid, and pathfinding belongs to Ashnav.

## 1. Purpose

Ashspace defines coordinate frames and converts data between them without engine-specific dependencies. A frame gives a name to an origin and orientation: a tool at `(1, 0, 0)` on a ship moves in world space when that ship moves.

## 2. Problem

Plugins and engines often duplicate fragile conversion code:
- local object coordinates to world coordinates,
- world coordinates back to local frames,
- world points to voxel/cell indices with negative-coordinate edge cases.

When each system does this differently, bugs appear at boundaries and precision edges. Ashspace centralizes this logic behind deterministic contracts.

## 3. When to use

Use Ashspace when:
- you need deterministic frame-to-frame conversion in 3D,
- you need rigid transforms (rotation + translation, no scale),
- you need consistent floor-based mapping from world space to Ashgrid cells/chunks/chunk-local coordinates.

Do not use Ashspace when:
- you need scene graph runtime systems,
- you need rendering, meshing, or pathfinding pipelines,
- you need non-rigid transforms (scale/shear).

## 4. Simple example (Minecraft plugin example)

Minecraft plugin scenario:
1. A vehicle has its own local frame (`ship`).
2. Turrets and tools use child frames (`turret`, `drill`).
3. You convert hit rays from local tool space to world space.
4. You map world hit positions to Ashgrid cells with strict `floor` rules.

The caller supplies the ship pose and keeps it stable during the complete query. Ashspace does not detect a hit, simulate vehicle motion or decide whether a creature can walk through a cell.

## 5. How it works

1. `FrameGraph3` stores an acyclic parent chain of frames with `parentFromFrame` transforms.
2. `RigidTransform3` applies point/vector conversions and supports composition/inversion.
3. `SpaceConverter3` resolves transforms between any two connected frames and applies them to points and Ashcore geometry.
4. `GridSpaceMapper3` converts world/local points and AABBs to Ashgrid indices using explicit `cellSize`, `worldOrigin`, and a square XZ chunk size obtained from `ChunkScheme`.
5. Values returned by conversions are immutable. Frame-based conversions read the current graph each time and allocate intermediate values along the parent chains.

> [!NOTE]
> Local rotated AABBs are converted through world-space enclosing AABBs, so range results are conservative.
`FrameGraph3` is mutable and not thread-safe. A conservative range can contain cells that the actual rotated box never touches; it is not an exact shape test or a minimal cell set.

## 6. Big-O for operations

Definitions:
- `h`: frame depth from node to root; `hs` and `ht` are the source and target depths.
- `n`: number of defined frames. Hash-map lookups are assumed to take constant expected time.

| Operation | Complexity | Notes |
| --- | --- | --- |
| `RigidTransform3.transformPoint` / `transformVector` | `O(1)` | Fixed-size math. |
| `RigidTransform3.then` / `inverse` | `O(1)` | Fixed quaternion/vector operations. |
| `FrameGraph3.define` | `O(h)` | Parent-chain walk for cycle safety. |
| `FrameGraph3.transform(source, target)` | `O(hs + ht)` | Two root walks; identical existing frames take `O(1)`. |
| `FrameGraph3.frames()` | `O(n)` | Copies definitions in first-definition order; `O(n)` additional memory. |
| `SpaceConverter3.point/vector/ray/...` | `O(h)` | Includes frame transform lookup. |
| `GridSpaceMapper3.worldToCell/worldToChunk/worldToChunkLocal` | `O(1)` | Constant-time floor/index math. |
| `GridSpaceMapper3.worldAabbToCells` | `O(1)` | Fixed number of scalar ops. |
| `GridSpaceMapper3.worldAabbToChunks` | `O(1)` | Fixed number of scalar ops + chunk projection. |
| `GeometryTransforms3.axisAlignedBox` | `O(1)` | 8 transformed corners. |

Transform walks need `O(1)` live additional memory and create `O(hs + ht)` temporary values in total. Other fixed-size conversions use `O(1)` additional memory. There is no transform cache: doubling the chain depth roughly doubles the number of compositions per query. These are operation counts, not latency measurements or an allocation-free guarantee. No benchmark claim is made.

## 7. Core terms

- `frame`: named coordinate system node in a parent-linked graph.
- `root frame`: top frame with no parent (default `world`).
- `rigid transform`: rotation + translation, without scale.
- `parentFromFrame`: transform mapping child-frame coordinates into parent-frame coordinates.
- `floor mapping`: index conversion where each axis uses `floor` (e.g. `-0.2 -> -1`).
- `half-open range`: interval `[min, max)` where `max` is excluded.
- `chunk address`: pair `(chunkIndex, chunkLocal)` for a mapped cell.
- `space convention`: right-handed coordinates with `Y` as up axis.

## 8. Quick-start

Requires a JDK 21+ and Maven; verification uses Java release 21. The tested production dependencies are **Ashcore 1.0.1** and **Ashgrid 1.2.0**, resolved from Maven Central. JUnit 5.10.2 is test-only.

For this unpublished snapshot, build the checkout with `mvn -B clean verify`. To use its coordinates in another local Maven project, run `mvn -B install` after verification. This installs the snapshot locally; it does not publish it.

Maven:

```xml
<dependency>
  <groupId>dev.nasaka.blackframe</groupId>
  <artifactId>ashspace</artifactId>
  <version>2.0.0-SNAPSHOT</version>
</dependency>
```

Minimal usage example:

```java
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
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
    }
}
```

> [!NOTE]
> `SquareXZChunkScheme` is currently provided by Ashgrid under `implementation` and is the standard chunk scheme for XZ chunk layouts.

The ship rotates 90 degrees about Y, then moves to `(10, 0, -4)` in world units. Ashcore's axis-angle method takes **radians**. The grid has half-unit cells: this is a mapping parameter, not scale applied to the ship. Chunk size `16` means 16 cells along X and Z, or 8 world units with this cell size. Chunk-local Y remains the global cell Y.

## 9. Coordinates, state and numerical limits

Coordinates are right-handed with Y up. `parentFromFrame` converts child coordinates into parent coordinates. `a.then(b)` applies `a` first, then `b`. A point is rotated and translated; a vector or direction is only rotated, retaining its length within rounding. No scale or shear is supported.

`RigidTransform3` uses Ashcore's quaternion normalization. Zero rotation components retain the earlier identity convention. A nonzero quaternion is accepted only when its computed squared norm is finite and at least `Double.MIN_NORMAL`; extreme magnitudes are rejected rather than silently producing a different rotation. The normalized squared norm must be within an absolute, dimensionless `1e-12` of one. Points, vectors, translations and results must be finite; invalid values or arithmetic overflow raise `IllegalArgumentException` (null object arguments raise `NullPointerException`). A transformed ray requires a valid finite Ashcore ray with nonzero unit direction. Its parameter remains distance in the same world units, within rounding, because a rigid transform preserves length.

Cell lookup evaluates `floor((world - worldOrigin) / cellSize)` with ordinary rounded double subtraction and division, matching `VoxelSpace` for finite, representable cell indices. With unit cells at zero, `-0.2` maps to `-1`. No epsilon moves a point across a cell boundary. Even a mathematically exact decimal boundary can round to one side: membership is defined by the computed quotient.

The mapper supports only zero-based square XZ chunks, using floor division of integer cell indices. It captures the supplied scheme's positive `chunkSize()` at construction. All mapping routes use this one size; custom point, range, bounds and neighborhood methods on the scheme are not consulted. Changing the scheme later does not change that captured size. Shifted, rotated or irregular chunk layouts require another adapter. `worldOrigin` is the grid origin in world units, not a separate chunk offset.

`cellSize` may be any positive finite double, including subnormal values. Inputs and intermediate/output coordinates must be finite; all point-mapping routes require all three floored cell coordinates to fit a signed 32-bit `int`. Tiny sizes can overflow the division, and subtraction can overflow for opposite large coordinates. Those cases are rejected. Underflow and other finite rounding can still erase information.

AABB mapping treats the normalized maximum as excluded and returns half-open integer ranges. This differs from geometric contact tests that include the box boundary. Zero extent in any axis makes a cell range empty; chunk ranges use only XZ and ignore Y extent. Ashcore's AABB constructor orders reversed endpoints before the mapper receives them. The exclusive maximum must fit `int`, so a cell range cannot include cell `Integer.MAX_VALUE`, although point lookup can return that cell. Chunk ranges can include it only if their exclusive chunk maximum fits. Each returned range dimension is also limited to `Integer.MAX_VALUE`, so Ashgrid 1.2.0 dimension and empty checks cannot overflow. Bound the total cell count with checked arithmetic and caller-owned limits before allocation or iteration.

Finite values alone do not guarantee useful spatial resolution. For example, at world origin X = `2^54` with unit cells, the centers of cells 0 and 1 round to the same point. Subtracting the origin later cannot recover the lost bit. Use origins near the work area, and choose cell sizes large enough to remain distinguishable. No arbitrary-large-world or universal center round-trip guarantee is made.

Tests cover center round trips for sizes `0.1`, `0.3`, `0.5`, `1`, `2`, origins `(0,0,0)` and `(10,-7,-4)`, and representative signed indices from `Integer.MIN_VALUE` to `Integer.MAX_VALUE`. Exact integer results are asserted without tolerance. Transform examples at moderate magnitudes use absolute coordinate tolerances from `1e-12` to `1e-9`; these are test tolerances, not global error bounds. Large translations and long composition chains can require a different error budget.

Keep the frame graph unchanged throughout the entire logical query, including conversion, tracing and any later grid lookup that must describe the same pose. Synchronization is the caller's responsibility and must include writers. `SpaceConverter3` retains the live graph. `frame()`, `frames()` and returned transforms are immutable snapshots and remain unchanged after updates. Redefinition changes subsequent queries; reparenting keeps children attached and interprets the supplied pose relative to the new parent, without preserving the old world pose. Failed definitions leave the graph unchanged. Every referenced frame must exist, even for conversion to itself.

Repeatability requires equal numeric inputs, frame definitions, configuration, dependency versions and a stable graph during queries. Snapshot iteration follows first-definition order; updating a frame preserves its position. Arithmetic results do not depend on the order in which an otherwise identical valid graph was defined. The guarantee covers repeated queries in the same runtime environment. Bitwise agreement across operating systems/JDKs or library releases is not promised; this change was tested on the environment recorded in [VERIFICATION.md](VERIFICATION.md).

## 10. Supported API and migration

The supported surface includes public types and members under `nsk.nu.ashspace.api` and the existing public `implementation.grid.ChunkLocalIndexer`. No public type, constructor or method has been removed or moved. Public signatures expose Ashcore/Ashgrid types, so upgrading dependencies also needs integration testing. The dependency versions above are the tested baseline, not a claim that every later version is compatible. Ashgrid's `SquareXZChunkScheme` remains owned by Ashgrid.

Version **2.0.0-SNAPSHOT** reserves a major version for the stricter behavior: decimal-boundary mapping now uses division; chunk queries use the same int-cell contract as cell/address queries and ignore custom scheme methods; invalid extreme rotations and non-finite transform results fail; unknown-to-itself frame conversion fails. Ordinary standard XZ usage keeps the same source and binary signatures. Consumers relying on the earlier acceptance or rounding behavior must migrate before adopting a release. Existing `1.0.0` artifacts must not be replaced with this code.

Ashtrace and Ashnav consumers should test the corrected boundary examples, confirm their chunk layout is standard XZ, handle the explicit validation failures and keep a single stable frame configuration for each query. No consumer or lower-layer checkout is changed by this correction. There are no guaranteed serialized formats or cross-release bitwise result streams.

## 11. Verification and publication

Run `mvn -B clean verify` with tests enabled. The build compiles with a pinned compiler plugin and `release=21`, fails on Javadoc errors, packages main/sources/Javadoc JARs, checks the required contents and compiles/runs the Java quick start against the packaged JAR and its two production dependencies. Ashspace has no SPI providers to register. CI runs this gate for pushes on all branches (including the confirmed default `main`) and all pull requests, then uploads the three exact artifact filenames without renaming the main JAR.

The `publish.yml` workflow targets **GitHub Packages**, after verification and a `v<version>` tag/POM match check. Manual runs must select a release tag, and snapshots are rejected. A GitHub Release is the trigger, not evidence that JAR assets were attached to that release; release assets are not currently uploaded by this workflow. The optional `central` profile remains the separate signing/Maven Central publishing route (`mvn -B -Pcentral deploy` with the owner's configured credentials). That is a publication command and must not be used as a verification check.

No publication command was run for these corrections. This snapshot has no release tag or published artifact. GitHub Packages delivery and the manual Central route require release-owner verification before the next release; the local profile alone does not prove publication. Record the destination, version, tag/commit, date and workflow/repository evidence in [VERIFICATION.md](VERIFICATION.md). Never reuse an existing release tag/version for different contents.

## License

Apache-2.0 Copyright 2025 Mateusz Aftanas
