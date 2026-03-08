package nsk.nu.ashspace.integration.grid;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.bounds.IntBox3;
import nsk.nu.ashgrid.api.grid.bounds.IntRect2;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.api.grid.indexing.ChunkIndex2;
import nsk.nu.ashgrid.api.grid.indexing.ChunkLocal3;
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
