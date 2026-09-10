package nsk.nu.ashspace.integration.grid;

import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashgrid.implementation.raster.sparse.HashSparseGrid3i;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.FrameGridSpaceMapper3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MovingGridIntegrationTest {

    @Test
    void world_queries_find_the_same_stored_block_after_the_vehicle_moves() {
        // GIVEN
        HashSparseGrid3i blocks = new HashSparseGrid3i(0);
        blocks.set(1, 0, -2, 42);
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        frames.define(ship, frames.root(), RigidTransform3.translation(10, 2, -4));
        FrameGridSpaceMapper3 live = new FrameGridSpaceMapper3(frames, ship, 0.5, Vector3.ZERO, new SquareXZChunkScheme(16));
        FrameGridSpaceMapper3 previous = live.snapshot();
        Vector3 oldWorldPoint = new Vector3(10.75, 2.25, -4.75);

        // WHEN
        frames.define(ship, frames.root(), new RigidTransform3(new Quaternion(0, 0, 1, 0), new Vector3(-10, 2, 4)));
        CellIndex3 oldCell = previous.worldToCell(oldWorldPoint);
        CellIndex3 newCell = live.worldToCell(new Vector3(-10.75, 2.25, 4.75));
        CellIndex3 vacated = live.worldToCell(oldWorldPoint);

        // THEN
        assertEquals(new CellIndex3(1, 0, -2), oldCell);
        assertEquals(oldCell, newCell);
        assertEquals(42, blocks.get(oldCell.x(), oldCell.y(), oldCell.z()));
        assertEquals(42, blocks.get(newCell.x(), newCell.y(), newCell.z()));
        assertEquals(0, blocks.get(vacated.x(), vacated.y(), vacated.z()));
        frames.remove(ship);
        assertEquals(oldCell, previous.worldToCell(oldWorldPoint));
    }
}
