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

/**
 * A square XZ grid attached to a coordinate frame, such as a moving vehicle.
 * World points are converted into gridFrame before floor-based cell lookup.
 * Cell size and grid origin use grid-frame units, which rigid transforms preserve.
 * The grid axes rotate with that frame; chunk-local Y remains the grid cell Y.
 *
 * <p>Retains a live graph unless supplied a snapshot. Updates and reparenting affect
 * later queries; removing the grid or a referenced source/target frame makes those
 * queries fail with IllegalArgumentException. Keep the graph stable for a complete
 * query, or use {@link #snapshot()}. Snapshot creation requires a stable source too.</p>
 * <p>Uses {@link GridSpaceMapper3}'s finite/int/range-length limits, rounded division
 * and half-open range rules, without a boundary epsilon. Only the scheme's positive
 * chunk size is captured; custom mapping methods are not used. Frame conversions
 * can lose precision, especially for world coordinates far from the origin.</p>
 * <p>Each conversion costs O(hSource + hTarget) expected time and O(1) live additional
 * memory for the two frame depths. Range queries enclose eight transformed corners
 * and may include extra cells after rotation; they are not exact shape queries.</p>
 */
public final class FrameGridSpaceMapper3 {
    private final FrameGraph3 frames;
    private final FrameId gridFrame;
    private final GridSpaceMapper3 gridMapper;

    /**
     * Attach a grid to an existing frame. Null objects throw NullPointerException;
     * an unknown frame or invalid numeric configuration throws IllegalArgumentException.
     */
    public FrameGridSpaceMapper3(FrameGraph3 frames, FrameId gridFrame, double cellSize,
                                Vector3 gridOrigin, ChunkScheme chunkScheme) {
        this(frames, gridFrame, new GridSpaceMapper3(cellSize, gridOrigin, chunkScheme));
    }

    private FrameGridSpaceMapper3(FrameGraph3 frames, FrameId gridFrame, GridSpaceMapper3 gridMapper) {
        if (frames == null) throw new NullPointerException("frames");
        if (gridFrame == null) throw new NullPointerException("gridFrame");
        frames.frame(gridFrame);
        this.frames = frames;
        this.gridFrame = gridFrame;
        this.gridMapper = gridMapper;
    }

    /**
     * Retained graph, live or frozen as supplied.
     */
    public FrameGraph3 frames() {
        return frames;
    }

    /**
     * Frame in which grid origin, axes and cell size are defined.
     */
    public FrameId gridFrame() {
        return gridFrame;
    }

    /**
     * Cell edge length in grid-frame units.
     */
    public double cellSize() {
        return gridMapper.cellSize();
    }

    /**
     * Minimum corner of cell (0,0,0), expressed in gridFrame.
     */
    public Vector3 gridOrigin() {
        return gridMapper.worldOrigin();
    }

    /**
     * Original scheme reference; mapping uses only the size captured at construction.
     */
    public ChunkScheme chunkScheme() {
        return gridMapper.chunkScheme();
    }

    /**
     * Freeze the graph for later queries in O(n) time/memory for n frames.
     * Mapping configuration is shared and unchanged. Returns this if already frozen.
     * The result supports concurrent queries after safe publication.
     */
    public FrameGridSpaceMapper3 snapshot() {
        if (frames.isSnapshot()) return this;
        return new FrameGridSpaceMapper3(frames.snapshot(), gridFrame, gridMapper);
    }

    /**
     * Map a root/world point to a cell of this grid.
     */
    public CellIndex3 worldToCell(Vector3 worldPoint) {
        return localToCell(frames.root(), worldPoint);
    }

    /**
     * Map a root/world point to a chunk of this grid.
     */
    public ChunkIndex2 worldToChunk(Vector3 worldPoint) {
        return gridMapper.cellToChunk(worldToCell(worldPoint));
    }

    /**
     * Map a root/world point to chunk-local coordinates in this grid.
     */
    public ChunkLocal3 worldToChunkLocal(Vector3 worldPoint) {
        return gridMapper.cellToChunkLocal(worldToCell(worldPoint));
    }

    /**
     * Map a root/world point to a chunk and chunk-local address in this grid.
     */
    public ChunkAddress3 worldToChunkAddress(Vector3 worldPoint) {
        return gridMapper.cellToChunkAddress(worldToCell(worldPoint));
    }

    /**
     * Map a point expressed in source to a cell of this grid, using the nearest
     * common ancestor rather than an intermediate world point.
     */
    public CellIndex3 localToCell(FrameId source, Vector3 point) {
        if (point == null) throw new NullPointerException("point");
        Vector3 inGrid = frames.transform(source, gridFrame).transformPoint(point);
        return gridMapper.worldToCell(inGrid);
    }

    /**
     * Map a source-frame point to a chunk of this grid.
     */
    public ChunkIndex2 localToChunk(FrameId source, Vector3 point) {
        return gridMapper.cellToChunk(localToCell(source, point));
    }

    /**
     * Map a source-frame point to chunk-local coordinates in this grid.
     */
    public ChunkLocal3 localToChunkLocal(FrameId source, Vector3 point) {
        return gridMapper.cellToChunkLocal(localToCell(source, point));
    }

    /**
     * Map a source-frame point to a chunk address in this grid.
     */
    public ChunkAddress3 localToChunkAddress(FrameId source, Vector3 point) {
        return gridMapper.cellToChunkAddress(localToCell(source, point));
    }

    /**
     * Grid cell's minimum local corner transformed into world coordinates.
     * After rotation this need not be the minimum of its world-space AABB.
     */
    public Vector3 cellCorner(CellIndex3 cell) {
        return cellCorner(cell, frames.root());
    }

    /**
     * Grid cell's minimum local corner transformed into target coordinates.
     */
    public Vector3 cellCorner(CellIndex3 cell, FrameId target) {
        return frames.transform(gridFrame, target).transformPoint(gridMapper.cellCorner(cell));
    }

    /**
     * Grid cell center in world coordinates, subject to floating-point rounding.
     */
    public Vector3 cellCenter(CellIndex3 cell) {
        return cellCenter(cell, frames.root());
    }

    /**
     * Grid cell center in target coordinates, without passing through world space.
     */
    public Vector3 cellCenter(CellIndex3 cell, FrameId target) {
        return frames.transform(gridFrame, target).transformPoint(gridMapper.cellCenter(cell));
    }

    /**
     * Half-open cell range enclosing a world AABB in this grid.
     * Rotation can add extra cells; empty extents are interpreted after enclosure.
     */
    public IntBox3 worldAabbToCells(AxisAlignedBox box) {
        return localAabbToCells(frames.root(), box);
    }

    /**
     * Half-open chunk range enclosing a world AABB in this grid's XZ plane.
     * Y extent is ignored after conversion into grid coordinates.
     */
    public IntRect2 worldAabbToChunks(AxisAlignedBox box) {
        return localAabbToChunks(frames.root(), box);
    }

    /**
     * Half-open conservative cell range for an AABB expressed in source.
     */
    public IntBox3 localAabbToCells(FrameId source, AxisAlignedBox box) {
        return gridMapper.worldAabbToCells(boxInGrid(source, box));
    }

    /**
     * Half-open conservative chunk range for an AABB expressed in source.
     * Projects the enclosing grid-frame AABB onto XZ, ignoring its Y extent.
     */
    public IntRect2 localAabbToChunks(FrameId source, AxisAlignedBox box) {
        return gridMapper.worldAabbToChunks(boxInGrid(source, box));
    }

    private AxisAlignedBox boxInGrid(FrameId source, AxisAlignedBox box) {
        if (box == null) throw new NullPointerException("box");
        if (source != null && source.equals(gridFrame)) {
            frames.frame(gridFrame);
            return box;
        }
        return GeometryTransforms3.axisAlignedBox(frames.transform(source, gridFrame), box);
    }
}
