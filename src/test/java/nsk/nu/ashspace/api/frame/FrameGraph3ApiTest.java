package nsk.nu.ashspace.api.frame;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FrameGraph3ApiTest {

    @Test
    void transform_between_frames_matches_chain_definition() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId world = graph.root();
        FrameId ship = new FrameId("ship");
        FrameId turret = new FrameId("turret");

        graph.define(ship, world, RigidTransform3.translation(10.0, 0.0, 0.0));
        graph.define(turret, ship, RigidTransform3.translation(0.0, 5.0, 0.0));

        Vector3 local = new Vector3(1.0, 2.0, 3.0);

        // WHEN
        Vector3 inWorld = graph.transform(turret, world).transformPoint(local);
        Vector3 back = graph.transform(world, turret).transformPoint(inWorld);
        Vector3 inShip = graph.transform(turret, ship).transformPoint(local);

        // THEN
        assertVector(new Vector3(11.0, 7.0, 3.0), inWorld, 1e-12);
        assertVector(local, back, 1e-12);
        assertVector(new Vector3(1.0, 7.0, 3.0), inShip, 1e-12);
    }

    @Test
    void cycle_definition_is_rejected() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId world = graph.root();
        FrameId a = new FrameId("a");
        FrameId b = new FrameId("b");

        graph.define(a, world, RigidTransform3.translation(1.0, 0.0, 0.0));
        graph.define(b, a, RigidTransform3.translation(0.0, 1.0, 0.0));

        // WHEN / THEN
        assertThrows(IllegalArgumentException.class,
                () -> graph.define(a, b, RigidTransform3.identity()));
    }

    @Test
    void unknown_frames_are_rejected() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId world = graph.root();
        FrameId missing = new FrameId("missing");

        // WHEN / THEN
        assertThrows(IllegalArgumentException.class, () -> graph.transform(world, missing));
        assertThrows(IllegalArgumentException.class, () -> graph.rootFrom(missing));
    }

    @Test
    void parent_query_returns_empty_for_root() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();

        // WHEN / THEN
        assertTrue(graph.parentOf(graph.root()).isEmpty());
        assertEquals(graph.root(), new FrameId("world"));
    }

    @Test
    void frame_snapshots_expose_current_structure() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId world = graph.root();
        FrameId ship = new FrameId("ship");
        graph.define(ship, world, RigidTransform3.translation(10.0, 0.0, 0.0));

        // WHEN
        Frame3 root = graph.frame(world);
        Frame3 child = graph.frame(ship);
        var frames = graph.frames();

        // THEN
        assertTrue(root.isRoot());
        assertEquals(ship, child.id());
        assertEquals(world, child.parent());
        assertEquals(2, graph.size());
        assertEquals(2, frames.size());
        assertTrue(frames.containsKey(world));
        assertTrue(frames.containsKey(ship));
    }

    @Test
    void root_redefinition_is_rejected() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId world = graph.root();

        // WHEN / THEN
        assertThrows(IllegalArgumentException.class,
                () -> graph.define(world, world, RigidTransform3.identity()));
    }

    @Test
    void deep_chain_transform_accumulates_all_parent_offsets() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId parent = graph.root();
        for (int i = 0; i < 64; i++) {
            FrameId id = new FrameId("f" + i);
            graph.define(id, parent, RigidTransform3.translation(1.0, 0.0, 0.0));
            parent = id;
        }
        Vector3 origin = Vector3.ZERO;

        // WHEN
        Vector3 inWorld = graph.transform(parent, graph.root()).transformPoint(origin);

        // THEN
        assertVector(new Vector3(64.0, 0.0, 0.0), inWorld, 1e-12);
    }

    private static void assertVector(Vector3 expected, Vector3 actual, double eps) {
        assertEquals(expected.x(), actual.x(), eps);
        assertEquals(expected.y(), actual.y(), eps);
        assertEquals(expected.z(), actual.z(), eps);
    }
}
