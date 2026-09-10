package nsk.nu.ashspace.integration.grid;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.bounds.IntBox3;
import nsk.nu.ashgrid.api.grid.bounds.IntRect2;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.api.grid.indexing.ChunkIndex2;
import nsk.nu.ashgrid.api.grid.indexing.ChunkLocal3;
import nsk.nu.ashgrid.api.grid.indexing.ChunkScheme;
import nsk.nu.ashgrid.api.voxel.space.VoxelSpace;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GridMappingIntegrationTest {

    @Test
    void decimal_cell_boundaries_agree_with_voxel_space() {
        // GIVEN
        GridSpaceMapper3 mapper = new GridSpaceMapper3(0.1, Vector3.ZERO, new SquareXZChunkScheme(16));
        VoxelSpace voxels = new VoxelSpace(0.1, Vector3.ZERO);
        Vector3 point = new Vector3(-99.60000000000001, 0, 0);

        // WHEN / THEN
        assertEquals(-996, voxels.ix(point));
        assertEquals(new CellIndex3(voxels.ix(point), voxels.iy(point), voxels.iz(point)), mapper.worldToCell(point));
    }

    @Test
    void boundary_points_have_consistent_cells_chunks_and_local_addresses() {
        // GIVEN
        for (double cellSize : new double[]{0.1, 0.3, 0.5, 1.0, 2.0}) {
            for (Vector3 origin : new Vector3[]{Vector3.ZERO, new Vector3(10, -7, -4)}) {
                VoxelSpace voxels = new VoxelSpace(cellSize, origin);
                GridSpaceMapper3 mapper = new GridSpaceMapper3(cellSize, origin, new SquareXZChunkScheme(16));
                for (int index : new int[]{-33, -16, -1, 0, 1, 16, 33}) {
                    Vector3 boundary = voxels.corner(index, index, index);
                    for (Vector3 point : new Vector3[]{boundary,
                            new Vector3(Math.nextDown(boundary.x()), Math.nextDown(boundary.y()), Math.nextDown(boundary.z())),
                            new Vector3(Math.nextUp(boundary.x()), Math.nextUp(boundary.y()), Math.nextUp(boundary.z()))}) {
                        // WHEN
                        CellIndex3 cell = mapper.worldToCell(point);
                        var address = mapper.worldToChunkAddress(point);

                        // THEN
                        assertEquals(new CellIndex3(voxels.ix(point), voxels.iy(point), voxels.iz(point)), cell);
                        assertEquals(mapper.cellToChunk(cell), mapper.worldToChunk(point));
                        assertEquals(mapper.worldToChunk(point), address.chunk());
                        assertEquals(mapper.worldToChunkLocal(point), address.local());
                        assertEquals(cell.x(), (long) address.chunk().cx() * 16 + address.local().lx());
                        assertEquals(cell.z(), (long) address.chunk().cz() * 16 + address.local().lz());
                        assertEquals(cell.y(), address.local().ly());
                        assertTrue(address.local().lx() >= 0 && address.local().lx() < 16);
                        assertTrue(address.local().lz() >= 0 && address.local().lz() < 16);
                    }
                }
            }
        }
    }

    @Test
    void centers_round_trip_in_the_documented_tested_range() {
        // GIVEN
        for (double size : new double[]{0.1, 0.3, 0.5, 1.0, 2.0}) {
            for (Vector3 origin : new Vector3[]{Vector3.ZERO, new Vector3(10, -7, -4)}) {
                VoxelSpace voxels = new VoxelSpace(size, origin);
                GridSpaceMapper3 mapper = new GridSpaceMapper3(size, origin, new SquareXZChunkScheme(16));
                for (int index : new int[]{Integer.MIN_VALUE, -1_000_000, -17, -1, 0, 1, 16, 1_000_000, Integer.MAX_VALUE}) {
                    CellIndex3 cell = new CellIndex3(index, index, index);

                    // WHEN / THEN
                    assertEquals(voxels.center(index, index, index), mapper.cellCenter(cell));
                    assertEquals(cell, mapper.worldToCell(mapper.cellCenter(cell)));
                }
            }
        }
    }

    @Test
    void mapper_reads_only_chunk_size_from_the_scheme() {
        // GIVEN
        ChunkScheme scheme = new ChunkScheme() {
            public int chunkSize() { return 3; }
            public ChunkIndex2 chunkOfPoint(Vector3 point) { throw new AssertionError("custom mapping"); }
            public CellIndex3 cellOfPoint(Vector3 point) { throw new AssertionError("custom mapping"); }
            public AxisAlignedBox chunkBounds(ChunkIndex2 chunk) { throw new AssertionError("custom bounds"); }
            public Iterable<ChunkIndex2> neighbors4(ChunkIndex2 chunk) { throw new AssertionError("neighbors"); }
            public Iterable<ChunkIndex2> neighbors8(ChunkIndex2 chunk) { throw new AssertionError("neighbors"); }
        };
        GridSpaceMapper3 mapper = new GridSpaceMapper3(1, Vector3.ZERO, scheme);
        Vector3 point = new Vector3(-4, 2, 3);

        // WHEN / THEN
        assertEquals(new ChunkIndex2(-2, 1), mapper.worldToChunk(point));
        assertEquals(mapper.worldToChunk(point), mapper.worldToChunkAddress(point).chunk());
        assertEquals(new ChunkLocal3(2, 2, 0), mapper.worldToChunkLocal(point));
        assertEquals(new IntRect2(-2, 1, 0, 2), mapper.worldAabbToChunks(
                new AxisAlignedBox(point, new Vector3(0, 3, 6))));
    }

    @Test
    void local_box_mapping_is_consistent_with_pointwise_cell_mapping() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId world = graph.root();
        FrameId local = new FrameId("local");
        graph.define(local, world, RigidTransform3.translation(8, 0, 8));

        GridSpaceMapper3 mapper = new GridSpaceMapper3(
                1.0,
                Vector3.ZERO,
                new SquareXZChunkScheme(16)
        );

        AxisAlignedBox localBox = new AxisAlignedBox(new Vector3(-2, 0, -2), new Vector3(2, 2, 2));

        // WHEN
        IntBox3 cells = mapper.localAabbToCells(graph, local, localBox);
        IntRect2 chunks = mapper.localAabbToChunks(graph, local, localBox);

        // THEN
        assertEquals(new IntBox3(6, 0, 6, 10, 2, 10), cells);
        assertEquals(new IntRect2(0, 0, 1, 1), chunks);

        for (int z = cells.minZ(); z < cells.maxZ(); z++) {
            for (int y = cells.minY(); y < cells.maxY(); y++) {
                for (int x = cells.minX(); x < cells.maxX(); x++) {
                    CellIndex3 cell = new CellIndex3(x, y, z);
                    ChunkIndex2 chunk = mapper.cellToChunk(cell);
                    ChunkLocal3 localIndex = mapper.cellToChunkLocal(cell);

                    assertTrue(chunks.contains(chunk.cx(), chunk.cz()));
                    assertTrue(localIndex.lx() >= 0 && localIndex.lx() < 16);
                    assertTrue(localIndex.lz() >= 0 && localIndex.lz() < 16);
                }
            }
        }
    }
}
