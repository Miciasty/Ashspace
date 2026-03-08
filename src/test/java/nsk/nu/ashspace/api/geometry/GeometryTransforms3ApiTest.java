package nsk.nu.ashspace.api.geometry;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class GeometryTransforms3ApiTest {

    @Test
    void transformed_aabb_contains_transformed_original_corners() {
        // GIVEN
        AxisAlignedBox box = new AxisAlignedBox(new Vector3(-1, -2, -3), new Vector3(2, 1, 0));
        RigidTransform3 transform = new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2.0),
                new Vector3(5, 0, 0)
        );

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
