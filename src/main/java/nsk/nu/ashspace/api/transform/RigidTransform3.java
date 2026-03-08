package nsk.nu.ashspace.api.transform;

import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;

/**
 * Immutable rigid transform in 3D (rotation + translation, no scale).
 * Applies to points as: {@code p' = R * p + t}.
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
        rotation = rotation.normalized();
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
        return rotation.rotate(point).add(translation);
    }

    /**
     * Transform vector (rotation only).
     */
    public Vector3 transformVector(Vector3 vector) {
        if (vector == null) throw new NullPointerException("vector");
        return rotation.rotate(vector);
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

    private static void requireFinite(double value, String name) {
        if (!Double.isFinite(value)) {
            throw new IllegalArgumentException(name + " must be finite");
        }
    }
}
