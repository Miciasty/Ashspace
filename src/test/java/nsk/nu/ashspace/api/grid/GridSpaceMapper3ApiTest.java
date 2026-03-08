package nsk.nu.ashspace.api.grid;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.bounds.IntBox3;
import nsk.nu.ashgrid.api.grid.bounds.IntRect2;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.api.grid.indexing.ChunkIndex2;
import nsk.nu.ashgrid.api.grid.indexing.ChunkLocal3;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GridSpaceMapper3ApiTest {

    @Test
    void world_mapping_uses_floor_semantics_for_cells_and_chunks() {
        // GIVEN
        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                0.5,
                new Vector3(10, 0, -4),
                new SquareXZChunkScheme(16)
        );

        // WHEN
        CellIndex3 c1 = mapper.worldToCell(new Vector3(10.9, -0.1, -3.1));
        CellIndex3 c2 = mapper.worldToCell(new Vector3(9.9, 0.0, -4.1));
        ChunkIndex2 k1 = mapper.worldToChunk(new Vector3(10.9, -0.1, -3.1));
        ChunkIndex2 k2 = mapper.worldToChunk(new Vector3(9.9, 0.0, -4.1));
        ChunkLocal3 l1 = mapper.worldToChunkLocal(new Vector3(10.9, -0.1, -3.1));
        ChunkLocal3 l2 = mapper.worldToChunkLocal(new Vector3(9.9, 0.0, -4.1));
        ChunkAddress3 a1 = mapper.worldToChunkAddress(new Vector3(10.9, -0.1, -3.1));

        // THEN
        assertEquals(new CellIndex3(1, -1, 1), c1);
        assertEquals(new CellIndex3(-1, 0, -1), c2);
        assertEquals(new ChunkIndex2(0, 0), k1);
        assertEquals(new ChunkIndex2(-1, -1), k2);
        assertEquals(new ChunkLocal3(1, -1, 1), l1);
        assertEquals(new ChunkLocal3(15, 0, 15), l2);
        assertEquals(new ChunkAddress3(new ChunkIndex2(0, 0), new ChunkLocal3(1, -1, 1)), a1);
    }

    @Test
    void cell_corner_and_center_match_world_space_definition() {
        // GIVEN
        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                0.5,
                new Vector3(10, 0, -4),
                new SquareXZChunkScheme(16)
        );
        CellIndex3 cell = new CellIndex3(2, 4, 6);

        // WHEN
        Vector3 corner = mapper.cellCorner(cell);
        Vector3 center = mapper.cellCenter(cell);

        // THEN
        assertVector(new Vector3(11.0, 2.0, -1.0), corner, 1e-12);
        assertVector(new Vector3(11.25, 2.25, -0.75), center, 1e-12);
    }

    @Test
    void world_aabb_to_cells_is_half_open() {
        // GIVEN
        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                0.5,
                new Vector3(10, 0, -4),
                new SquareXZChunkScheme(16)
        );
        AxisAlignedBox box = new AxisAlignedBox(new Vector3(10, 0, -4), new Vector3(11, 1, -3));

        // WHEN
        IntBox3 cells = mapper.worldAabbToCells(box);

        // THEN
        assertEquals(new IntBox3(0, 0, 0, 2, 2, 2), cells);
    }

    @Test
    void world_aabb_to_chunks_is_half_open_on_xz() {
        // GIVEN
        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                0.5,
                new Vector3(10, 0, -4),
                new SquareXZChunkScheme(16)
        );
        AxisAlignedBox box = new AxisAlignedBox(new Vector3(10, 0, -4), new Vector3(26, 1, 12));

        // WHEN
        IntRect2 chunks = mapper.worldAabbToChunks(box);

        // THEN
        assertEquals(new IntRect2(0, 0, 2, 2), chunks);
    }

    @Test
    void local_frame_point_can_be_mapped_through_frame_graph() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId world = graph.root();
        FrameId ship = new FrameId("ship");
        graph.define(ship, world, RigidTransform3.translation(10, 0, -4));

        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                0.5,
                Vector3.ZERO,
                new SquareXZChunkScheme(16)
        );

        // WHEN
        CellIndex3 cell = mapper.localToCell(graph, ship, new Vector3(0.9, -0.1, 0.9));
        ChunkAddress3 address = mapper.localToChunkAddress(graph, ship, new Vector3(0.9, -0.1, 0.9));

        // THEN
        assertEquals(new CellIndex3(21, -1, -7), cell);
        assertEquals(new ChunkAddress3(new ChunkIndex2(1, -1), new ChunkLocal3(5, -1, 9)), address);
    }

    @Test
    void invalid_cell_size_is_rejected() {
        // GIVEN / WHEN / THEN
        assertThrows(IllegalArgumentException.class,
                () -> new GridSpaceMapper3(0.0, Vector3.ZERO, new SquareXZChunkScheme(16)));
    }

    @Test
    void cell_to_chunk_mapping_handles_negative_indices() {
        // GIVEN
        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                1.0,
                Vector3.ZERO,
                new SquareXZChunkScheme(16)
        );
        CellIndex3 cell = new CellIndex3(-1, 5, -17);

        // WHEN
        ChunkIndex2 chunk = mapper.cellToChunk(cell);
        ChunkLocal3 local = mapper.cellToChunkLocal(cell);
        ChunkAddress3 address = mapper.cellToChunkAddress(cell);

        // THEN
        assertEquals(new ChunkIndex2(-1, -2), chunk);
        assertEquals(new ChunkLocal3(15, 5, 15), local);
        assertEquals(new ChunkAddress3(chunk, local), address);
    }

    @Test
    void local_aabb_mapping_uses_world_transform_then_grid_mapping() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId world = graph.root();
        FrameId local = new FrameId("local");
        graph.define(local, world, RigidTransform3.translation(10, 0, -4));

        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                0.5,
                Vector3.ZERO,
                new SquareXZChunkScheme(16)
        );
        AxisAlignedBox localBox = new AxisAlignedBox(new Vector3(0, 0, 0), new Vector3(1, 1, 1));

        // WHEN
        IntBox3 cells = mapper.localAabbToCells(graph, local, localBox);
        IntRect2 chunks = mapper.localAabbToChunks(graph, local, localBox);

        // THEN
        assertEquals(new IntBox3(20, 0, -8, 22, 2, -6), cells);
        assertEquals(new IntRect2(1, -1, 2, 0), chunks);
    }

    @Test
    void non_finite_input_is_rejected() {
        // GIVEN
        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                1.0,
                Vector3.ZERO,
                new SquareXZChunkScheme(16)
        );

        // WHEN / THEN
        assertThrows(IllegalArgumentException.class,
                () -> mapper.worldToCell(new Vector3(Double.NaN, 0, 0)));
        assertThrows(IllegalArgumentException.class,
                () -> mapper.worldAabbToCells(new AxisAlignedBox(
                        new Vector3(0, 0, 0),
                        new Vector3(Double.POSITIVE_INFINITY, 1, 1)
                )));
    }

    @Test
    void out_of_int_range_mapping_is_rejected() {
        // GIVEN
        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                1.0,
                Vector3.ZERO,
                new SquareXZChunkScheme(16)
        );

        // WHEN / THEN
        assertThrows(IllegalArgumentException.class,
                () -> mapper.worldToCell(new Vector3((double) Integer.MAX_VALUE + 1024.0, 0.0, 0.0)));
        assertThrows(IllegalArgumentException.class,
                () -> mapper.worldAabbToCells(new AxisAlignedBox(
                        new Vector3(0.0, 0.0, 0.0),
                        new Vector3((double) Integer.MAX_VALUE + 1024.0, 1.0, 1.0)
                )));
    }

    private static void assertVector(Vector3 expected, Vector3 actual, double eps) {
        assertEquals(expected.x(), actual.x(), eps);
        assertEquals(expected.y(), actual.y(), eps);
        assertEquals(expected.z(), actual.z(), eps);
    }
}
