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

    private static void assertVector(Vector3 expected, Vector3 actual, double eps) {
        assertEquals(expected.x(), actual.x(), eps);
        assertEquals(expected.y(), actual.y(), eps);
        assertEquals(expected.z(), actual.z(), eps);
    }
}
