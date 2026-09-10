package nsk.nu.ashspace.api.frame;

import nsk.nu.ashspace.api.transform.RigidTransform3;

import java.util.Collections;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Frame graph for deterministic conversion between coordinate frames.
 *
 * <p>Each non-root frame stores a transform to its parent. The graph must remain acyclic.</p>
 * <p>New graphs are mutable and not thread-safe. The caller must keep the graph unchanged during
 * a complete multi-step query, including all conversions and geometry queries that
 * need the same frame state. External synchronization must include writers.</p>
 * <p>Returned definitions and transforms are immutable snapshots. A converter retains
 * this live graph; later conversions observe later definitions. Floating-point
 * accumulation loses precision as translation magnitudes and chain depth grow.</p>
 * <p>{@link #snapshot()} creates a frozen graph usable by the same converters.
 * Snapshots support concurrent reads after safe publication and reject all mutations.</p>
 */
public final class FrameGraph3 {

    private final FrameId root;
    private final Map<FrameId, Node> nodes;
    private final boolean snapshot;

    private record Node(FrameId parent, RigidTransform3 parentFromFrame) {
    }

    /**
     * Create graph with explicit root frame.
     */
    public FrameGraph3(FrameId root) {
        if (root == null) throw new NullPointerException("root");
        this.root = root;
        this.nodes = new LinkedHashMap<>();
        this.snapshot = false;
        nodes.put(root, new Node(null, RigidTransform3.identity()));
    }

    private FrameGraph3(FrameGraph3 source) {
        this.root = source.root;
        this.nodes = Collections.unmodifiableMap(new LinkedHashMap<>(source.nodes));
        this.snapshot = true;
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
     * True when this graph is a frozen snapshot and all mutations are unsupported.
     */
    public boolean isSnapshot() {
        return snapshot;
    }

    /**
     * Freeze the current definitions, retaining insertion order, in O(n) time and memory.
     * The source must stay unchanged while copying. Later source mutations have no effect
     * on the result. Calling this on a snapshot returns the same instance in O(1).
     * No world transforms are precomputed, so local queries can avoid overflowing ancestors.
     */
    public FrameGraph3 snapshot() {
        return snapshot ? this : new FrameGraph3(this);
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
     * On a snapshot this throws UnsupportedOperationException.
     */
    public void define(FrameId frame, FrameId parent, RigidTransform3 parentFromFrame) {
        requireMutable();
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
     * Remove an existing non-root leaf. Root, unknown frames and frames with children
     * are rejected with IllegalArgumentException without changing state; null throws
     * NullPointerException. On a snapshot this throws UnsupportedOperationException.
     * Surviving frames retain insertion order; defining a removed id appends it anew.
     * Cost is O(n) time and O(1) additional memory for n defined frames.
     */
    public void remove(FrameId frame) {
        requireMutable();
        requireRemovable(frame);
        for (Node node : nodes.values()) {
            if (frame.equals(node.parent)) {
                throw new IllegalArgumentException("frame has children: " + frame);
            }
        }
        nodes.remove(frame);
    }

    /**
     * Remove an existing non-root frame and all its descendants, returning the count
     * including that frame. Root and unknown frames are rejected with IllegalArgumentException;
     * null throws NullPointerException. On a snapshot this throws UnsupportedOperationException.
     * Surviving definitions and their order stay unchanged. Cost is O(n) expected time
     * and O(n) additional memory; traversal is iterative even for deep subtrees.
     */
    public int removeSubtree(FrameId frame) {
        requireMutable();
        requireRemovable(frame);
        Map<FrameId, List<FrameId>> children = new HashMap<>();
        nodes.forEach((id, node) -> {
            if (node.parent != null) {
                children.computeIfAbsent(node.parent, ignored -> new ArrayList<>()).add(id);
            }
        });
        ArrayDeque<FrameId> pending = new ArrayDeque<>();
        pending.add(frame);
        int removed = 0;
        while (!pending.isEmpty()) {
            FrameId id = pending.removeFirst();
            List<FrameId> descendants = children.get(id);
            if (descendants != null) pending.addAll(descendants);
            nodes.remove(id);
            removed++;
        }
        return removed;
    }

    /**
     * Transform from frame to root.
     * Walks the parent chain in O(h) time, where h is frame depth, with O(1) live
     * additional memory and O(h) cumulative temporary allocations. Unknown frames fail.
     */
    public RigidTransform3 rootFrom(FrameId frame) {
        requireNode(frame, "frame");
        return accumulateToAncestor(frame, root);
    }

    /**
     * Transform coordinates from {@code source} frame to {@code target} frame.
     * Both frames must exist, even when their identifiers are equal. Cost is
     * O(hSource + hTarget) time with O(1) live additional memory.
     * Parent links are inspected to find the nearest common ancestor. Only edges below
     * that ancestor are composed, avoiding precision loss from a shared world offset.
     * Coordinates already rounded in world space cannot regain lost precision.
     */
    public RigidTransform3 transform(FrameId source, FrameId target) {
        requireNode(source, "source");
        requireNode(target, "target");
        if (source.equals(target)) return RigidTransform3.identity();

        FrameId ancestor = commonAncestor(source, target);
        RigidTransform3 ancestorFromSource = accumulateToAncestor(source, ancestor);
        if (target.equals(ancestor)) return ancestorFromSource;
        RigidTransform3 targetFromAncestor = accumulateToAncestor(target, ancestor).inverse();
        if (source.equals(ancestor)) return targetFromAncestor;
        return ancestorFromSource.then(targetFromAncestor);
    }

    private FrameId commonAncestor(FrameId source, FrameId target) {
        int sourceDepth = depth(source);
        int targetDepth = depth(target);
        while (sourceDepth > targetDepth) {
            source = nodes.get(source).parent;
            sourceDepth--;
        }
        while (targetDepth > sourceDepth) {
            target = nodes.get(target).parent;
            targetDepth--;
        }
        while (!source.equals(target)) {
            source = nodes.get(source).parent;
            target = nodes.get(target).parent;
        }
        return source;
    }

    private int depth(FrameId frame) {
        int depth = 0;
        while (!frame.equals(root)) {
            if (++depth >= nodes.size()) throw new IllegalStateException("frame graph contains a cycle");
            frame = nodes.get(frame).parent;
        }
        return depth;
    }

    private RigidTransform3 accumulateToAncestor(FrameId frame, FrameId ancestor) {
        FrameId cursor = frame;
        RigidTransform3 ancestorFromFrame = RigidTransform3.identity();
        int guard = nodes.size();

        while (!cursor.equals(ancestor)) {
            if (--guard < 0) {
                throw new IllegalStateException("frame graph contains a cycle");
            }
            Node node = nodes.get(cursor);
            ancestorFromFrame = ancestorFromFrame.then(node.parentFromFrame);
            cursor = node.parent;
        }
        return ancestorFromFrame;
    }

    private void requireMutable() {
        if (snapshot) throw new UnsupportedOperationException("cannot modify a frame graph snapshot");
    }

    private void requireRemovable(FrameId frame) {
        requireNode(frame, "frame");
        if (frame.equals(root)) throw new IllegalArgumentException("cannot remove root frame");
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
