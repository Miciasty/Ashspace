package nsk.nu.ashspace.integration.grid;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.bounds.IntBox3;
import nsk.nu.ashgrid.api.grid.bounds.IntRect2;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.api.voxel.space.VoxelSpace;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.grid.FrameGridSpaceMapper3;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GridUnderflowIntegrationTest {

    @Test
    void point_mapping_preserves_the_side_of_zero_when_division_underflows() {
        for (double size : new double[]{2, 4, 1e308}) {
            for (Vector3 origin : new Vector3[]{Vector3.ZERO, new Vector3(Double.MIN_VALUE, Double.MIN_VALUE, Double.MIN_VALUE)}) {
                var scheme = new SquareXZChunkScheme(16);
                var mapper = new GridSpaceMapper3(size, origin, scheme);
                var frames = FrameGraph3.worldRoot();
                var attached = new FrameGridSpaceMapper3(frames, frames.root(), size, origin, scheme);
                var voxels = new VoxelSpace(size, origin);
                for (double offset : new double[]{-Double.MIN_VALUE, 0, Double.MIN_VALUE}) {
                    Vector3 point = origin.add(new Vector3(offset, offset, offset));
                    int index = offset < 0 ? -1 : 0;
                    CellIndex3 expected = new CellIndex3(index, index, index);
                    assertEquals(expected, mapper.worldToCell(point));
                    assertEquals(expected, attached.worldToCell(point));
                    assertEquals(new CellIndex3(voxels.ix(point), voxels.iy(point), voxels.iz(point)), expected);
                    assertEquals(mapper.cellToChunk(expected), mapper.worldToChunk(point));
                    assertEquals(mapper.cellToChunkLocal(expected), mapper.worldToChunkLocal(point));
                }
            }
        }
    }

    @Test
    void half_open_cell_and_chunk_ranges_preserve_tiny_extents_next_to_zero() {
        var mapper = new GridSpaceMapper3(2, Vector3.ZERO, new SquareXZChunkScheme(16));
        Vector3 negative = new Vector3(-Double.MIN_VALUE, -Double.MIN_VALUE, -Double.MIN_VALUE);
        Vector3 positive = new Vector3(Double.MIN_VALUE, Double.MIN_VALUE, Double.MIN_VALUE);
        var below = new AxisAlignedBox(negative, Vector3.ZERO);
        var above = new AxisAlignedBox(Vector3.ZERO, positive);
        var across = new AxisAlignedBox(negative, positive);
        assertEquals(new IntBox3(-1, -1, -1, 0, 0, 0), mapper.worldAabbToCells(below));
        assertEquals(new IntBox3(0, 0, 0, 1, 1, 1), mapper.worldAabbToCells(above));
        assertEquals(new IntBox3(-1, -1, -1, 1, 1, 1), mapper.worldAabbToCells(across));
        assertEquals(new IntRect2(-1, -1, 0, 0), mapper.worldAabbToChunks(below));
        assertEquals(new IntRect2(0, 0, 1, 1), mapper.worldAabbToChunks(above));
        assertEquals(new IntRect2(-1, -1, 1, 1), mapper.worldAabbToChunks(across));
    }
}
