package nsk.nu.ashspace.api.geometry;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.geometry.Ray;
import nsk.nu.ashcore.api.geometry.Segment3;
import nsk.nu.ashcore.api.geometry.Sphere;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

/**
 * Geometry adapters for applying rigid transforms to Ashcore geometry primitives.
 */
public final class GeometryTransforms3 {
    private GeometryTransforms3() {
    }

    /**
     * Transform a ray.
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
     * Transform an AABB and return an axis-aligned box containing the transformed corners.
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
}
