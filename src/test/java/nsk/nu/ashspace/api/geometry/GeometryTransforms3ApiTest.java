package nsk.nu.ashspace.api.geometry;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.geometry.Ray;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

class GeometryTransforms3ApiTest {

    @Test
    void transformed_aabb_contains_transformed_original_corners() {
        // GIVEN
        AxisAlignedBox box = new AxisAlignedBox(new Vector3(-1, -2, -3), new Vector3(2, 1, 0));
        for (double angle : new double[]{0, Math.PI / 4, Math.PI / 2, -0.73}) {
            RigidTransform3 transform = new RigidTransform3(
                    Quaternion.fromAxisAngle(new Vector3(1, 2, -3), angle), new Vector3(5, -4, 7));

            // WHEN
            AxisAlignedBox out = GeometryTransforms3.axisAlignedBox(transform, box);

            // THEN
            for (int mask = 0; mask < 8; mask++) {
                double x = ((mask & 1) == 0) ? box.min().x() : box.max().x();
                double y = ((mask & 2) == 0) ? box.min().y() : box.max().y();
                double z = ((mask & 4) == 0) ? box.min().z() : box.max().z();
                Vector3 p = transform.transformPoint(new Vector3(x, y, z));
                assertTrue(out.contains(p));
            }
        }
    }

    @Test
    void ray_distance_parameter_is_preserved_within_rounding() {
        // GIVEN
        RigidTransform3 transform = new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(1, 2, 3), 0.73), new Vector3(10, -2, 7));
        Ray ray = new Ray(new Vector3(1, 2, 3), new Vector3(3, -4, 12));

        // WHEN
        Ray transformed = GeometryTransforms3.ray(transform, ray);

        // THEN
        assertEquals(1.0, transformed.direction().length(), 1e-12);
        for (double distance : new double[]{0, 1, 100}) {
            Vector3 expected = transform.transformPoint(ray.at(distance));
            Vector3 actual = transformed.at(distance);
            assertEquals(expected.x(), actual.x(), 1e-12);
            assertEquals(expected.y(), actual.y(), 1e-12);
            assertEquals(expected.z(), actual.z(), 1e-12);
        }
    }

    @Test
    void rotated_box_enclosure_includes_space_outside_the_original_shape() {
        // GIVEN
        AxisAlignedBox box = new AxisAlignedBox(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        RigidTransform3 transform = new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4), Vector3.ZERO);

        // WHEN
        AxisAlignedBox out = GeometryTransforms3.axisAlignedBox(transform, box);

        // THEN
        assertEquals(-Math.sqrt(2), out.min().x(), 1e-12);
        assertEquals(Math.sqrt(2), out.max().z(), 1e-12);
        assertTrue(transform.inverse().transformPoint(out.max()).x() > 1
                || transform.inverse().transformPoint(out.max()).z() > 1);
    }
}
