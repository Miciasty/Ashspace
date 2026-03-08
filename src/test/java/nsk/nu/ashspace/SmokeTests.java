package nsk.nu.ashspace;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.space.SpaceConverter3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SmokeTests {

    @Test
    void core_components_work_together() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId world = frames.root();
        FrameId ship = new FrameId("ship");
        frames.define(ship, world, RigidTransform3.translation(10, 0, -4));

        SpaceConverter3 converter = new SpaceConverter3(frames);
        GridSpaceMapper3 mapper = new GridSpaceMapper3(0.5, Vector3.ZERO, new SquareXZChunkScheme(16));

        // WHEN
        Vector3 worldPoint = converter.toWorldPoint(ship, new Vector3(0.9, -0.1, 0.9));
        var cell = mapper.worldToCell(worldPoint);

        // THEN
        assertEquals(21, cell.x());
        assertEquals(-1, cell.y());
        assertEquals(-7, cell.z());
    }
}
