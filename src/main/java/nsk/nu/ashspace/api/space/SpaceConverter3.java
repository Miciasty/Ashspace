package nsk.nu.ashspace.api.space;

import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.geometry.Ray;
import nsk.nu.ashcore.api.geometry.Segment3;
import nsk.nu.ashcore.api.geometry.Sphere;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.geometry.GeometryTransforms3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

/**
 * Frame-aware conversion utilities for points, vectors, and geometry.
 */
public final class SpaceConverter3 {
    private final FrameGraph3 frames;

    public SpaceConverter3(FrameGraph3 frames) {
        if (frames == null) throw new NullPointerException("frames");
        this.frames = frames;
    }

    /**
     * Underlying frame graph.
     */
    public FrameGraph3 frames() {
        return frames;
    }

    /**
     * Transform from source frame to target frame.
     */
    public RigidTransform3 transform(FrameId source, FrameId target) {
        return frames.transform(source, target);
    }

    /**
     * Convert point from source frame to target frame.
     */
    public Vector3 point(Vector3 point, FrameId source, FrameId target) {
        if (point == null) throw new NullPointerException("point");
        return transform(source, target).transformPoint(point);
    }

    /**
     * Convert vector from source frame to target frame.
     */
    public Vector3 vector(Vector3 vector, FrameId source, FrameId target) {
        if (vector == null) throw new NullPointerException("vector");
        return transform(source, target).transformVector(vector);
    }

    /**
     * Convert direction from source frame to target frame.
     */
    public Vector3 direction(Vector3 direction, FrameId source, FrameId target) {
        if (direction == null) throw new NullPointerException("direction");
        return transform(source, target).transformDirection(direction);
    }

    /**
     * Convert point from source frame to root frame.
     */
    public Vector3 toWorldPoint(FrameId source, Vector3 point) {
        if (point == null) throw new NullPointerException("point");
        return frames.rootFrom(source).transformPoint(point);
    }

    /**
     * Convert vector from source frame to root frame.
     */
    public Vector3 toWorldVector(FrameId source, Vector3 vector) {
        if (vector == null) throw new NullPointerException("vector");
        return frames.rootFrom(source).transformVector(vector);
    }

    /**
     * Convert direction from source frame to root frame.
     */
    public Vector3 toWorldDirection(FrameId source, Vector3 direction) {
        if (direction == null) throw new NullPointerException("direction");
        return frames.rootFrom(source).transformDirection(direction);
    }

    /**
     * Convert point from root frame to target frame.
     */
    public Vector3 fromWorldPoint(FrameId target, Vector3 worldPoint) {
        if (worldPoint == null) throw new NullPointerException("worldPoint");
        return frames.rootFrom(target).inverse().transformPoint(worldPoint);
    }

    /**
     * Convert vector from root frame to target frame.
     */
    public Vector3 fromWorldVector(FrameId target, Vector3 worldVector) {
        if (worldVector == null) throw new NullPointerException("worldVector");
        return frames.rootFrom(target).inverse().transformVector(worldVector);
    }

    /**
     * Convert direction from root frame to target frame.
     */
    public Vector3 fromWorldDirection(FrameId target, Vector3 worldDirection) {
        if (worldDirection == null) throw new NullPointerException("worldDirection");
        return frames.rootFrom(target).inverse().transformDirection(worldDirection);
    }

    /**
     * Convert ray from source frame to target frame.
     */
    public Ray ray(Ray ray, FrameId source, FrameId target) {
        if (ray == null) throw new NullPointerException("ray");
        return GeometryTransforms3.ray(transform(source, target), ray);
    }

    /**
     * Convert segment from source frame to target frame.
     */
    public Segment3 segment(Segment3 segment, FrameId source, FrameId target) {
        if (segment == null) throw new NullPointerException("segment");
        return GeometryTransforms3.segment(transform(source, target), segment);
    }

    /**
     * Convert AABB from source frame to target frame.
     */
    public AxisAlignedBox axisAlignedBox(AxisAlignedBox box, FrameId source, FrameId target) {
        if (box == null) throw new NullPointerException("box");
        return GeometryTransforms3.axisAlignedBox(transform(source, target), box);
    }

    /**
     * Convert sphere from source frame to target frame.
     */
    public Sphere sphere(Sphere sphere, FrameId source, FrameId target) {
        if (sphere == null) throw new NullPointerException("sphere");
        return GeometryTransforms3.sphere(transform(source, target), sphere);
    }
}
