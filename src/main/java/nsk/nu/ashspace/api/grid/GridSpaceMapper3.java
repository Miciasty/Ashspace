package nsk.nu.ashspace.api.grid;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.bounds.IntBox3;
import nsk.nu.ashgrid.api.grid.bounds.IntRect2;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.api.grid.indexing.ChunkIndex2;
import nsk.nu.ashgrid.api.grid.indexing.ChunkLocal3;
import nsk.nu.ashgrid.api.grid.indexing.ChunkScheme;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.geometry.GeometryTransforms3;
import nsk.nu.ashspace.implementation.grid.ChunkLocalIndexer;

/**
 * Deterministic mapping between world/local coordinates and Ashgrid cell/chunk indices.
 *
 * <p>Cell lookup is {@code floor((world - worldOrigin) / cellSize)} on each axis,
 * using rounded double subtraction and division, without a boundary epsilon.
 * Coordinates are right-handed with Y up; cellSize and worldOrigin use world units.</p>
 * <p>Only zero-based square XZ chunks are supported. The supplied scheme contributes
 * its positive chunkSize, captured at construction; its custom point, range and
 * neighborhood methods are not used. Chunk-local Y is the global cell Y.</p>
 * <p>Inputs and intermediate/output coordinates must be finite. Cell indices and
 * half-open range endpoints and per-axis range lengths must fit int; violations throw IllegalArgumentException.
 * Finite arithmetic can still lose cell detail at large origins or tiny cell sizes.
 * A generated center is not guaranteed to map back when rounding loses that detail.</p>
 * <p>Local conversions require an unchanged frame graph throughout the caller's
 * complete query, or a frozen graph snapshot. This mapper's mapping configuration is
 * immutable. For a grid attached to a moving frame use {@link FrameGridSpaceMapper3}.</p>
 */
public final class GridSpaceMapper3 {
    private final double cellSize;
    private final Vector3 worldOrigin;
    private final ChunkScheme chunkScheme;
    private final ChunkLocalIndexer chunkLocalIndexer;

    public GridSpaceMapper3(double cellSize, Vector3 worldOrigin, ChunkScheme chunkScheme) {
        requireFinite(cellSize, "cellSize");
        if (cellSize <= 0.0) throw new IllegalArgumentException("cellSize must be > 0");
        if (worldOrigin == null) throw new NullPointerException("worldOrigin");
        if (chunkScheme == null) throw new NullPointerException("chunkScheme");
        requireFinite(worldOrigin.x(), "worldOrigin.x");
        requireFinite(worldOrigin.y(), "worldOrigin.y");
        requireFinite(worldOrigin.z(), "worldOrigin.z");
        this.cellSize = cellSize;
        this.worldOrigin = worldOrigin;
        this.chunkScheme = chunkScheme;
        this.chunkLocalIndexer = new ChunkLocalIndexer(chunkScheme.chunkSize());
    }

    public double cellSize() {
        return cellSize;
    }

    public Vector3 worldOrigin() {
        return worldOrigin;
    }

    /**
     * Original scheme reference. Mapping uses only its chunk size captured at construction.
     */
    public ChunkScheme chunkScheme() {
        return chunkScheme;
    }

    /**
     * Map world point to containing cell by floor semantics.
     */
    public CellIndex3 worldToCell(Vector3 worldPoint) {
        Vector3 p = toNormalizedGridSpace(worldPoint);
        return new CellIndex3(
                floorToInt(p.x(), "worldPoint.x"),
                floorToInt(p.y(), "worldPoint.y"),
                floorToInt(p.z(), "worldPoint.z")
        );
    }

    /**
     * Map world point to the containing cell's chunk. All three cell indices must fit int.
     */
    public ChunkIndex2 worldToChunk(Vector3 worldPoint) {
        return cellToChunk(worldToCell(worldPoint));
    }

    /**
     * Map world point to chunk-local coordinates.
     */
    public ChunkLocal3 worldToChunkLocal(Vector3 worldPoint) {
        return cellToChunkLocal(worldToCell(worldPoint));
    }

    /**
     * Map world point to chunk address (chunk index + chunk-local).
     */
    public ChunkAddress3 worldToChunkAddress(Vector3 worldPoint) {
        return cellToChunkAddress(worldToCell(worldPoint));
    }

    /**
     * Map local frame point to containing cell.
     */
    public CellIndex3 localToCell(FrameGraph3 frames, FrameId localFrame, Vector3 localPoint) {
        if (frames == null) throw new NullPointerException("frames");
        if (localFrame == null) throw new NullPointerException("localFrame");
        if (localPoint == null) throw new NullPointerException("localPoint");
        Vector3 world = frames.rootFrom(localFrame).transformPoint(localPoint);
        return worldToCell(world);
    }

    /**
     * Map local frame point to containing chunk.
     */
    public ChunkIndex2 localToChunk(FrameGraph3 frames, FrameId localFrame, Vector3 localPoint) {
        if (frames == null) throw new NullPointerException("frames");
        if (localFrame == null) throw new NullPointerException("localFrame");
        if (localPoint == null) throw new NullPointerException("localPoint");
        Vector3 world = frames.rootFrom(localFrame).transformPoint(localPoint);
        return worldToChunk(world);
    }

    /**
     * Map local frame point to chunk-local coordinates.
     */
    public ChunkLocal3 localToChunkLocal(FrameGraph3 frames, FrameId localFrame, Vector3 localPoint) {
        if (frames == null) throw new NullPointerException("frames");
        if (localFrame == null) throw new NullPointerException("localFrame");
        if (localPoint == null) throw new NullPointerException("localPoint");
        Vector3 world = frames.rootFrom(localFrame).transformPoint(localPoint);
        return worldToChunkLocal(world);
    }

    /**
     * Map local frame point to chunk address (chunk index + chunk-local).
     */
    public ChunkAddress3 localToChunkAddress(FrameGraph3 frames, FrameId localFrame, Vector3 localPoint) {
        if (frames == null) throw new NullPointerException("frames");
        if (localFrame == null) throw new NullPointerException("localFrame");
        if (localPoint == null) throw new NullPointerException("localPoint");
        Vector3 world = frames.rootFrom(localFrame).transformPoint(localPoint);
        return worldToChunkAddress(world);
    }

    /**
     * Chunk index for an already computed cell.
     */
    public ChunkIndex2 cellToChunk(CellIndex3 cell) {
        return chunkLocalIndexer.chunkOfCell(cell);
    }

    /**
     * Chunk-local coordinates for an already computed cell.
     *
     * <p>For XZ chunking, {@code ly} is copied from the global cell {@code y}.</p>
     */
    public ChunkLocal3 cellToChunkLocal(CellIndex3 cell) {
        return chunkLocalIndexer.localOfCell(cell);
    }

    /**
     * Chunk address for an already computed cell.
     */
    public ChunkAddress3 cellToChunkAddress(CellIndex3 cell) {
        if (cell == null) throw new NullPointerException("cell");
        return new ChunkAddress3(cellToChunk(cell), cellToChunkLocal(cell));
    }

    /**
     * World-space minimum corner of a cell. Rejects non-finite output.
     */
    public Vector3 cellCorner(CellIndex3 cell) {
        if (cell == null) throw new NullPointerException("cell");
        return requireFinite(new Vector3(
                worldOrigin.x() + cell.x() * cellSize,
                worldOrigin.y() + cell.y() * cellSize,
                worldOrigin.z() + cell.z() * cellSize
        ), "cellCorner");
    }

    /**
     * World-space center of a cell, rounded in double arithmetic. Rejects non-finite output.
     */
    public Vector3 cellCenter(CellIndex3 cell) {
        if (cell == null) throw new NullPointerException("cell");
        return requireFinite(new Vector3(
                worldOrigin.x() + (cell.x() + 0.5) * cellSize,
                worldOrigin.y() + (cell.y() + 0.5) * cellSize,
                worldOrigin.z() + (cell.z() + 0.5) * cellSize
        ), "cellCenter");
    }

    /**
     * Returns cell range intersected by a finite world-space AABB.
     * Result is half-open: {@code [min,max)}.
     * The geometric maximum is excluded for this mapping, even though AABB contact
     * tests may include it. An extent collapsed by rounding produces an empty range.
     * A range including cell Integer.MAX_VALUE cannot have an int exclusive maximum.
     */
    public IntBox3 worldAabbToCells(AxisAlignedBox box) {
        if (box == null) throw new NullPointerException("box");

        Vector3 min = toNormalizedGridSpace(box.min());
        Vector3 max = toNormalizedGridSpace(box.max());

        int x0 = floorToInt(min.x(), "box.min.x");
        int y0 = floorToInt(min.y(), "box.min.y");
        int z0 = floorToInt(min.z(), "box.min.z");

        if (max.x() <= min.x() || max.y() <= min.y() || max.z() <= min.z()) {
            return new IntBox3(x0, y0, z0, x0, y0, z0);
        }

        int x1 = exclusiveUpperBound(max.x(), "box.max.x");
        int y1 = exclusiveUpperBound(max.y(), "box.max.y");
        int z1 = exclusiveUpperBound(max.z(), "box.max.z");
        requireSpanFitsInt(x0, x1, "cell range X");
        requireSpanFitsInt(y0, y1, "cell range Y");
        requireSpanFitsInt(z0, z1, "cell range Z");
        return new IntBox3(x0, y0, z0, x1, y1, z1);
    }

    /**
     * Returns chunk range intersected by a finite world-space AABB on XZ.
     * Result is half-open in chunk space.
     * Y extent is ignored (including zero height), but all coordinates must be finite.
     * XZ must map to int cells and exclusive chunk endpoints must fit int.
     */
    public IntRect2 worldAabbToChunks(AxisAlignedBox box) {
        if (box == null) throw new NullPointerException("box");
        Vector3 min = toNormalizedGridSpace(box.min());
        Vector3 max = toNormalizedGridSpace(box.max());
        ChunkIndex2 first = cellToChunk(new CellIndex3(
                floorToInt(min.x(), "box.min.x"), 0, floorToInt(min.z(), "box.min.z")));
        if (max.x() <= min.x() || max.z() <= min.z()) {
            return new IntRect2(first.cx(), first.cz(), first.cx(), first.cz());
        }
        ChunkIndex2 last = cellToChunk(new CellIndex3(
                floorToInt(Math.nextDown(max.x()), "box.max.x"), 0,
                floorToInt(Math.nextDown(max.z()), "box.max.z")));
        if (last.cx() == Integer.MAX_VALUE || last.cz() == Integer.MAX_VALUE) {
            throw new IllegalArgumentException("exclusive chunk maximum out of int range");
        }
        requireSpanFitsInt(first.cx(), last.cx() + 1, "chunk range X");
        requireSpanFitsInt(first.cz(), last.cz() + 1, "chunk range Z");
        return new IntRect2(first.cx(), first.cz(), last.cx() + 1, last.cz() + 1);
    }

    /**
     * Returns cell range intersected by a local-frame AABB.
     * The result is conservative for rotated local boxes because conversion uses
     * the world-space enclosing axis-aligned bounds.
     */
    public IntBox3 localAabbToCells(FrameGraph3 frames, FrameId localFrame, AxisAlignedBox localBox) {
        if (frames == null) throw new NullPointerException("frames");
        if (localFrame == null) throw new NullPointerException("localFrame");
        if (localBox == null) throw new NullPointerException("localBox");
        AxisAlignedBox worldBox = GeometryTransforms3.axisAlignedBox(frames.rootFrom(localFrame), localBox);
        return worldAabbToCells(worldBox);
    }

    /**
     * Returns chunk range intersected by a local-frame AABB on XZ.
     * The result is conservative for rotated local boxes because conversion uses
     * the world-space enclosing axis-aligned bounds.
     */
    public IntRect2 localAabbToChunks(FrameGraph3 frames, FrameId localFrame, AxisAlignedBox localBox) {
        if (frames == null) throw new NullPointerException("frames");
        if (localFrame == null) throw new NullPointerException("localFrame");
        if (localBox == null) throw new NullPointerException("localBox");
        AxisAlignedBox worldBox = GeometryTransforms3.axisAlignedBox(frames.rootFrom(localFrame), localBox);
        return worldAabbToChunks(worldBox);
    }

    private Vector3 toNormalizedGridSpace(Vector3 worldPoint) {
        if (worldPoint == null) throw new NullPointerException("worldPoint");
        requireFinite(worldPoint.x(), "worldPoint.x");
        requireFinite(worldPoint.y(), "worldPoint.y");
        requireFinite(worldPoint.z(), "worldPoint.z");
        return requireFinite(new Vector3(
                (worldPoint.x() - worldOrigin.x()) / cellSize,
                (worldPoint.y() - worldOrigin.y()) / cellSize,
                (worldPoint.z() - worldOrigin.z()) / cellSize
        ), "normalized grid coordinate");
    }

    private static int floorToInt(double value, String name) {
        requireFinite(value, name);
        double floored = Math.floor(value);
        if (floored < Integer.MIN_VALUE || floored > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(name + " out of int range: " + value);
        }
        return (int) floored;
    }

    private static int exclusiveUpperBound(double value, String name) {
        int lastIncluded = floorToInt(Math.nextDown(value), name);
        if (lastIncluded == Integer.MAX_VALUE) {
            throw new IllegalArgumentException(name + " out of int range: " + value);
        }
        return lastIncluded + 1;
    }

    private static void requireSpanFitsInt(int min, int max, String name) {
        // Ashgrid's range dimensions and empty checks subtract endpoints using int.
        if ((long) max - min > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(name + " length out of int range");
        }
    }

    private static Vector3 requireFinite(Vector3 value, String name) {
        requireFinite(value.x(), name + ".x");
        requireFinite(value.y(), name + ".y");
        requireFinite(value.z(), name + ".z");
        return value;
    }

    private static void requireFinite(double value, String name) {
        if (!Double.isFinite(value)) {
            throw new IllegalArgumentException(name + " must be finite");
        }
    }
}
