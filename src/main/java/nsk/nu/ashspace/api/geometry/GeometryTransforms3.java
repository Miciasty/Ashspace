package nsk.nu.ashspace.api.geometry;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.geometry.Capsule;
import nsk.nu.ashcore.api.geometry.OrientedBox;
import nsk.nu.ashcore.api.geometry.Ray;
import nsk.nu.ashcore.api.geometry.Segment3;
import nsk.nu.ashcore.api.geometry.Sphere;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

/**
 * Geometry adapters for applying rigid transforms to Ashcore geometry primitives.
 * <p>Coordinates and lengths use the same units before and after conversion. Each
 * operation takes O(1) time and additional memory and returns an immutable value.
 * Null arguments throw NullPointerException; non-finite coordinates or results
 * throw IllegalArgumentException. Shape preservation is subject to double rounding,
 * especially at large translations or tiny extents; no uniform error bound is promised.</p>
 */
public final class GeometryTransforms3 {
    private GeometryTransforms3() {
    }

    /**
     * Transform a ray with finite origin and finite, unit, non-zero direction.
     * Ashcore's Ray constructor normalizes the rotated direction again. The ray
     * parameter remains distance in the same units, within floating-point rounding.
     */
    public static Ray ray(RigidTransform3 transform, Ray ray) {
        if (transform == null) throw new NullPointerException("transform");
        if (ray == null) throw new NullPointerException("ray");
        return new Ray(
                transform.transformPoint(ray.origin()),
                transform.transformDirection(ray.direction())
        );
    }

    /**
     * Transform a segment.
     */
    public static Segment3 segment(RigidTransform3 transform, Segment3 segment) {
        if (transform == null) throw new NullPointerException("transform");
        if (segment == null) throw new NullPointerException("segment");
        return new Segment3(
                transform.transformPoint(segment.a()),
                transform.transformPoint(segment.b())
        );
    }

    /**
     * Transform a sphere (radius preserved for rigid transforms).
     */
    public static Sphere sphere(RigidTransform3 transform, Sphere sphere) {
        if (transform == null) throw new NullPointerException("transform");
        if (sphere == null) throw new NullPointerException("sphere");
        return new Sphere(
                transform.transformPoint(sphere.center()),
                sphere.radius()
        );
    }

    /**
     * Transform both capsule endpoints, preserving the radius exactly.
     * Equal endpoints (a sphere) and zero radius (a segment or point) are supported.
     * The result describes the same rigidly moved shape within coordinate rounding.
     */
    public static Capsule capsule(RigidTransform3 transform, Capsule capsule) {
        if (transform == null) throw new NullPointerException("transform");
        if (capsule == null) throw new NullPointerException("capsule");
        return new Capsule(
                transform.transformPoint(capsule.a()),
                transform.transformPoint(capsule.b()),
                capsule.radius()
        );
    }

    /**
     * Convert a finite AABB to an oriented box preserving its rotated shape within
     * rounding, instead of enclosing it in a new AABB. Zero extents are supported.
     * Half extents are rounded halves of the source side lengths; tiny extents may
     * underflow to zero. The orientation maps source box axes into the target frame.
     */
    public static OrientedBox orientedBox(RigidTransform3 transform, AxisAlignedBox box) {
        if (transform == null) throw new NullPointerException("transform");
        if (box == null) throw new NullPointerException("box");
        Vector3 halfExtents = new Vector3(
                halfExtent(box.min().x(), box.max().x()),
                halfExtent(box.min().y(), box.max().y()),
                halfExtent(box.min().z(), box.max().z())
        );
        return new OrientedBox(
                transform.transformPoint(box.min().add(halfExtents)),
                halfExtents,
                transform.rotation()
        );
    }

    /**
     * Transform an OBB center and rotate its orientation, preserving half extents
     * exactly. Box-local rotation is applied first, then the supplied transform.
     * Zero extents remain valid; Ashcore normalizes the composed orientation.
     */
    public static OrientedBox orientedBox(RigidTransform3 transform, OrientedBox box) {
        if (transform == null) throw new NullPointerException("transform");
        if (box == null) throw new NullPointerException("box");
        return new OrientedBox(
                transform.transformPoint(box.center()),
                box.halfExtents(),
                transform.rotation().mul(box.orientation())
        );
    }

    /**
     * Transform an AABB and return an axis-aligned box containing the transformed corners.
     * This is a conservative enclosure, not the exact rotated shape. The containment
     * guarantee concerns the eight computed corners; no exact-arithmetic error bound
     * or minimal intersected-cell set is promised. Non-finite results are rejected.
     */
    public static AxisAlignedBox axisAlignedBox(RigidTransform3 transform, AxisAlignedBox box) {
        if (transform == null) throw new NullPointerException("transform");
        if (box == null) throw new NullPointerException("box");

        Vector3 min = box.min();
        Vector3 max = box.max();

        double minX = Double.POSITIVE_INFINITY;
        double minY = Double.POSITIVE_INFINITY;
        double minZ = Double.POSITIVE_INFINITY;
        double maxX = Double.NEGATIVE_INFINITY;
        double maxY = Double.NEGATIVE_INFINITY;
        double maxZ = Double.NEGATIVE_INFINITY;

        for (int mask = 0; mask < 8; mask++) {
            double x = ((mask & 1) == 0) ? min.x() : max.x();
            double y = ((mask & 2) == 0) ? min.y() : max.y();
            double z = ((mask & 4) == 0) ? min.z() : max.z();
            Vector3 p = transform.transformPoint(new Vector3(x, y, z));

            minX = Math.min(minX, p.x());
            minY = Math.min(minY, p.y());
            minZ = Math.min(minZ, p.z());
            maxX = Math.max(maxX, p.x());
            maxY = Math.max(maxY, p.y());
            maxZ = Math.max(maxZ, p.z());
        }

        return new AxisAlignedBox(
                new Vector3(minX, minY, minZ),
                new Vector3(maxX, maxY, maxZ)
        );
    }

    private static double halfExtent(double min, double max) {
        if (!Double.isFinite(min) || !Double.isFinite(max)) {
            throw new IllegalArgumentException("box bounds must be finite");
        }
        double extent = max - min;
        // Opposite large bounds can have a representable half extent but an infinite difference.
        return Double.isFinite(extent) ? extent * 0.5 : max * 0.5 - min * 0.5;
    }
}
