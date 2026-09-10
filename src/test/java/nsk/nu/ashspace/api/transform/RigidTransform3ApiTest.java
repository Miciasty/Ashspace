package nsk.nu.ashspace.api.transform;

import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RigidTransform3ApiTest {

    @Test
    void identity_doesNotChange_points_or_vectors() {
        // GIVEN
        RigidTransform3 id = RigidTransform3.identity();
        Vector3 p = new Vector3(1.5, -2.0, 3.25);
        Vector3 v = new Vector3(-4.0, 5.0, 6.0);

        // WHEN
        Vector3 pOut = id.transformPoint(p);
        Vector3 vOut = id.transformVector(v);

        // THEN
        assertVector(p, pOut, 1e-12);
        assertVector(v, vOut, 1e-12);
    }

    @Test
    void compose_matches_sequential_application() {
        // GIVEN
        RigidTransform3 a = new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2.0),
                new Vector3(2.0, 0.0, 0.0)
        );
        RigidTransform3 b = new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2.0),
                new Vector3(0.0, 3.0, 0.0)
        );
        Vector3 p = new Vector3(1.0, 2.0, 3.0);

        // WHEN
        Vector3 sequential = b.transformPoint(a.transformPoint(p));
        Vector3 composed = a.then(b).transformPoint(p);

        // THEN
        assertVector(sequential, composed, 1e-9);
    }

    @Test
    void inverse_restores_original_point() {
        // GIVEN
        RigidTransform3 t = new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(1, 2, 3), 0.73),
                new Vector3(7.0, -4.0, 2.5)
        );
        Vector3 p = new Vector3(-3.0, 2.0, 9.0);

        // WHEN
        Vector3 transformed = t.transformPoint(p);
        Vector3 restored = t.inverse().transformPoint(transformed);

        // THEN
        assertVector(p, restored, 1e-9);
    }

    @Test
    void non_finite_values_are_rejected() {
        // GIVEN / WHEN / THEN
        assertThrows(IllegalArgumentException.class, () ->
                new RigidTransform3(Quaternion.identity(), new Vector3(Double.NaN, 0, 0))
        );
        assertThrows(IllegalArgumentException.class, () ->
                new RigidTransform3(new Quaternion(Double.POSITIVE_INFINITY, 0, 0, 0), Vector3.ZERO)
        );
    }

    @Test
    void rotations_outside_the_normalization_range_are_rejected() {
        // GIVEN / WHEN / THEN
        for (double component : new double[]{Double.MAX_VALUE, 1e200, 1e-160, Double.MIN_VALUE}) {
            assertThrows(IllegalArgumentException.class, () ->
                    new RigidTransform3(new Quaternion(component, component, 0, 0), Vector3.ZERO));
        }
    }

    @Test
    void zero_rotation_retains_the_identity_convention() {
        // GIVEN
        RigidTransform3 transform = new RigidTransform3(new Quaternion(0, 0, 0, 0), new Vector3(3, 4, 5));
        Vector3 vector = new Vector3(1, 2, 3);

        // WHEN / THEN
        assertVector(vector, transform.transformDirection(vector), 1e-12);
        assertVector(new Vector3(4, 6, 8), transform.transformPoint(vector), 1e-12);
    }

    @Test
    void supported_rotation_magnitudes_preserve_length_and_inverse() {
        // GIVEN
        Vector3 vector = new Vector3(3, -4, 12);
        for (double scale : new double[]{1e-150, 0.5, 1.0, 1e150}) {
            RigidTransform3 transform = new RigidTransform3(
                    new Quaternion(scale, -scale, scale, scale), new Vector3(10, -2, 7));

            // WHEN
            Vector3 rotated = transform.transformVector(vector);
            Vector3 restored = transform.inverse().transformPoint(transform.transformPoint(vector));

            // THEN
            assertEquals(13.0, rotated.length(), 1e-12);
            assertVector(vector, restored, 1e-12);
            assertVector(vector, transform.then(transform.inverse()).transformDirection(vector), 1e-12);
        }
    }

    @Test
    void transform_operations_reject_non_finite_input_and_overflow() {
        // GIVEN
        RigidTransform3 transform = RigidTransform3.translation(Double.MAX_VALUE, 0, 0);

        // WHEN / THEN
        assertThrows(IllegalArgumentException.class, () -> transform.transformPoint(new Vector3(Double.MAX_VALUE, 0, 0)));
        assertThrows(IllegalArgumentException.class, () -> transform.transformVector(new Vector3(Double.NaN, 0, 0)));
        assertThrows(IllegalArgumentException.class, () -> transform.transformDirection(new Vector3(0, Double.POSITIVE_INFINITY, 0)));
        assertThrows(IllegalArgumentException.class, () -> transform.then(transform));
    }

    private static void assertVector(Vector3 expected, Vector3 actual, double eps) {
        assertEquals(expected.x(), actual.x(), eps);
        assertEquals(expected.y(), actual.y(), eps);
        assertEquals(expected.z(), actual.z(), eps);
    }
}
