# Ashspace

Low-level deterministic Java library for coordinate frames, rigid transforms, and world/local-to-grid conversions.

## 1. Purpose

Ashspace gives you a stable way to define coordinate frames and convert data between them without hidden state or engine lock-in.

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

Ashspace keeps those conversions deterministic and consistent for the same inputs.

## 5. How it works

1. `FrameGraph3` stores an acyclic parent chain of frames with `parentFromFrame` transforms.
2. `RigidTransform3` applies point/vector conversions and supports composition/inversion.
3. `SpaceConverter3` resolves transforms between any two connected frames and applies them to points and Ashcore geometry.
4. `GridSpaceMapper3` converts world/local points and AABBs to Ashgrid cell/chunk/chunk-local indices using explicit `cellSize`, `worldOrigin`, and `ChunkScheme`.
5. All conversions are deterministic and allocation-light value operations.

Note: local rotated AABBs are converted through world-space enclosing AABBs, so range results are conservative.
`FrameGraph3` is mutable and not thread-safe.

## 6. Big-O for operations

Definitions:
- `h`: frame depth from node to root.

| Operation | Complexity | Notes |
| --- | --- | --- |
| `RigidTransform3.transformPoint` / `transformVector` | `O(1)` | Fixed-size math. |
| `RigidTransform3.then` / `inverse` | `O(1)` | Fixed quaternion/vector operations. |
| `FrameGraph3.define` | `O(h)` | Parent-chain walk for cycle safety. |
| `FrameGraph3.transform(source, target)` | `O(h)` | Two root walks (source + target). |
| `SpaceConverter3.point/vector/ray/...` | `O(h)` | Includes frame transform lookup. |
| `GridSpaceMapper3.worldToCell/worldToChunk/worldToChunkLocal` | `O(1)` | Constant-time floor/index math. |
| `GridSpaceMapper3.worldAabbToCells` | `O(1)` | Fixed number of scalar ops. |
| `GridSpaceMapper3.worldAabbToChunks` | `O(1)` | Fixed number of scalar ops + chunk projection. |
| `GeometryTransforms3.axisAlignedBox` | `O(1)` | 8 transformed corners. |

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

Requires Java 21+.

Maven:

```xml
<dependency>
  <groupId>dev.nasaka.blackframe</groupId>
  <artifactId>ashspace</artifactId>
  <version>1.0.0</version>
</dependency>
```

Minimal runnable example:

```xml
<!-- Optional explicit pin if you want to control versions directly -->
<dependency>
  <groupId>dev.nasaka.blackframe</groupId>
  <artifactId>ashgrid</artifactId>
  <version>1.2.0</version>
</dependency>
```

```java
import nsk.nu.ashcore.api.math.Vector3;
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
        frames.define(ship, world, RigidTransform3.translation(10, 0, -4));

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

`SquareXZChunkScheme` is currently provided by Ashgrid under `implementation` and is the standard chunk scheme for XZ chunk layouts.

## License

Apache-2.0 Copyright 2025 Mateusz Aftanas
