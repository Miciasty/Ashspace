package nsk.nu.ashspace.api.frame;

import nsk.nu.ashspace.api.transform.RigidTransform3;

/**
 * Immutable frame definition in a parent-linked hierarchy.
 *
 * <p>{@code parentFromFrame} maps coordinates from this frame into the parent frame.</p>
 */
public record Frame3(FrameId id, FrameId parent, RigidTransform3 parentFromFrame) {

    public Frame3 {
        if (id == null) throw new NullPointerException("id");
        if (parentFromFrame == null) throw new NullPointerException("parentFromFrame");
        if (parent != null && id.equals(parent)) {
            throw new IllegalArgumentException("frame cannot be parent of itself: " + id);
        }
        if (parent == null && !RigidTransform3.identity().equals(parentFromFrame)) {
            throw new IllegalArgumentException("root frame must use identity transform");
        }
    }

    /**
     * Root frame definition.
     */
    public static Frame3 root(FrameId id) {
        return new Frame3(id, null, RigidTransform3.identity());
    }

    /**
     * Non-root frame definition.
     */
    public static Frame3 child(FrameId id, FrameId parent, RigidTransform3 parentFromFrame) {
        if (parent == null) throw new NullPointerException("parent");
        return new Frame3(id, parent, parentFromFrame);
    }

    /**
     * True for root frame.
     */
    public boolean isRoot() {
        return parent == null;
    }
}
