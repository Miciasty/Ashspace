package nsk.nu.ashspace.api.frame;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashspace.api.space.SpaceConverter3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import java.util.List;

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
        assertThrows(IllegalArgumentException.class, () -> graph.transform(missing, missing));
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

    @Test
    void updates_and_reparenting_change_live_conversions_but_not_snapshots() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        FrameId tool = new FrameId("tool");
        FrameId dock = new FrameId("dock");
        graph.define(ship, graph.root(), RigidTransform3.translation(10, 0, 0));
        graph.define(tool, ship, RigidTransform3.translation(0, 2, 0));
        graph.define(dock, graph.root(), RigidTransform3.translation(-10, 0, 0));
        SpaceConverter3 converter = new SpaceConverter3(graph);
        var snapshot = graph.frames();
        RigidTransform3 oldTransform = converter.transform(tool, graph.root());

        // WHEN
        graph.define(ship, graph.root(), RigidTransform3.translation(20, 0, 0));
        Vector3 updated = converter.toWorldPoint(tool, Vector3.ZERO);
        graph.define(ship, dock, RigidTransform3.translation(1, 0, 0));

        // THEN
        assertVector(new Vector3(20, 2, 0), updated, 1e-12);
        assertVector(new Vector3(-9, 2, 0), converter.toWorldPoint(tool, Vector3.ZERO), 1e-12);
        assertVector(new Vector3(10, 2, 0), oldTransform.transformPoint(Vector3.ZERO), 1e-12);
        assertEquals(graph.root(), snapshot.get(ship).parent());
        assertEquals(RigidTransform3.translation(10, 0, 0), snapshot.get(ship).parentFromFrame());
        assertEquals(List.of(graph.root(), ship, tool, dock), List.copyOf(graph.frames().keySet()));
        assertThrows(UnsupportedOperationException.class, snapshot::clear);
    }

    @Test
    void rejected_definitions_leave_the_graph_unchanged() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId parent = new FrameId("parent");
        FrameId child = new FrameId("child");
        graph.define(parent, graph.root(), RigidTransform3.translation(1, 0, 0));
        graph.define(child, parent, RigidTransform3.translation(0, 2, 0));
        var snapshot = graph.frames();

        // WHEN / THEN
        assertThrows(IllegalArgumentException.class, () -> graph.define(parent, child, RigidTransform3.identity()));
        assertThrows(IllegalArgumentException.class, () -> graph.define(parent, parent, RigidTransform3.identity()));
        assertThrows(IllegalArgumentException.class, () -> graph.define(parent, new FrameId("missing"), RigidTransform3.identity()));
        assertEquals(snapshot, graph.frames());
        assertVector(new Vector3(1, 2, 0), graph.rootFrom(child).transformPoint(Vector3.ZERO), 1e-12);
    }

    @Test
    void arithmetic_results_do_not_depend_on_unrelated_frame_insertion_order() {
        // GIVEN
        FrameGraph3 first = FrameGraph3.worldRoot();
        FrameGraph3 second = FrameGraph3.worldRoot();
        FrameId a = new FrameId("a");
        FrameId b = new FrameId("b");
        RigidTransform3 pose = new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(1, 2, 3), 0.73), new Vector3(7, -2, 9));
        first.define(a, first.root(), pose);
        first.define(b, first.root(), RigidTransform3.translation(-3, 1, 4));
        second.define(b, second.root(), RigidTransform3.translation(-3, 1, 4));
        second.define(a, second.root(), pose);

        // WHEN / THEN
        assertEquals(first.transform(a, b), second.transform(a, b));
        assertEquals(first.transform(a, b), first.transform(a, b));
        assertEquals(List.of(first.root(), a, b), List.copyOf(first.frames().keySet()));
        assertEquals(List.of(second.root(), b, a), List.copyOf(second.frames().keySet()));
    }

    private static void assertVector(Vector3 expected, Vector3 actual, double eps) {
        assertEquals(expected.x(), actual.x(), eps);
        assertEquals(expected.y(), actual.y(), eps);
        assertEquals(expected.z(), actual.z(), eps);
    }
}
