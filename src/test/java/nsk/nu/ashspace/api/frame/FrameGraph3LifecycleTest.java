package nsk.nu.ashspace.api.frame;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.space.SpaceConverter3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FrameGraph3LifecycleTest {

    @Test
    void leaf_removal_invalidates_live_queries_and_redefinition_appends_the_id() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId a = new FrameId("a");
        FrameId b = new FrameId("b");
        graph.define(a, graph.root(), RigidTransform3.translation(1, 0, 0));
        graph.define(b, graph.root(), RigidTransform3.translation(2, 0, 0));
        SpaceConverter3 converter = new SpaceConverter3(graph);
        var definitions = graph.frames();

        // WHEN
        graph.remove(a);

        // THEN
        assertFalse(graph.contains(a));
        assertEquals(2, graph.size());
        assertEquals(3, definitions.size());
        assertThrows(IllegalArgumentException.class, () -> converter.toWorldPoint(a, Vector3.ZERO));
        assertThrows(IllegalArgumentException.class, () -> graph.transform(a, a));
        assertEquals(new Vector3(2, 0, 0), converter.toWorldPoint(b, Vector3.ZERO));
        graph.define(a, graph.root(), RigidTransform3.translation(3, 0, 0));
        assertEquals(List.of(graph.root(), b, a), List.copyOf(graph.frames().keySet()));
        assertEquals(new Vector3(3, 0, 0), converter.toWorldPoint(a, Vector3.ZERO));
    }

    @Test
    void rejected_removals_leave_every_definition_unchanged() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        FrameId tool = new FrameId("tool");
        FrameId missing = new FrameId("missing");
        graph.define(ship, graph.root(), RigidTransform3.identity());
        graph.define(tool, ship, RigidTransform3.identity());
        var before = graph.frames();

        // WHEN / THEN
        assertThrows(IllegalArgumentException.class, () -> graph.remove(ship));
        assertThrows(IllegalArgumentException.class, () -> graph.remove(graph.root()));
        assertThrows(IllegalArgumentException.class, () -> graph.removeSubtree(graph.root()));
        assertThrows(IllegalArgumentException.class, () -> graph.remove(missing));
        assertThrows(IllegalArgumentException.class, () -> graph.removeSubtree(missing));
        assertThrows(NullPointerException.class, () -> graph.remove(null));
        assertThrows(NullPointerException.class, () -> graph.removeSubtree(null));
        assertEquals(before, graph.frames());
    }

    @Test
    void subtree_removal_follows_current_parents_and_preserves_other_branches() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId oldParent = new FrameId("old-parent");
        FrameId child = new FrameId("child");
        FrameId grandchild = new FrameId("grandchild");
        FrameId newParent = new FrameId("new-parent");
        FrameId sibling = new FrameId("sibling");
        graph.define(oldParent, graph.root(), RigidTransform3.translation(1, 0, 0));
        graph.define(child, oldParent, RigidTransform3.identity());
        graph.define(grandchild, child, RigidTransform3.identity());
        graph.define(newParent, graph.root(), RigidTransform3.identity());
        graph.define(sibling, oldParent, RigidTransform3.translation(0, 2, 0));
        graph.define(child, newParent, RigidTransform3.identity());
        var before = graph.frames();

        // WHEN
        int removed = graph.removeSubtree(newParent);

        // THEN
        assertEquals(3, removed);
        assertEquals(List.of(graph.root(), oldParent, sibling), List.copyOf(graph.frames().keySet()));
        assertEquals(before.get(oldParent), graph.frame(oldParent));
        assertEquals(before.get(sibling), graph.frame(sibling));
        assertEquals(new Vector3(1, 2, 0), graph.rootFrom(sibling).transformPoint(Vector3.ZERO));
        assertEquals(1, graph.removeSubtree(sibling));
        graph.remove(oldParent);
        assertEquals(1, graph.size());
    }

    @Test
    void a_deep_subtree_can_be_removed_without_recursive_traversal() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId first = new FrameId("first");
        graph.define(first, graph.root(), RigidTransform3.identity());
        FrameId parent = first;
        for (int i = 1; i < 2048; i++) {
            FrameId child = new FrameId("child-" + i);
            graph.define(child, parent, RigidTransform3.identity());
            parent = child;
        }

        // WHEN / THEN
        assertEquals(2048, graph.removeSubtree(first));
        assertEquals(List.of(graph.root()), List.copyOf(graph.frames().keySet()));
    }
}
