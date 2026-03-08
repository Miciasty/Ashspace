package nsk.nu.ashspace.api.frame;

import nsk.nu.ashspace.api.transform.RigidTransform3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Frame3ApiTest {

    @Test
    void root_builder_creates_root_frame_with_identity_transform() {
        // GIVEN
        FrameId world = new FrameId("world");

        // WHEN
        Frame3 frame = Frame3.root(world);

        // THEN
        assertEquals(world, frame.id());
        assertNull(frame.parent());
        assertEquals(RigidTransform3.identity(), frame.parentFromFrame());
        assertTrue(frame.isRoot());
    }

    @Test
    void child_builder_creates_non_root_frame() {
        // GIVEN
        FrameId turret = new FrameId("turret");
        FrameId ship = new FrameId("ship");

        // WHEN
        Frame3 frame = Frame3.child(turret, ship, RigidTransform3.translation(1.0, 2.0, 3.0));

        // THEN
        assertEquals(turret, frame.id());
        assertEquals(ship, frame.parent());
        assertEquals(RigidTransform3.translation(1.0, 2.0, 3.0), frame.parentFromFrame());
    }

    @Test
    void invalid_frame_definitions_are_rejected() {
        // GIVEN
        FrameId id = new FrameId("a");

        // WHEN / THEN
        assertThrows(IllegalArgumentException.class,
                () -> new Frame3(id, id, RigidTransform3.identity()));
        assertThrows(IllegalArgumentException.class,
                () -> new Frame3(id, null, RigidTransform3.translation(1.0, 0.0, 0.0)));
    }
}
