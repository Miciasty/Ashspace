(() => {
  const { code, table, note, cards } = window.WIKI_UI;

  window.WIKI_PAGES.push(
    {
      id: 'coordinate-spaces',
      category: 'Spatial model',
      title: 'Coordinate spaces',
      description: 'Read a position in the right frame, then convert points and directions between frames.',
      kind: 'concept',
      intro: '<p>A tool can stay at the same position on a ship while its world position changes. Ashspace represents the ship with a coordinate frame. A conversion expresses the same point using another frame\'s origin and axes.</p>',
      sections: [
        {
          id: 'origins-and-axes',
          title: 'Origins and axes',
          html: `<p>A <strong>frame</strong> is a named coordinate system with an origin and orientation. Its origin is the point <code>(0, 0, 0)</code> in that frame. A child frame stores its pose relative to its parent. The root has no parent and uses the identity transform.</p>
            <p>Ashspace uses right-handed coordinates with <strong>Y up</strong>. A positive 90° rotation around Y takes the +X direction toward −Z. Ashcore's <code>Quaternion.fromAxisAngle(axis, angle)</code> takes the angle in <strong>radians</strong>: 90° is <code>Math.PI / 2</code>.</p>
            <p>Choose an origin that matches your model: a vehicle pivot, a tool mount or another defined point. Ashspace does not infer an entity position or add a block-center offset. Positions and translations use the same units you supply. If your integration uses one unit per Minecraft block, that convention applies to every participating frame.</p>
            ${table(['Term', 'Meaning', 'Example'], [
              ['World space', 'Coordinates in the graph\'s root frame.', 'The ship origin is at <code>(10, 0, -4)</code>.'],
              ['Local space', 'Coordinates in a chosen non-root frame.', 'A tool point is at <code>(1, 0, 0)</code> in the ship frame.'],
              ['Parent space', 'Coordinates in the immediate parent of a frame.', 'A turret pose is expressed relative to the ship.'],
              ['<code>parentFromFrame</code>', 'A rigid transform from child coordinates into parent coordinates.', 'Convert the turret point into ship coordinates.']
            ])}
            ${note('World means the graph root', '<p><code>FrameGraph3.worldRoot()</code> names the root <code>world</code>. A graph can also use a custom root ID. The converter\'s <code>toWorld…</code> and <code>fromWorld…</code> methods always refer to that root; they do not look up a Minecraft world.</p>')}`
        },
        {
          id: 'see-a-point-move',
          title: 'See a point move between spaces',
          html: `<p>The figure shows a local point and the world coordinates obtained from the frame pose. Change the translation or Y rotation and follow the world result. The local coordinates stay attached to the frame; its world axes and local axes need not point in the same directions.</p>
            <div data-diagram="coordinates"></div>
            <p>The figure illustrates rigid coordinate conversion. For example, rotate the ship +90° around Y and place its origin at <code>(10, 0, -4)</code>. The ship point <code>(1, 0, 0)</code> becomes world point <code>(10, 0, -5)</code>, within floating-point rounding. The corresponding direction becomes <code>(0, 0, -1)</code>.</p>`
        },
        {
          id: 'points-vectors-directions',
          title: 'Choose point, vector or direction',
          html: `<p>A point includes a location. A vector represents an offset with a magnitude. A direction describes an orientation. Translation changes a point, but it does not change an offset or a direction.</p>
            ${table(['Input', 'Conversion', 'Effect'], [
              ['Point', '<code>converter.point(point, source, target)</code>', 'Rotate, then translate: <code>p′ = R · p + t</code>.'],
              ['Vector', '<code>converter.vector(vector, source, target)</code>', 'Rotate only: <code>v′ = R · v</code>.'],
              ['Direction', '<code>converter.direction(direction, source, target)</code>', 'Rotate only, using the same operation as vector conversion.']
            ])}
            <p>Vector and direction conversion preserve length within rounding. <code>direction()</code> does not normalize its input or output. A vector of length 5 remains approximately length 5, even when passed as a direction. Supply a unit direction when the next API requires one.</p>
            <p>Every input coordinate and computed output coordinate must be finite. A non-finite value or arithmetic overflow raises <code>IllegalArgumentException</code>; a null vector or point raises <code>NullPointerException</code>.</p>`
        },
        {
          id: 'convert-a-ship-point',
          title: 'Convert a ship point',
          html: `<p>Define the ship pose, then use <code>SpaceConverter3</code> to express a local point in the root frame. The reverse call expresses the world point in the ship frame.</p>
            ${code(`import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.space.SpaceConverter3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

public final class CoordinateSpacesExample {
    public static void main(String[] args) {
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        frames.define(ship, frames.root(), new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2),
                new Vector3(10, 0, -4)
        ));

        SpaceConverter3 converter = new SpaceConverter3(frames);
        Vector3 localPoint = new Vector3(1, 0, 0);
        Vector3 worldPoint = converter.toWorldPoint(ship, localPoint);
        Vector3 restored = converter.fromWorldPoint(ship, worldPoint);
        Vector3 worldDirection = converter.toWorldDirection(
                ship, new Vector3(1, 0, 0));

        assert Math.abs(worldPoint.x() - 10) < 1e-12;
        assert Math.abs(worldPoint.z() + 5) < 1e-12;
        assert Math.abs(restored.x() - 1) < 1e-12 && Math.abs(restored.z()) < 1e-12;
        assert Math.abs(worldDirection.x()) < 1e-12 && Math.abs(worldDirection.z() + 1) < 1e-12;

        System.out.println("worldPoint=" + worldPoint);
        System.out.println("restored=" + restored);
        System.out.println("worldDirection=" + worldDirection);
    }
}`, 'CoordinateSpacesExample.java')}
            ${table(['Result', 'Coordinates, within rounding'], [
              ['<code>worldPoint</code>', '<code>(10, 0, -5)</code>'],
              ['<code>restored</code>', '<code>(1, 0, 0)</code>'],
              ['<code>worldDirection</code>', '<code>(0, 0, -1)</code>']
            ])}
            <p>Printed doubles can include a small residual in a component that is mathematically zero. An inverse conversion does not promise bit-for-bit recovery of the original point.</p>`
        },
        {
          id: 'converter-methods',
          title: 'Converter method reference',
          html: `${table(['Method', 'Meaning'], [
              ['<code>new SpaceConverter3(frames)</code>', 'Retain the supplied live or frozen graph. The constructor does not copy or lock it.'],
              ['<code>frames()</code>', 'Return the same graph supplied to the constructor.'],
              ['<code>transform(source, target)</code>', 'Return an immutable transform from the source frame to the target frame.'],
              ['<code>point(value, source, target)</code><br><code>vector(value, source, target)</code><br><code>direction(value, source, target)</code>', 'Convert a value between two defined frames.'],
              ['<code>toWorldPoint(source, value)</code><br><code>toWorldVector(source, value)</code><br><code>toWorldDirection(source, value)</code>', 'Convert from a source frame to the graph root.'],
              ['<code>fromWorldPoint(target, value)</code><br><code>fromWorldVector(target, value)</code><br><code>fromWorldDirection(target, value)</code>', 'Convert from the graph root to a target frame.']
            ])}
            <p>Argument order differs between the general methods and the world shortcuts. General methods put the value first. World shortcuts put the frame first.</p>
            <p>Both frame IDs must exist, including when source and target are equal. An unknown frame raises <code>IllegalArgumentException</code>. A null graph or frame ID raises <code>NullPointerException</code>.</p>
            <p>A converter created with a mutable graph sees later pose updates. Keep that graph stable throughout the complete query, or pass one frozen graph to every adapter involved. A returned point or transform remains unchanged after later graph updates.</p>
            ${cards([
              { id: 'transforms', title: 'Rigid transforms', text: 'Compose rotations and translations in the intended order.' },
              { id: 'frame-chains', title: 'Frame chains', text: 'Convert between nested frames without a world-space detour.' },
              { id: 'spaces-and-snapshots', title: 'State and snapshots', text: 'Keep frame state consistent throughout a query.' }
            ])}`
        }
      ]
    },
    {
      id: 'transforms',
      category: 'Spatial model',
      title: 'Rigid transforms',
      description: 'Apply rotation and translation, compose transforms, and reverse a conversion.',
      kind: 'concept',
      intro: '<p><code>RigidTransform3</code> is an immutable rotation and translation. It changes where a shape sits and which way it faces. The rigid model preserves distances and angles within numerical rounding.</p>',
      sections: [
        {
          id: 'rotation-and-translation',
          title: 'Rotation, then translation',
          html: `<p>A transform applies to a point as <code>p′ = R · p + t</code>. First rotate the point around the source origin. Then add the translation expressed in the destination frame. There is no scale or shear.</p>
            ${table(['Construction or method', 'Contract'], [
              ['<code>new RigidTransform3(rotation, translation)</code>', 'Use an Ashcore quaternion and a finite translation vector. The constructor normalizes the quaternion.'],
              ['<code>RigidTransform3.identity()</code>', 'Create the identity rotation with zero translation.'],
              ['<code>RigidTransform3.translation(delta)</code>', 'Create a pure translation from a <code>Vector3</code>.'],
              ['<code>RigidTransform3.translation(x, y, z)</code>', 'Create a pure translation from three doubles.'],
              ['<code>rotation()</code> / <code>translation()</code>', 'Read the immutable normalized rotation and translation.'],
              ['<code>transformPoint(point)</code>', 'Rotate and translate a point.'],
              ['<code>transformVector(vector)</code> / <code>transformDirection(direction)</code>', 'Rotate only. The direction method does not renormalize.']
            ])}
            <p>Translations and points use compatible position units. A grid's <code>cellSize</code> controls index mapping; it does not scale the frame transform.</p>`
        },
        {
          id: 'composition-order',
          title: 'Composition order matters',
          html: `<p><code>a.then(b)</code> applies <strong>a first, then b</strong>. Its result matches <code>b.transformPoint(a.transformPoint(point))</code> within rounding. Reversing the order usually changes the result because a later rotation also rotates an earlier translation.</p>
            <div data-diagram="composition"></div>
            <p>The figure compares the two application orders. Change its rotation or offset and compare the final points. It illustrates composition in the XZ plane with Y up; angles shown in degrees must be converted to radians for the Java API.</p>
            ${table(['Combined transform', 'Rotation', 'Translation'], [
              ['<code>a.then(b)</code>', '<code>Rb · Ra</code>', '<code>Rb · ta + tb</code>'],
              ['<code>b.then(a)</code>', '<code>Ra · Rb</code>', '<code>Ra · tb + ta</code>']
            ])}
            <p>Use names that describe the conversion direction. A transform named <code>shipFromTool</code> converts tool coordinates to ship coordinates. Consequently, <code>shipFromTool.then(worldFromShip)</code> produces <code>worldFromTool</code>.</p>`
        },
        {
          id: 'compose-and-reverse',
          title: 'Compose and reverse a transform',
          html: `<p>This example turns a point +90° around Y and then moves it by <code>(10, 0, -4)</code>. It also applies the reversed order and restores the first result with <code>inverse()</code>.</p>
            ${code(`import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

public final class TransformCompositionExample {
    public static void main(String[] args) {
        RigidTransform3 turn = new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2),
                Vector3.ZERO);
        RigidTransform3 move = RigidTransform3.translation(10, 0, -4);
        Vector3 point = new Vector3(1, 0, 0);

        RigidTransform3 turnThenMove = turn.then(move);
        Vector3 first = turnThenMove.transformPoint(point);
        Vector3 second = move.then(turn).transformPoint(point);
        Vector3 restored = turnThenMove.inverse().transformPoint(first);

        assert Math.abs(first.x() - 10) < 1e-12 && Math.abs(first.z() + 5) < 1e-12;
        assert Math.abs(second.x() + 4) < 1e-12 && Math.abs(second.z() + 11) < 1e-12;
        assert Math.abs(restored.x() - 1) < 1e-12 && Math.abs(restored.z()) < 1e-12;

        System.out.println("turnThenMove=" + first);
        System.out.println("moveThenTurn=" + second);
        System.out.println("restored=" + restored);
    }
}`, 'TransformCompositionExample.java')}
            ${table(['Result', 'Coordinates, within rounding'], [
              ['<code>turnThenMove</code>', '<code>(10, 0, -5)</code>'],
              ['<code>moveThenTurn</code>', '<code>(-4, 0, -11)</code>'],
              ['<code>restored</code>', '<code>(1, 0, 0)</code>']
            ])}
            <p>The inverse uses the inverse rotation and translation <code>−R⁻¹ · t</code>. Negating the translation alone does not reverse a transform with rotation. Repeated composition and inversion create new immutable transform values.</p>`
        },
        {
          id: 'rotation-validation',
          title: 'Rotation validation',
          html: `<p>All four quaternion components must be finite. Ashspace uses Ashcore's normalization. For compatibility, the all-zero quaternion becomes the identity rotation; use <code>Quaternion.identity()</code> when identity is your intent.</p>
            <p>For a nonzero quaternion, its computed squared norm must be finite and at least <code>Double.MIN_NORMAL</code>. The constructor rejects extreme magnitudes outside that range. After normalization, the squared norm must differ from one by at most <code>1e-12</code>. That tolerance is absolute and dimensionless.</p>
            ${table(['Invalid input or result', 'Failure'], [
              ['Null rotation, translation, point, vector or <code>after</code> transform', '<code>NullPointerException</code>'],
              ['NaN or infinity in rotation or position components', '<code>IllegalArgumentException</code>'],
              ['Nonzero quaternion outside the supported normalization range', '<code>IllegalArgumentException</code>'],
              ['Normalization does not produce a supported unit quaternion', '<code>IllegalArgumentException</code>'],
              ['Non-finite transformed coordinate or composed translation', '<code>IllegalArgumentException</code>']
            ])}
            <p>For example, translating a point at <code>Double.MAX_VALUE</code> by another <code>Double.MAX_VALUE</code> overflows and fails. Finite constructor inputs do not guarantee that every later conversion is representable.</p>`
        },
        {
          id: 'precision-and-cost',
          title: 'Precision and operation cost',
          html: `<p>Rigid transforms use double arithmetic. Very large translations can collapse distinct points to the same coordinates. An inverse cannot recover information lost by rounding. Long composition chains can accumulate additional error.</p>
            <p>The library tests moderate-coordinate transforms with absolute coordinate tolerances from <code>1e-12</code> to <code>1e-9</code>. Those are test tolerances for the covered inputs, not a universal error bound. Choose an error budget for your coordinates and operation sequence.</p>
            <p>Point/vector conversion, composition and inversion each use a fixed number of operations: <code>O(1)</code> time and live additional memory. They allocate immutable values. These operation counts do not imply an allocation-free implementation or measured latency.</p>
            ${cards([
              { id: 'coordinate-spaces', title: 'Coordinate spaces', text: 'Choose point or direction conversion and keep units consistent.' },
              { id: 'frame-chains', title: 'Frame chains', text: 'Let a graph compose the relative transforms between frames.' }
            ])}`
        }
      ]
    },
    {
      id: 'frame-chains',
      category: 'Spatial model',
      title: 'Frame chains',
      description: 'Define parent relationships and resolve conversions through a common ancestor.',
      kind: 'concept',
      intro: '<p><code>FrameGraph3</code> stores frames connected to one root. Each child describes its pose in its parent. A ship, turret and tool can therefore share motion without rewriting every local position.</p>',
      sections: [
        {
          id: 'define-a-hierarchy',
          title: 'Define a hierarchy',
          html: `<p>Create the root first, then define children beneath existing parents. Every non-root frame has one parent. The graph rejects cycles, so following parent links always leads toward the root.</p>
            <div data-diagram="frame-chain"></div>
            <p>Drag the 3D scene to orbit the camera, or focus it and use the arrow keys. The sliders change the frame poses. Start with the <strong>seat</strong> readout: moving or rotating the ship changes the point's world coordinates while its seat coordinates stay fixed. Rotate the tool to change the point relative to the seat. Switch to <strong>tool</strong> and its local input stays at <code>(1, 0, 0)</code> through every pose change.</p>
            <p>The tree highlights the conversion path from <code>tool</code> to the selected frame. For <code>seat</code>, that path is <code>tool → ship → seat</code>: apply the tool-to-parent transform, then the inverse seat-to-parent transform. The shared ship-to-world pose is not part of this relative conversion. Camera movement only changes the view; it never changes coordinate values.</p>
            ${table(['Type or operation', 'Role'], [
              ['<code>new FrameId(value)</code>', 'Create an immutable string ID. Null or blank values raise <code>IllegalArgumentException</code>. Values are not trimmed or case-normalized.'],
              ['<code>FrameGraph3.worldRoot()</code>', 'Create a mutable graph with root ID <code>world</code>.'],
              ['<code>new FrameGraph3(rootId)</code>', 'Create a mutable graph with your own root ID.'],
              ['<code>define(id, parent, parentFromFrame)</code>', 'Register a new child or replace the parent and pose of an existing non-root frame.'],
              ['<code>Frame3</code>', 'An immutable frame definition containing <code>id</code>, <code>parent</code> and <code>parentFromFrame</code>.']
            ])}
            <p>A frame ID names a node within a graph. It does not resolve an entity, load a world or store an object's geometry. Your application owns those associations and supplies pose updates.</p>`
        },
        {
          id: 'resolve-a-chain',
          title: 'Resolve a chain',
          html: `<p>This example reproduces the 3D scene after <strong>Reset all</strong>. The ship origin is at world <code>(4, 0, 0)</code>, the seat origin at ship <code>(−2, 0, 0)</code>, and the tool origin at ship <code>(2, 1, 0)</code>. The tool point <code>(1, 0, 0)</code> has ship coordinates <code>(3, 1, 0)</code>, seat coordinates <code>(5, 1, 0)</code>, and world coordinates <code>(7, 1, 0)</code>.</p>
            ${code(`import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.frame.Frame3;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.transform.RigidTransform3;

public final class FrameChainExample {
    public static void main(String[] args) {
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId world = frames.root();
        FrameId ship = new FrameId("ship");
        FrameId seat = new FrameId("seat");
        FrameId tool = new FrameId("tool");
        frames.define(ship, world, RigidTransform3.translation(4, 0, 0));
        frames.define(seat, ship, RigidTransform3.translation(-2, 0, 0));
        frames.define(tool, ship, RigidTransform3.translation(2, 1, 0));

        Vector3 point = new Vector3(1, 0, 0);
        Vector3 inShip = frames.transform(tool, ship).transformPoint(point);
        Vector3 inSeat = frames.transform(tool, seat).transformPoint(point);
        Vector3 inWorld = frames.rootFrom(tool).transformPoint(point);
        Vector3 restored = frames.transform(world, tool).transformPoint(inWorld);
        Frame3 definition = frames.frame(tool);

        assert inShip.equals(new Vector3(3, 1, 0));
        assert inSeat.equals(new Vector3(5, 1, 0));
        assert inWorld.equals(new Vector3(7, 1, 0));
        assert restored.equals(point) && definition.parent().equals(ship);

        System.out.println("inShip=" + inShip);
        System.out.println("inSeat=" + inSeat);
        System.out.println("inWorld=" + inWorld);
        System.out.println("restored=" + restored);
        System.out.println("parent=" + definition.parent());

        // Move and rotate the shared ship; seat-relative coordinates stay fixed.
        frames.define(ship, world, new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2),
                new Vector3(8, 0, 0)));
        Vector3 movedWorld = frames.rootFrom(tool).transformPoint(point);
        assert movedWorld.distance(new Vector3(8, 1, -3)) < 1e-12;
        assert frames.transform(tool, seat).transformPoint(point).equals(inSeat);

        // Turning the tool changes the point relative to the seat as well.
        frames.define(tool, ship, new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2),
                new Vector3(2, 1, 0)));
        assert frames.transform(tool, seat).transformPoint(point)
                .distance(new Vector3(4, 1, -1)) < 1e-12;
        assert frames.rootFrom(tool).transformPoint(point)
                .distance(new Vector3(7, 1, -2)) < 1e-12;
    }
}`, 'FrameChainExample.java')}
            <p>Set <strong>Ship world X</strong> to 8 and <strong>Ship Y rotation</strong> to 90° to reproduce <code>(8, 1, −3)</code> in world space. The seat result stays at <code>(5, 1, 0)</code>. Then set <strong>Tool Y rotation</strong> to 90°: the seat result becomes <code>(4, 1, −1)</code> and the world result becomes <code>(7, 1, −2)</code>, within rounding.</p>
            ${note('The stored transform points toward the parent', '<p>The hierarchy places a child below its parent, but <code>parentFromFrame</code> converts coordinates from the child into that parent. Initially the tool transform adds <code>(2, 1, 0)</code>. After the update, it first rotates the input by 90° around Y, then adds that same translation.</p>')}`
        },
        {
          id: 'common-ancestor',
          title: 'Convert through the nearest common ancestor',
          html: `<p>Two tools on one ship share that ship as an ancestor. A direct tool-to-tool conversion composes only the edges below their nearest common ancestor. It does not first calculate both world poses.</p>
            <p>If tool A is at ship X = 1 and tool B is at ship X = 2, A's origin is at X = −1 in B coordinates. That relative offset remains representable even when the ship's world translation is <code>2^54</code>. Converting both origins to world space first can lose the one-unit difference.</p>
            ${table(['Query', 'Edges used in transform composition'], [
              ['<code>transform(toolA, toolB)</code>', 'Tool A to the common ancestor, then the inverse of tool B to that ancestor.'],
              ['<code>transform(tool, ship)</code>', 'The edges from tool to ship.'],
              ['<code>rootFrom(tool)</code>', 'Every edge from tool to the root.'],
              ['<code>transform(tool, tool)</code>', 'No composition; identity after verifying that the frame exists.']
            ])}
            <p>Use a direct relative conversion when your next calculation stays on the same vehicle. This can also succeed when shared ancestors would overflow in world space. Actual world conversions still have the ordinary transform limits. A relative conversion cannot restore precision already lost in an input world point.</p>`
        },
        {
          id: 'read-definitions',
          title: 'Read frame definitions',
          html: `${table(['Method', 'Result'], [
              ['<code>root()</code>', 'The root ID, whose definition has no parent and the identity transform.'],
              ['<code>size()</code>', 'The number of currently defined frames, including the root.'],
              ['<code>contains(id)</code>', 'Whether the ID exists. A null argument raises <code>NullPointerException</code>.'],
              ['<code>parentOf(id)</code>', 'An <code>Optional&lt;FrameId&gt;</code>; empty only for the existing root. Unknown IDs raise <code>IllegalArgumentException</code>.'],
              ['<code>frame(id)</code>', 'An immutable <code>Frame3</code> value describing the current definition.'],
              ['<code>frames()</code>', 'An unmodifiable copied map in first-definition order. Updating an ID preserves its position.'],
              ['<code>snapshot()</code>', 'A frozen queryable graph; later updates to the source do not change it.'],
              ['<code>isSnapshot()</code>', 'Whether this graph is frozen.']
            ])}
            <p><code>Frame3.root(id)</code> creates a definition with a null parent and identity transform. <code>Frame3.child(id, parent, transform)</code> requires a non-null parent. A definition rejects self-parenting, a null ID, a null transform and a nonidentity root transform. Creating a <code>Frame3</code> value does not register it in a graph; use <code>define()</code> to register a child.</p>
            <p>A saved <code>Frame3</code>, transform or <code>frames()</code> map remains unchanged after the live graph changes. The copied map describes definitions; a graph from <code>snapshot()</code> also supports the same conversion methods.</p>`
        },
        {
          id: 'update-and-remove',
          title: 'Update and remove frames',
          html: `<p>Call <code>define()</code> again to replace an existing non-root frame's pose or parent. Children stay attached to that ID. Reparenting interprets the supplied transform in the new parent's space and does not preserve the previous world pose automatically.</p>
            ${table(['Operation', 'Behavior'], [
              ['<code>define(id, parent, transform)</code>', 'Reject a missing parent, root redefinition or a cycle with <code>IllegalArgumentException</code>.'],
              ['<code>remove(id)</code>', 'Remove an existing non-root leaf. A frame with children is rejected.'],
              ['<code>removeSubtree(id)</code>', 'Remove an existing non-root frame and its current descendants. Return the removed count, including that frame.'],
              ['Removal of the root or an unknown ID', 'Raise <code>IllegalArgumentException</code>. A null ID on a mutable graph raises <code>NullPointerException</code>.'],
              ['Any mutation on a snapshot', 'Raise <code>UnsupportedOperationException</code>.']
            ])}
            <p>Rejected operations leave definitions unchanged. Surviving frames keep their order. Defining a removed ID appends a new definition. A live conversion that references a removed frame fails, even when source and target are that same ID.</p>
            <p>Mutable graphs are not thread-safe. Keep one pose stable through conversion, tracing and any later grid lookup in the same query. For a frozen query, create one snapshot while the source is stable and pass it to every participating adapter. See <a href="#/spaces-and-snapshots">State and snapshots</a> for ownership and concurrent reads.</p>`
        },
        {
          id: 'chain-costs',
          title: 'Chain depth and operation cost',
          html: `<p>Let <code>hs</code> and <code>ht</code> be source and target depths, <code>h</code> the depth of one frame, and <code>n</code> the number of definitions. Hash-map lookups are assumed to take constant expected time.</p>
            ${table(['Operation', 'Time', 'Additional memory'], [
              ['<code>transform(source, target)</code>', '<code>O(hs + ht)</code>; an existing frame to itself takes <code>O(1)</code>.', '<code>O(1)</code> live memory; temporary transforms for composed edges.'],
              ['<code>rootFrom(frame)</code>', '<code>O(h)</code>', '<code>O(1)</code> live memory; <code>O(h)</code> temporary allocations over the operation.'],
              ['<code>define()</code>', '<code>O(h)</code> for the parent-chain cycle check.', '<code>O(1)</code> additional memory.'],
              ['<code>frames()</code> / <code>snapshot()</code>', '<code>O(n)</code> to copy definitions.', '<code>O(n)</code> for the copy.'],
              ['<code>remove()</code>', '<code>O(n)</code> to check for children.', '<code>O(1)</code>.'],
              ['<code>removeSubtree()</code>', '<code>O(n)</code> expected time.', '<code>O(n)</code>; iterative traversal.']
            ])}
            <p>There is no transform cache. A relative query inspects parent links to find the common ancestor, even when few edges need composition. Snapshot creation copies definitions without calculating world transforms; taking a snapshot of a snapshot returns that same instance in <code>O(1)</code>.</p>
            <p>Repeated arithmetic results require equal inputs, definitions, dependency versions and a stable graph in the same runtime environment. Defining unrelated frames in another order does not change otherwise identical transform results. Cross-platform or cross-release bitwise equality is not promised.</p>`
        }
      ]
    }
  );
})();
