package nsk.nu.ashspace.api.transform;

import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;

/**
 * Immutable rigid transform in 3D (rotation + translation, no scale).
 * Applies to points as: {@code p' = R * p + t}.
 * <p>Uses Ashcore normalization. The all-zero quaternion means identity for compatibility.
 * Otherwise the computed squared norm must be finite and at least Double.MIN_NORMAL;
 * rotations outside that range are rejected before normalization. The resulting squared
 * norm must differ from one by at most 1e-12 (an absolute, dimensionless tolerance).</p>
 * <p>Points, vectors, translation and results must be finite. Arithmetic overflow throws
 * IllegalArgumentException; finite rounding still limits accuracy, especially after
 * large translations or long composition chains. Directions are not renormalized.</p>
 */
public record RigidTransform3(Quaternion rotation, Vector3 translation) {

    public RigidTransform3 {
        if (rotation == null) throw new NullPointerException("rotation");
        if (translation == null) throw new NullPointerException("translation");
        requireFinite(rotation.w(), "rotation.w");
        requireFinite(rotation.x(), "rotation.x");
        requireFinite(rotation.y(), "rotation.y");
        requireFinite(rotation.z(), "rotation.z");
        requireFinite(translation.x(), "translation.x");
        requireFinite(translation.y(), "translation.y");
        requireFinite(translation.z(), "translation.z");
        boolean zero = rotation.w() == 0.0 && rotation.x() == 0.0
                && rotation.y() == 0.0 && rotation.z() == 0.0;
        double normSquared = normSquared(rotation);
        if (!zero && (!Double.isFinite(normSquared) || normSquared < Double.MIN_NORMAL)) {
            throw new IllegalArgumentException("rotation outside supported normalization range");
        }
        rotation = rotation.normalized();
        double normalizedNormSquared = normSquared(rotation);
        if (!Double.isFinite(normalizedNormSquared) || Math.abs(normalizedNormSquared - 1.0) > 1e-12) {
            throw new IllegalArgumentException("rotation normalization did not produce a unit quaternion");
        }
    }

    /**
     * Identity transform.
     */
    public static RigidTransform3 identity() {
        return new RigidTransform3(Quaternion.identity(), Vector3.ZERO);
    }

    /**
     * Pure translation.
     */
    public static RigidTransform3 translation(Vector3 delta) {
        return new RigidTransform3(Quaternion.identity(), delta);
    }

    /**
     * Pure translation.
     */
    public static RigidTransform3 translation(double x, double y, double z) {
        return translation(new Vector3(x, y, z));
    }

    /**
     * Transform point (rotation + translation).
     */
    public Vector3 transformPoint(Vector3 point) {
        if (point == null) throw new NullPointerException("point");
        requireFinite(point, "point");
        return requireFinite(rotation.rotate(point).add(translation), "transformed point");
    }

    /**
     * Transform vector (rotation only).
     */
    public Vector3 transformVector(Vector3 vector) {
        if (vector == null) throw new NullPointerException("vector");
        requireFinite(vector, "vector");
        return requireFinite(rotation.rotate(vector), "transformed vector");
    }

    /**
     * Transform direction (rotation only).
     */
    public Vector3 transformDirection(Vector3 direction) {
        return transformVector(direction);
    }

    /**
     * Composition that applies this transform first, then {@code after}.
     */
    public RigidTransform3 then(RigidTransform3 after) {
        if (after == null) throw new NullPointerException("after");
        Quaternion composedRotation = after.rotation.mul(this.rotation).normalized();
        Vector3 composedTranslation = after.rotation.rotate(this.translation).add(after.translation);
        return new RigidTransform3(composedRotation, composedTranslation);
    }

    /**
     * Inverse rigid transform.
     */
    public RigidTransform3 inverse() {
        Quaternion inverseRotation = conjugate(rotation).normalized();
        Vector3 inverseTranslation = inverseRotation.rotate(translation.mul(-1.0));
        return new RigidTransform3(inverseRotation, inverseTranslation);
    }

    private static Quaternion conjugate(Quaternion q) {
        return new Quaternion(q.w(), -q.x(), -q.y(), -q.z());
    }

    private static double normSquared(Quaternion q) {
        return q.w() * q.w() + q.x() * q.x() + q.y() * q.y() + q.z() * q.z();
    }

    private static Vector3 requireFinite(Vector3 value, String name) {
        requireFinite(value.x(), name + ".x");
        requireFinite(value.y(), name + ".y");
        requireFinite(value.z(), name + ".z");
        return value;
    }

    private static void requireFinite(double value, String name) {
        if (!Double.isFinite(value)) {
            throw new IllegalArgumentException(name + " must be finite");
        }
    }
}
