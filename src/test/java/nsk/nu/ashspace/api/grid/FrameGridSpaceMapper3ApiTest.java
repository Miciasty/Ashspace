package nsk.nu.ashspace.api.grid;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.bounds.IntBox3;
import nsk.nu.ashgrid.api.grid.bounds.IntRect2;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.api.grid.indexing.ChunkIndex2;
import nsk.nu.ashgrid.api.grid.indexing.ChunkLocal3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FrameGridSpaceMapper3ApiTest {

    @Test
    void grid_axes_origin_and_cell_size_are_defined_in_the_attached_frame() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        FrameId tool = new FrameId("tool");
        frames.define(ship, frames.root(), new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2), new Vector3(10, 2, -4)));
        frames.define(tool, ship, RigidTransform3.translation(0.25, 0, 0));
        SquareXZChunkScheme scheme = new SquareXZChunkScheme(16);
        FrameGridSpaceMapper3 mapper = new FrameGridSpaceMapper3(frames, ship, 0.5, new Vector3(1, 0, -1), scheme);
        Vector3 worldPoint = new Vector3(9.75, 1.75, -5.75);
        Vector3 toolPoint = new Vector3(1.5, -0.25, -0.25);
        CellIndex3 cell = new CellIndex3(1, -1, 1);
        ChunkAddress3 address = new ChunkAddress3(new ChunkIndex2(0, 0), new ChunkLocal3(1, -1, 1));

        // WHEN / THEN
        assertSame(frames, mapper.frames());
        assertSame(scheme, mapper.chunkScheme());
        assertEquals(ship, mapper.gridFrame());
        assertEquals(0.5, mapper.cellSize());
        assertEquals(new Vector3(1, 0, -1), mapper.gridOrigin());
        assertEquals(cell, mapper.worldToCell(worldPoint));
        assertEquals(cell, mapper.localToCell(tool, toolPoint));
        assertEquals(address, mapper.worldToChunkAddress(worldPoint));
        assertEquals(address, mapper.localToChunkAddress(tool, toolPoint));
        assertEquals(address.chunk(), mapper.worldToChunk(worldPoint));
        assertEquals(address.chunk(), mapper.localToChunk(tool, toolPoint));
        assertEquals(address.local(), mapper.worldToChunkLocal(worldPoint));
        assertEquals(address.local(), mapper.localToChunkLocal(tool, toolPoint));
        assertVector(worldPoint, mapper.cellCenter(cell), 1e-12);
        assertVector(toolPoint, mapper.cellCenter(cell, tool), 1e-12);
        assertVector(new Vector3(9.5, 1.5, -5.5), mapper.cellCorner(cell), 1e-12);
        assertVector(new Vector3(1.5, -0.5, -0.5), mapper.cellCorner(cell, ship), 1e-12);
    }

    @Test
    void snapshots_keep_the_old_grid_pose_after_live_updates_and_removal() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        frames.define(ship, frames.root(), RigidTransform3.translation(10, 0, 0));
        FrameGridSpaceMapper3 live = new FrameGridSpaceMapper3(frames, ship, 1, Vector3.ZERO, new SquareXZChunkScheme(16));
        FrameGridSpaceMapper3 frozen = live.snapshot();
        Vector3 oldPoint = new Vector3(10.5, 0.5, 0.5);
        CellIndex3 cell = new CellIndex3(0, 0, 0);

        // WHEN
        frames.define(ship, frames.root(), RigidTransform3.translation(20, 0, 0));

        // THEN
        assertEquals(cell, frozen.worldToCell(oldPoint));
        assertNotEquals(cell, live.worldToCell(oldPoint));
        assertEquals(new Vector3(20.5, 0.5, 0.5), live.cellCenter(cell));
        assertSame(frozen, frozen.snapshot());
        assertTrue(frozen.frames().isSnapshot());
        frames.remove(ship);
        assertEquals(cell, frozen.worldToCell(oldPoint));
        assertThrows(IllegalArgumentException.class, () -> live.worldToCell(oldPoint));
        assertThrows(IllegalArgumentException.class, () -> live.cellCenter(cell));
        assertThrows(IllegalArgumentException.class, live::snapshot);
    }

    @Test
    void relative_grid_queries_keep_small_cell_offsets_at_a_large_world_origin() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        FrameId tool = new FrameId("tool");
        frames.define(ship, frames.root(), RigidTransform3.translation(0x1.0p54, 0, 0));
        frames.define(tool, ship, RigidTransform3.translation(1, 0, 0));
        FrameGridSpaceMapper3 mapper = new FrameGridSpaceMapper3(frames, ship, 1, Vector3.ZERO, new SquareXZChunkScheme(16));
        CellIndex3 cell = new CellIndex3(1, 0, 0);

        // WHEN / THEN
        assertEquals(cell, mapper.localToCell(tool, new Vector3(0.5, 0.5, 0.5)));
        assertEquals(new Vector3(0.5, 0.5, 0.5), mapper.cellCenter(cell, tool));
        assertEquals(new IntBox3(1, 0, 0, 2, 1, 1), mapper.localAabbToCells(tool,
                new AxisAlignedBox(Vector3.ZERO, new Vector3(1, 1, 1))));
    }

    @Test
    void translated_grid_boundaries_keep_floor_and_half_open_rules() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId grid = new FrameId("grid");
        frames.define(grid, frames.root(), RigidTransform3.translation(8, 0, -4));
        FrameGridSpaceMapper3 mapper = new FrameGridSpaceMapper3(frames, grid, 0.5, new Vector3(1, 0, -1), new SquareXZChunkScheme(16));

        // WHEN / THEN
        assertEquals(-1, mapper.worldToCell(new Vector3(Math.nextDown(9.0), 0, -5)).x());
        assertEquals(0, mapper.worldToCell(new Vector3(9, 0, -5)).x());
        assertEquals(0, mapper.worldToCell(new Vector3(Math.nextUp(9.0), 0, -5)).x());
        AxisAlignedBox worldBox = new AxisAlignedBox(new Vector3(8.5, 0, -5.5), new Vector3(9.5, 1, -4.5));
        assertEquals(new IntBox3(-1, 0, -1, 1, 2, 1), mapper.worldAabbToCells(worldBox));
        assertEquals(new IntRect2(-1, -1, 1, 1), mapper.worldAabbToChunks(worldBox));
        AxisAlignedBox localBox = new AxisAlignedBox(new Vector3(0.5, 0, -1.5), new Vector3(1.5, 1, -0.5));
        assertEquals(mapper.worldAabbToCells(worldBox), mapper.localAabbToCells(grid, localBox));
        assertEquals(mapper.worldAabbToChunks(worldBox), mapper.localAabbToChunks(grid, localBox));
    }

    @Test
    void rotated_world_bounds_produce_a_conservative_range_in_grid_axes() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId grid = new FrameId("grid");
        frames.define(grid, frames.root(), new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4), Vector3.ZERO));
        FrameGridSpaceMapper3 mapper = new FrameGridSpaceMapper3(frames, grid, 1, Vector3.ZERO, new SquareXZChunkScheme(2));
        AxisAlignedBox box = new AxisAlignedBox(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

        // WHEN
        IntBox3 cells = mapper.worldAabbToCells(box);

        // THEN
        assertEquals(new IntBox3(-2, -1, -2, 2, 1, 2), cells);
        assertEquals(new IntRect2(-1, -1, 1, 1), mapper.worldAabbToChunks(box));
        for (double x : new double[]{-0.9, 0, 0.9}) {
            for (double z : new double[]{-0.9, 0, 0.9}) {
                CellIndex3 cell = mapper.worldToCell(new Vector3(x, 0.5, z));
                assertTrue(cells.contains(cell.x(), cell.y(), cell.z()));
            }
        }
    }

    @Test
    void root_attached_grids_agree_with_the_existing_mapper() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        Vector3 origin = new Vector3(10, -7, -4);
        GridSpaceMapper3 original = new GridSpaceMapper3(0.1, origin, new SquareXZChunkScheme(16));
        FrameGridSpaceMapper3 attached = new FrameGridSpaceMapper3(frames, frames.root(), 0.1, origin, new SquareXZChunkScheme(16));

        // WHEN / THEN
        for (Vector3 point : new Vector3[]{origin, new Vector3(-99.60000000000001, 0, 1), new Vector3(32, -8, -16)}) {
            assertEquals(original.worldToCell(point), attached.worldToCell(point));
            assertEquals(original.worldToChunkAddress(point), attached.worldToChunkAddress(point));
        }
        CellIndex3 cell = new CellIndex3(-1, 2, 3);
        assertEquals(original.cellCenter(cell), attached.cellCenter(cell));
        assertEquals(original.cellCorner(cell), attached.cellCorner(cell));
    }

    @Test
    void invalid_frames_and_numeric_values_are_rejected() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId missing = new FrameId("missing");
        SquareXZChunkScheme scheme = new SquareXZChunkScheme(16);
        FrameGridSpaceMapper3 mapper = new FrameGridSpaceMapper3(frames, frames.root(), 1, Vector3.ZERO, scheme);

        // WHEN / THEN
        assertThrows(IllegalArgumentException.class, () -> new FrameGridSpaceMapper3(frames, missing, 1, Vector3.ZERO, scheme));
        assertThrows(IllegalArgumentException.class, () -> new FrameGridSpaceMapper3(frames, frames.root(), 0, Vector3.ZERO, scheme));
        assertThrows(NullPointerException.class, () -> new FrameGridSpaceMapper3(null, frames.root(), 1, Vector3.ZERO, scheme));
        assertThrows(NullPointerException.class, () -> new FrameGridSpaceMapper3(frames, null, 1, Vector3.ZERO, scheme));
        assertThrows(NullPointerException.class, () -> mapper.worldToCell(null));
        assertThrows(IllegalArgumentException.class, () -> mapper.localToCell(missing, Vector3.ZERO));
        assertThrows(IllegalArgumentException.class, () -> mapper.cellCenter(new CellIndex3(0, 0, 0), missing));
        assertThrows(IllegalArgumentException.class, () -> mapper.worldToCell(new Vector3(Double.NaN, 0, 0)));
        assertThrows(IllegalArgumentException.class, () -> mapper.worldToChunk(new Vector3(2147483648.0, 0, 0)));
        assertThrows(NullPointerException.class, () -> mapper.worldAabbToCells(null));
        assertThrows(IllegalArgumentException.class, () -> mapper.worldAabbToCells(new AxisAlignedBox(
                Vector3.ZERO, new Vector3(2147483648.0, 1, 1))));
    }

    private static void assertVector(Vector3 expected, Vector3 actual, double eps) {
        assertEquals(expected.x(), actual.x(), eps);
        assertEquals(expected.y(), actual.y(), eps);
        assertEquals(expected.z(), actual.z(), eps);
    }
}
