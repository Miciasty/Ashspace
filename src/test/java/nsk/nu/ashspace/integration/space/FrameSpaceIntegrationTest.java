package nsk.nu.ashspace.integration.space;

import nsk.nu.ashcore.api.geometry.Ray;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.space.SpaceConverter3;
import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FrameSpaceIntegrationTest {

    @Test
    void chained_frames_produce_stable_world_and_back_conversions() {
        // GIVEN
        FrameGraph3 graph = FrameGraph3.worldRoot();
        FrameId world = graph.root();
        FrameId ship = new FrameId("ship");
        FrameId turret = new FrameId("turret");

        graph.define(ship, world, new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2.0),
                new Vector3(10, 0, -4)
        ));
        graph.define(turret, ship, RigidTransform3.translation(0, 2, 0));

        SpaceConverter3 converter = new SpaceConverter3(graph);
        Vector3 localPoint = new Vector3(1, 0, 0);
        Ray localRay = new Ray(Vector3.ZERO, new Vector3(1, 0, 0));

        // WHEN
        Vector3 worldPointA = converter.point(localPoint, turret, world);
        Vector3 worldPointB = converter.point(localPoint, turret, world);
        Vector3 localRoundTrip = converter.point(worldPointA, world, turret);
        Ray worldRay = converter.ray(localRay, turret, world);

        // THEN
        assertVector(worldPointA, worldPointB, 1e-12);
        assertVector(localPoint, localRoundTrip, 1e-9);
        assertVector(new Vector3(10, 2, -5), worldPointA, 1e-9);
        assertVector(new Vector3(10, 2, -4), worldRay.origin(), 1e-9);
        assertVector(new Vector3(0, 0, -1), worldRay.direction(), 1e-9);
    }

    private static void assertVector(Vector3 expected, Vector3 actual, double eps) {
        assertEquals(expected.x(), actual.x(), eps);
        assertEquals(expected.y(), actual.y(), eps);
        assertEquals(expected.z(), actual.z(), eps);
    }
}
