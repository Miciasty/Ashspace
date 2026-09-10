package nsk.nu.ashspace.api.frame;

import nsk.nu.ashspace.api.transform.RigidTransform3;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Mutable frame graph for deterministic conversion between coordinate frames.
 *
 * <p>Each non-root frame stores a transform to its parent. The graph must remain acyclic.</p>
 * <p>This class is not thread-safe. The caller must keep the graph unchanged during
 * a complete multi-step query, including all conversions and geometry queries that
 * need the same frame state. External synchronization must include writers.</p>
 * <p>Returned definitions and transforms are immutable snapshots. A converter retains
 * this live graph; later conversions observe later definitions. Floating-point
 * accumulation loses precision as translation magnitudes and chain depth grow.</p>
 */
public final class FrameGraph3 {

    private final FrameId root;
    private final Map<FrameId, Node> nodes = new LinkedHashMap<>();

    private record Node(FrameId parent, RigidTransform3 parentFromFrame) {
    }

    private record RootAccumulation(FrameId root, RigidTransform3 rootFromFrame) {
    }

    /**
     * Create graph with explicit root frame.
     */
    public FrameGraph3(FrameId root) {
        if (root == null) throw new NullPointerException("root");
        this.root = root;
        nodes.put(root, new Node(null, RigidTransform3.identity()));
    }

    /**
     * Create graph with default {@code world} root.
     */
    public static FrameGraph3 worldRoot() {
        return new FrameGraph3(new FrameId("world"));
    }

    /**
     * Root frame id.
     */
    public FrameId root() {
        return root;
    }

    /**
     * Number of currently defined frames.
     */
    public int size() {
        return nodes.size();
    }

    /**
     * True if frame exists in this graph.
     */
    public boolean contains(FrameId frame) {
        if (frame == null) throw new NullPointerException("frame");
        return nodes.containsKey(frame);
    }

    /**
     * Parent frame id of an existing frame. Empty for the root.
     */
    public Optional<FrameId> parentOf(FrameId frame) {
        Node node = requireNode(frame, "frame");
        return Optional.ofNullable(node.parent);
    }

    /**
     * Immutable frame definition snapshot for a given id.
     */
    public Frame3 frame(FrameId frame) {
        Node node = requireNode(frame, "frame");
        return toFrame(frame, node);
    }

    /**
     * Immutable snapshot of all frame definitions, in first-definition order.
     * Updating or reparenting a frame keeps its position in that order.
     */
    public Map<FrameId, Frame3> frames() {
        LinkedHashMap<FrameId, Frame3> out = new LinkedHashMap<>(nodes.size());
        nodes.forEach((id, node) -> out.put(id, toFrame(id, node)));
        return Collections.unmodifiableMap(out);
    }

    /**
     * Register or update a frame with transform to an existing parent.
     * Reparenting keeps descendants attached to this frame and interprets the supplied
     * transform in the new parent, without preserving the old world pose.
     * Missing parents, root redefinition and cycles are rejected without changing state.
     */
    public void define(FrameId frame, FrameId parent, RigidTransform3 parentFromFrame) {
        if (frame == null) throw new NullPointerException("frame");
        if (parent == null) throw new NullPointerException("parent");
        if (parentFromFrame == null) throw new NullPointerException("parentFromFrame");
        if (frame.equals(root)) {
            throw new IllegalArgumentException("cannot redefine root frame");
        }
        if (!nodes.containsKey(parent)) {
            throw new IllegalArgumentException("parent frame is not defined: " + parent);
        }
        if (createsCycle(frame, parent)) {
            throw new IllegalArgumentException("frame definition would create a cycle: " + frame + " -> " + parent);
        }
        nodes.put(frame, new Node(parent, parentFromFrame));
    }

    /**
     * Transform from frame to root.
     * Walks the parent chain in O(h) time, where h is frame depth, with O(1) live
     * additional memory and O(h) cumulative temporary allocations. Unknown frames fail.
     */
    public RigidTransform3 rootFrom(FrameId frame) {
        return accumulateToRoot(frame).rootFromFrame;
    }

    /**
     * Transform coordinates from {@code source} frame to {@code target} frame.
     * Both frames must exist, even when their identifiers are equal. Cost is
     * O(hSource + hTarget) time with O(1) live additional memory.
     */
    public RigidTransform3 transform(FrameId source, FrameId target) {
        if (source == null) throw new NullPointerException("source");
        if (target == null) throw new NullPointerException("target");
        if (source.equals(target)) {
            requireNode(source, "source");
            return RigidTransform3.identity();
        }

        RootAccumulation src = accumulateToRoot(source);
        RootAccumulation dst = accumulateToRoot(target);
        if (!src.root.equals(dst.root)) {
            throw new IllegalStateException("frames are not connected to the same root: " + source + " and " + target);
        }
        return src.rootFromFrame.then(dst.rootFromFrame.inverse());
    }

    private RootAccumulation accumulateToRoot(FrameId frame) {
        requireNode(frame, "frame");
        FrameId cursor = frame;
        RigidTransform3 rootFromFrame = RigidTransform3.identity();
        int guard = nodes.size() + 1;

        while (true) {
            if (--guard < 0) {
                throw new IllegalStateException("frame graph contains a cycle");
            }
            Node node = nodes.get(cursor);
            if (node.parent == null) {
                return new RootAccumulation(cursor, rootFromFrame);
            }
            rootFromFrame = rootFromFrame.then(node.parentFromFrame);
            cursor = node.parent;
        }
    }

    private boolean createsCycle(FrameId frame, FrameId parent) {
        FrameId cursor = parent;
        int guard = nodes.size() + 1;
        while (cursor != null) {
            if (--guard < 0) return true;
            if (cursor.equals(frame)) return true;
            Node node = nodes.get(cursor);
            if (node == null) return false;
            cursor = node.parent;
        }
        return false;
    }

    private Node requireNode(FrameId frame, String name) {
        if (frame == null) throw new NullPointerException(name);
        Node node = nodes.get(frame);
        if (node == null) {
            throw new IllegalArgumentException("unknown frame: " + frame);
        }
        return node;
    }

    private static Frame3 toFrame(FrameId id, Node node) {
        if (node.parent == null) {
            return Frame3.root(id);
        }
        return Frame3.child(id, node.parent, node.parentFromFrame);
    }
}
