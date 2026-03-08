package nsk.nu.ashspace.api.space;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.geometry.Ray;
import nsk.nu.ashcore.api.geometry.Segment3;
import nsk.nu.ashcore.api.geometry.Sphere;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SpaceConverter3ApiTest {

    @Test
    void point_and_geometry_conversion_follow_frame_transform() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId world = graph.root();
        FrameId local = new FrameId("local");
        graph.define(local, world, new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2.0),
                new Vector3(10, 0, 0)
        ));

        SpaceConverter3 converter = new SpaceConverter3(graph);
        Vector3 point = new Vector3(1, 0, 0);

        // WHEN
        Vector3 worldPoint = converter.point(point, local, world);
        Vector3 back = converter.point(worldPoint, world, local);
        Vector3 worldVector = converter.toWorldVector(local, new Vector3(1, 0, 0));
        Vector3 localVector = converter.fromWorldVector(local, worldVector);
        Vector3 worldDirection = converter.toWorldDirection(local, new Vector3(0, 0, 1));
        Vector3 localDirection = converter.fromWorldDirection(local, worldDirection);

        Ray ray = new Ray(Vector3.ZERO, new Vector3(1, 0, 0));
        Ray worldRay = converter.ray(ray, local, world);

        Sphere sphere = new Sphere(new Vector3(2, 0, 0), 3.0);
        Sphere worldSphere = converter.sphere(sphere, local, world);
        Segment3 segment = new Segment3(new Vector3(0, 0, 0), new Vector3(1, 0, 0));
        Segment3 worldSegment = converter.segment(segment, local, world);
        AxisAlignedBox worldAabb = converter.axisAlignedBox(
                new AxisAlignedBox(new Vector3(-1, -1, -1), new Vector3(1, 1, 1)),
                local,
                world
        );

        // THEN
        assertVector(new Vector3(10, 0, -1), worldPoint, 1e-9);
        assertVector(point, back, 1e-9);
        assertVector(worldPoint, converter.toWorldPoint(local, point), 1e-9);
        assertVector(point, converter.fromWorldPoint(local, worldPoint), 1e-9);
        assertVector(new Vector3(0, 0, -1), worldVector, 1e-9);
        assertVector(new Vector3(1, 0, 0), localVector, 1e-9);
        assertVector(new Vector3(1, 0, 0), worldDirection, 1e-9);
        assertVector(new Vector3(0, 0, 1), localDirection, 1e-9);
        assertVector(new Vector3(10, 0, 0), worldRay.origin(), 1e-9);
        assertVector(new Vector3(0, 0, -1), worldRay.direction(), 1e-9);
        assertVector(new Vector3(10, 0, -2), worldSphere.center(), 1e-9);
        assertEquals(3.0, worldSphere.radius(), 1e-12);
        assertVector(new Vector3(10, 0, 0), worldSegment.a(), 1e-9);
        assertVector(new Vector3(10, 0, -1), worldSegment.b(), 1e-9);
        assertVector(new Vector3(9, -1, -1), worldAabb.min(), 1e-9);
        assertVector(new Vector3(11, 1, 1), worldAabb.max(), 1e-9);
    }

    private static void assertVector(Vector3 expected, Vector3 actual, double eps) {
        assertEquals(expected.x(), actual.x(), eps);
        assertEquals(expected.y(), actual.y(), eps);
        assertEquals(expected.z(), actual.z(), eps);
    }
}
