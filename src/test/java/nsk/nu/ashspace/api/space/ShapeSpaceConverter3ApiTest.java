package nsk.nu.ashspace.api.space;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.geometry.Capsule;
import nsk.nu.ashcore.api.geometry.OrientedBox;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ShapeSpaceConverter3ApiTest {

    @Test
    void nested_frames_convert_shapes_in_both_directions() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId world = frames.root();
        FrameId ship = new FrameId("ship");
        FrameId tool = new FrameId("tool");
        frames.define(ship, world, new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2), new Vector3(10, 20, 30)));
        frames.define(tool, ship, new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2), new Vector3(2, 0, 0)));
        SpaceConverter3 converter = new SpaceConverter3(frames);
        Capsule capsule = new Capsule(new Vector3(1, 2, 3), new Vector3(2, 4, 6), 0.75);
        AxisAlignedBox aabb = new AxisAlignedBox(Vector3.ZERO, new Vector3(2, 4, 6));
        OrientedBox obb = new OrientedBox(capsule.a(), new Vector3(1, 2, 3),
                Quaternion.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 4));

        // WHEN
        Capsule movedCapsule = converter.capsule(capsule, tool, world);
        OrientedBox movedAabb = converter.orientedBox(aabb, tool, world);
        OrientedBox movedObb = converter.orientedBox(obb, tool, world);
        Capsule backCapsule = converter.capsule(movedCapsule, world, tool);
        OrientedBox backAabb = converter.orientedBox(movedAabb, world, tool);
        OrientedBox backObb = converter.orientedBox(movedObb, world, tool);

        // THEN
        assertVector(new Vector3(12, 17, 27), movedCapsule.a());
        assertVector(new Vector3(14, 14, 26), movedCapsule.b());
        assertVector(new Vector3(12, 17, 27), movedAabb.center());
        assertVector(new Vector3(12, 17, 27), movedObb.center());
        assertEquals(capsule.radius(), movedCapsule.radius());
        assertEquals(obb.halfExtents(), movedObb.halfExtents());
        assertEquals(new Vector3(1, 2, 3), movedAabb.halfExtents());
        assertVector(capsule.a(), backCapsule.a());
        assertVector(capsule.b(), backCapsule.b());
        assertVector(new Vector3(1, 2, 3), backAabb.center());
        assertVector(obb.center(), backObb.center());
        for (Vector3 axis : new Vector3[]{new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)}) {
            assertVector(axis, backAabb.orientation().rotate(axis));
            assertVector(obb.orientation().rotate(axis), backObb.orientation().rotate(axis));
            assertVector(converter.direction(obb.orientation().rotate(axis), tool, world),
                    movedObb.orientation().rotate(axis));
        }
    }

    @Test
    void live_conversions_follow_changes_while_returned_values_and_snapshots_remain_stable() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId world = frames.root();
        FrameId ship = new FrameId("ship");
        frames.define(ship, world, RigidTransform3.translation(10, 0, 0));
        SpaceConverter3 live = new SpaceConverter3(frames);
        SpaceConverter3 frozen = new SpaceConverter3(frames.snapshot());
        Capsule capsule = new Capsule(Vector3.ZERO, new Vector3(0, 1, 0), 1);
        AxisAlignedBox aabb = new AxisAlignedBox(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
        OrientedBox obb = new OrientedBox(Vector3.ZERO, new Vector3(1, 2, 3), Quaternion.identity());
        Capsule previousCapsule = live.capsule(capsule, ship, world);
        OrientedBox previousAabb = live.orientedBox(aabb, ship, world);
        OrientedBox previousObb = live.orientedBox(obb, ship, world);

        // WHEN
        frames.define(ship, world, RigidTransform3.translation(20, 0, 0));

        // THEN
        assertEquals(new Vector3(20, 0, 0), live.capsule(capsule, ship, world).a());
        assertEquals(new Vector3(20, 0, 0), live.orientedBox(aabb, ship, world).center());
        assertEquals(new Vector3(20, 0, 0), live.orientedBox(obb, ship, world).center());
        frames.remove(ship);
        assertEquals(new Vector3(10, 0, 0), previousCapsule.a());
        assertEquals(new Vector3(10, 0, 0), previousAabb.center());
        assertEquals(new Vector3(10, 0, 0), previousObb.center());
        assertEquals(previousCapsule, frozen.capsule(capsule, ship, world));
        assertEquals(previousAabb, frozen.orientedBox(aabb, ship, world));
        assertEquals(previousObb, frozen.orientedBox(obb, ship, world));
        assertThrows(IllegalArgumentException.class, () -> live.capsule(capsule, ship, world));
        assertThrows(IllegalArgumentException.class, () -> live.orientedBox(aabb, ship, world));
        assertThrows(IllegalArgumentException.class, () -> live.orientedBox(obb, ship, world));
    }

    @Test
    void relative_shapes_do_not_require_representable_common_ancestor_world_transform() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId parent = new FrameId("parent");
        FrameId ship = new FrameId("ship");
        FrameId source = new FrameId("source");
        FrameId target = new FrameId("target");
        frames.define(parent, frames.root(), RigidTransform3.translation(Double.MAX_VALUE, 0, 0));
        frames.define(ship, parent, RigidTransform3.translation(Double.MAX_VALUE, 0, 0));
        frames.define(source, ship, RigidTransform3.translation(1, 0, 0));
        frames.define(target, ship, RigidTransform3.translation(2, 0, 0));
        Capsule capsule = new Capsule(Vector3.ZERO, new Vector3(0, 1, 0), 0.5);
        AxisAlignedBox aabb = new AxisAlignedBox(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        OrientedBox obb = new OrientedBox(Vector3.ZERO, new Vector3(1, 2, 3), Quaternion.identity());

        // WHEN / THEN
        for (FrameGraph3 graph : new FrameGraph3[]{frames, frames.snapshot()}) {
            SpaceConverter3 converter = new SpaceConverter3(graph);
            assertEquals(new Vector3(-1, 0, 0), converter.capsule(capsule, source, target).a());
            assertEquals(new Vector3(-1, 0, 0), converter.orientedBox(aabb, source, target).center());
            assertEquals(new Vector3(-1, 0, 0), converter.orientedBox(obb, source, target).center());
        }
    }

    @Test
    void shape_conversions_reject_nulls_and_missing_frames_even_when_source_equals_target() {
        // GIVEN
        FrameGraph3 frames = FrameGraph3.worldRoot();
        SpaceConverter3 converter = new SpaceConverter3(frames);
        FrameId world = frames.root();
        FrameId missing = new FrameId("missing");
        Capsule capsule = new Capsule(Vector3.ZERO, Vector3.ZERO, 0);
        AxisAlignedBox aabb = new AxisAlignedBox(Vector3.ZERO, Vector3.ZERO);
        OrientedBox obb = new OrientedBox(Vector3.ZERO, Vector3.ZERO, Quaternion.identity());

        // WHEN / THEN
        assertThrows(NullPointerException.class, () -> converter.capsule(null, world, world));
        assertThrows(NullPointerException.class, () -> converter.orientedBox((AxisAlignedBox) null, world, world));
        assertThrows(NullPointerException.class, () -> converter.orientedBox((OrientedBox) null, world, world));
        assertThrows(NullPointerException.class, () -> converter.capsule(capsule, null, world));
        assertThrows(NullPointerException.class, () -> converter.orientedBox(aabb, world, null));
        assertThrows(NullPointerException.class, () -> converter.orientedBox(obb, null, world));
        assertThrows(IllegalArgumentException.class, () -> converter.capsule(capsule, missing, missing));
        assertThrows(IllegalArgumentException.class, () -> converter.orientedBox(aabb, missing, missing));
        assertThrows(IllegalArgumentException.class, () -> converter.orientedBox(obb, missing, missing));
        assertEquals(capsule, converter.capsule(capsule, world, world));
        assertEquals(obb, converter.orientedBox(obb, world, world));
    }

    private static void assertVector(Vector3 expected, Vector3 actual) {
        assertEquals(expected.x(), actual.x(), 1e-12);
        assertEquals(expected.y(), actual.y(), 1e-12);
        assertEquals(expected.z(), actual.z(), 1e-12);
    }
}
