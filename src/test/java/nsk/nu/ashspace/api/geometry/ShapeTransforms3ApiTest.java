package nsk.nu.ashspace.api.geometry;

import nsk.nu.ashcore.api.collision.CollisionTests;
import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.geometry.Capsule;
import nsk.nu.ashcore.api.geometry.OrientedBox;
import nsk.nu.ashcore.api.geometry.Sphere;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShapeTransforms3ApiTest {

    @Test
    void translation_moves_capsule_endpoints_and_box_center_without_changing_size() {
        // GIVEN
        RigidTransform3 transform = RigidTransform3.translation(10, -4, 7);
        Capsule capsule = new Capsule(new Vector3(1, 2, 3), new Vector3(-2, 5, 1), 0.75);
        AxisAlignedBox box = new AxisAlignedBox(new Vector3(-3, 1, -5), new Vector3(1, 7, -3));

        // WHEN
        Capsule movedCapsule = GeometryTransforms3.capsule(transform, capsule);
        OrientedBox movedBox = GeometryTransforms3.orientedBox(transform, box);

        // THEN
        assertEquals(new Vector3(11, -2, 10), movedCapsule.a());
        assertEquals(new Vector3(8, 1, 8), movedCapsule.b());
        assertEquals(capsule.radius(), movedCapsule.radius());
        assertEquals(new Vector3(9, 0, 3), movedBox.center());
        assertEquals(new Vector3(2, 3, 1), movedBox.halfExtents());
        assertEquals(Quaternion.identity(), movedBox.orientation());
    }

    @Test
    void capsule_rotations_preserve_axis_length_radius_and_surface_points() {
        // GIVEN
        Capsule capsule = new Capsule(new Vector3(1, -2, 3), new Vector3(1, 4, 3), 0.75);
        Vector3[] surface = {
                new Vector3(1, -2.75, 3), new Vector3(1, 4.75, 3),
                new Vector3(1.75, 1, 3), new Vector3(0.25, 1, 3),
                new Vector3(1, 1, 3.75), new Vector3(1, 1, 2.25)
        };
        for (double angle : new double[]{Math.PI / 4, Math.PI / 2, Math.PI}) {
            RigidTransform3 transform = new RigidTransform3(
                    Quaternion.fromAxisAngle(new Vector3(1, 2, -3), angle), new Vector3(10, -4, 7));

            // WHEN
            Capsule moved = GeometryTransforms3.capsule(transform, capsule);
            Capsule back = GeometryTransforms3.capsule(transform.inverse(), moved);

            // THEN
            assertEquals(capsule.radius(), moved.radius());
            assertEquals(6, moved.b().sub(moved.a()).length(), 1e-12);
            assertVector(capsule.a(), back.a());
            assertVector(capsule.b(), back.b());
            for (Vector3 point : surface) {
                Vector3 movedPoint = transform.transformPoint(point);
                Vector3 axis = moved.b().sub(moved.a());
                double fraction = movedPoint.sub(moved.a()).dot(axis) / axis.dot(axis);
                Vector3 nearest = moved.a().add(axis.mul(Math.max(0, Math.min(1, fraction))));
                assertEquals(moved.radius(), movedPoint.sub(nearest).length(), 1e-12);
            }
        }
    }

    @Test
    void aabb_rotations_preserve_corners_face_centers_and_half_extents() {
        // GIVEN
        AxisAlignedBox box = new AxisAlignedBox(new Vector3(-3, 1, -5), new Vector3(1, 7, -3));
        Vector3 center = new Vector3(-1, 4, -4);
        Vector3 half = new Vector3(2, 3, 1);
        for (double angle : new double[]{Math.PI / 4, Math.PI / 2, Math.PI}) {
            RigidTransform3 transform = new RigidTransform3(
                    Quaternion.fromAxisAngle(new Vector3(0, 1, 0), angle), new Vector3(10, -4, 7));

            // WHEN
            OrientedBox moved = GeometryTransforms3.orientedBox(transform, box);
            OrientedBox back = GeometryTransforms3.orientedBox(transform.inverse(), moved);

            // THEN
            assertEquals(half, moved.halfExtents());
            assertVector(center, back.center());
            for (Vector3 local : surfacePoints(half)) {
                assertVector(transform.transformPoint(center.add(local)), boxPoint(moved, local));
                assertVector(center.add(local), boxPoint(back, local));
            }
        }
    }

    @Test
    void obb_rotations_preserve_surface_points_and_apply_box_orientation_first() {
        // GIVEN
        OrientedBox box = new OrientedBox(new Vector3(1, 2, 3), new Vector3(2, 3, 1),
                Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2));
        for (double angle : new double[]{Math.PI / 4, Math.PI / 2, Math.PI}) {
            RigidTransform3 transform = new RigidTransform3(
                    Quaternion.fromAxisAngle(new Vector3(0, 1, 0), angle), new Vector3(10, -4, 7));

            // WHEN
            OrientedBox moved = GeometryTransforms3.orientedBox(transform, box);
            OrientedBox back = GeometryTransforms3.orientedBox(transform.inverse(), moved);

            // THEN
            assertEquals(box.halfExtents(), moved.halfExtents());
            assertVector(box.center(), back.center());
            for (Vector3 local : surfacePoints(box.halfExtents())) {
                assertVector(transform.transformPoint(boxPoint(box, local)), boxPoint(moved, local));
                assertVector(boxPoint(box, local), boxPoint(back, local));
            }
            if (angle == Math.PI / 2) {
                assertVector(new Vector3(0, 0, -1), moved.orientation().rotate(new Vector3(1, 0, 0)));
                assertVector(new Vector3(1, 0, 0), moved.orientation().rotate(new Vector3(0, 1, 0)));
                assertVector(new Vector3(0, -1, 0), moved.orientation().rotate(new Vector3(0, 0, 1)));
            }
        }
    }

    @Test
    void enclosing_aabb_contains_a_point_outside_the_rotated_shape() {
        // GIVEN
        AxisAlignedBox box = new AxisAlignedBox(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        RigidTransform3 transform = new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4), Vector3.ZERO);
        Vector3 point = new Vector3(1.3, 0, 1.3);

        // WHEN
        AxisAlignedBox enclosure = GeometryTransforms3.axisAlignedBox(transform, box);
        OrientedBox shape = GeometryTransforms3.orientedBox(transform, box);

        // THEN
        assertTrue(enclosure.contains(point));
        assertFalse(CollisionTests.sphereVsOrientedBox(new Sphere(point, 0), shape));
        assertTrue(CollisionTests.sphereVsOrientedBox(new Sphere(Vector3.ZERO, 0), shape));
    }

    @Test
    void degenerate_capsules_and_boxes_remain_valid() {
        // GIVEN
        RigidTransform3 transform = RigidTransform3.translation(10, -4, 7);
        for (Capsule capsule : new Capsule[]{
                new Capsule(Vector3.ZERO, Vector3.ZERO, 2),
                new Capsule(Vector3.ZERO, new Vector3(1, 0, 0), 0),
                new Capsule(Vector3.ZERO, Vector3.ZERO, 0)
        }) {
            // WHEN
            Capsule moved = GeometryTransforms3.capsule(transform, capsule);

            // THEN
            assertEquals(capsule.radius(), moved.radius());
            assertEquals(capsule, GeometryTransforms3.capsule(transform.inverse(), moved));
        }
        for (Vector3 half : new Vector3[]{new Vector3(0, 2, 3), new Vector3(0, 0, 3), Vector3.ZERO}) {
            AxisAlignedBox box = new AxisAlignedBox(half.mul(-1), half);
            OrientedBox moved = GeometryTransforms3.orientedBox(transform, box);
            assertEquals(half, moved.halfExtents());
            assertEquals(transform.translation(), moved.center());
            assertEquals(half, GeometryTransforms3.orientedBox(transform.inverse(), moved).halfExtents());
        }
    }

    @Test
    void aabb_center_and_half_extents_handle_large_bounds_and_documented_underflow() {
        // GIVEN
        RigidTransform3 identity = RigidTransform3.identity();
        AxisAlignedBox wide = new AxisAlignedBox(new Vector3(-Double.MAX_VALUE, 0, 0),
                new Vector3(Double.MAX_VALUE, 0, 0));
        AxisAlignedBox point = new AxisAlignedBox(new Vector3(Double.MIN_VALUE, 0, 0),
                new Vector3(Double.MIN_VALUE, 0, 0));

        // WHEN / THEN
        OrientedBox wideShape = GeometryTransforms3.orientedBox(identity, wide);
        assertEquals(Vector3.ZERO, wideShape.center());
        assertEquals(new Vector3(Double.MAX_VALUE, 0, 0), wideShape.halfExtents());
        assertEquals(point.min(), GeometryTransforms3.orientedBox(identity, point).center());
        assertEquals(Vector3.ZERO, GeometryTransforms3.orientedBox(identity,
                new AxisAlignedBox(Vector3.ZERO, point.max())).halfExtents());
    }

    @Test
    void null_geometry_or_transform_is_rejected() {
        // GIVEN
        RigidTransform3 transform = RigidTransform3.identity();
        Capsule capsule = new Capsule(Vector3.ZERO, Vector3.ZERO, 0);
        AxisAlignedBox aabb = new AxisAlignedBox(Vector3.ZERO, Vector3.ZERO);
        OrientedBox obb = new OrientedBox(Vector3.ZERO, Vector3.ZERO, Quaternion.identity());

        // WHEN / THEN
        assertThrows(NullPointerException.class, () -> GeometryTransforms3.capsule(null, capsule));
        assertThrows(NullPointerException.class, () -> GeometryTransforms3.capsule(transform, null));
        assertThrows(NullPointerException.class, () -> GeometryTransforms3.orientedBox(null, aabb));
        assertThrows(NullPointerException.class, () -> GeometryTransforms3.orientedBox(null, obb));
        assertThrows(NullPointerException.class, () -> GeometryTransforms3.orientedBox(transform, (AxisAlignedBox) null));
        assertThrows(NullPointerException.class, () -> GeometryTransforms3.orientedBox(transform, (OrientedBox) null));
    }

    @Test
    void nonfinite_aabb_bounds_and_unrepresentable_transformed_shapes_are_rejected() {
        // GIVEN
        RigidTransform3 identity = RigidTransform3.identity();
        RigidTransform3 large = RigidTransform3.translation(Double.MAX_VALUE, 0, 0);
        Vector3 point = new Vector3(Double.MAX_VALUE, 0, 0);

        // WHEN / THEN
        for (double value : new double[]{Double.NaN, Double.NEGATIVE_INFINITY, Double.POSITIVE_INFINITY}) {
            AxisAlignedBox box = new AxisAlignedBox(new Vector3(value, 0, 0), new Vector3(value, 0, 0));
            assertThrows(IllegalArgumentException.class, () -> GeometryTransforms3.orientedBox(identity, box));
        }
        assertThrows(IllegalArgumentException.class, () -> GeometryTransforms3.capsule(large,
                new Capsule(Vector3.ZERO, point, 1)));
        assertThrows(IllegalArgumentException.class, () -> GeometryTransforms3.orientedBox(large,
                new AxisAlignedBox(point, point)));
        assertThrows(IllegalArgumentException.class, () -> GeometryTransforms3.orientedBox(large,
                new OrientedBox(point, Vector3.ZERO, Quaternion.identity())));
    }

    private static Vector3[] surfacePoints(Vector3 half) {
        Vector3[] points = new Vector3[14];
        for (int mask = 0; mask < 8; mask++) {
            points[mask] = new Vector3((mask & 1) == 0 ? -half.x() : half.x(),
                    (mask & 2) == 0 ? -half.y() : half.y(), (mask & 4) == 0 ? -half.z() : half.z());
        }
        points[8] = new Vector3(half.x(), 0, 0);
        points[9] = new Vector3(-half.x(), 0, 0);
        points[10] = new Vector3(0, half.y(), 0);
        points[11] = new Vector3(0, -half.y(), 0);
        points[12] = new Vector3(0, 0, half.z());
        points[13] = new Vector3(0, 0, -half.z());
        return points;
    }

    private static Vector3 boxPoint(OrientedBox box, Vector3 local) {
        return box.center().add(box.orientation().rotate(local));
    }

    private static void assertVector(Vector3 expected, Vector3 actual) {
        assertEquals(expected.x(), actual.x(), 1e-12);
        assertEquals(expected.y(), actual.y(), 1e-12);
        assertEquals(expected.z(), actual.z(), 1e-12);
    }
}
