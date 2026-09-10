package nsk.nu.ashspace.api.frame;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.space.SpaceConverter3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FrameGraph3SnapshotTest {

    @Test
    void a_snapshot_keeps_queryable_state_after_updates_reparenting_and_removal() {
        // GIVEN
        FrameGraph3 live = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        FrameId tool = new FrameId("tool");
        FrameId dock = new FrameId("dock");
        live.define(ship, live.root(), RigidTransform3.translation(10, 0, 0));
        live.define(tool, ship, RigidTransform3.translation(0, 2, 0));
        live.define(dock, live.root(), RigidTransform3.translation(-10, 0, 0));
        FrameGraph3 frozen = live.snapshot();
        SpaceConverter3 converter = new SpaceConverter3(frozen);
        GridSpaceMapper3 mapper = new GridSpaceMapper3(1, Vector3.ZERO, new SquareXZChunkScheme(16));
        var before = live.frames();

        // WHEN
        live.define(ship, dock, RigidTransform3.translation(20, 0, 0));
        live.removeSubtree(dock);
        live.define(new FrameId("new"), live.root(), RigidTransform3.identity());

        // THEN
        assertFalse(live.isSnapshot());
        assertTrue(frozen.isSnapshot());
        assertSame(frozen, frozen.snapshot());
        assertSame(frozen, converter.frames());
        assertEquals(before, frozen.frames());
        assertEquals(List.of(live.root(), ship, tool, dock), List.copyOf(frozen.frames().keySet()));
        assertEquals(new Vector3(10, 2, 0), converter.toWorldPoint(tool, Vector3.ZERO));
        assertEquals(new CellIndex3(10, 2, 0), mapper.localToCell(frozen, tool, Vector3.ZERO));
        assertThrows(UnsupportedOperationException.class, () -> frozen.define(ship, frozen.root(), RigidTransform3.identity()));
        assertThrows(UnsupportedOperationException.class, () -> frozen.remove(tool));
        assertThrows(UnsupportedOperationException.class, () -> frozen.removeSubtree(ship));
        assertThrows(UnsupportedOperationException.class, () -> frozen.frames().clear());
        assertEquals(before, frozen.frames());
    }

    @Test
    void snapshot_creation_does_not_evaluate_unrepresentable_world_transforms() {
        // GIVEN
        FrameGraph3 live = FrameGraph3.worldRoot();
        FrameId sector = new FrameId("sector");
        FrameId ship = new FrameId("ship");
        FrameId tool = new FrameId("tool");
        live.define(sector, live.root(), RigidTransform3.translation(Double.MAX_VALUE, 0, 0));
        live.define(ship, sector, RigidTransform3.translation(Double.MAX_VALUE, 0, 0));
        live.define(tool, ship, RigidTransform3.translation(1, 2, 3));

        // WHEN
        FrameGraph3 frozen = live.snapshot();

        // THEN
        assertThrows(IllegalArgumentException.class, () -> frozen.rootFrom(ship));
        assertEquals(new Vector3(1, 2, 3), frozen.transform(tool, ship).transformPoint(Vector3.ZERO));
    }

    @Test
    void a_safely_published_snapshot_supports_concurrent_readers() throws Exception {
        // GIVEN
        FrameGraph3 live = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        live.define(ship, live.root(), RigidTransform3.translation(10, 2, -4));
        FrameGraph3 frozen = live.snapshot();
        SpaceConverter3 converter = new SpaceConverter3(frozen);
        List<Callable<Vector3>> queries = new ArrayList<>();
        for (int i = 0; i < 32; i++) {
            queries.add(() -> converter.toWorldPoint(ship, new Vector3(1, 2, 3)));
        }

        // WHEN / THEN
        try (var executor = Executors.newFixedThreadPool(4)) {
            live.remove(ship);
            for (var result : executor.invokeAll(queries)) {
                assertEquals(new Vector3(11, 4, -1), result.get());
            }
        }
    }
}
