(() => {
  const { code, table, note, cards } = window.WIKI_UI;
  const source = (name, folder) => `<a href="https://github.com/Miciasty/Ashspace/blob/master/src/main/java/nsk/nu/ashspace/${folder}/${name}.java"><code>${name}</code></a>`;

  window.WIKI_PAGES.push(
    {
      id: 'spaces-and-snapshots',
      category: 'Spatial model',
      title: 'Conversions and snapshots',
      description: 'Convert between frames and keep one pose throughout a complete query.',
      kind: 'concept',
      intro: '<p>A moving ship can change position between converting a tool ray and mapping a result to a cell. A snapshot keeps the frame definitions used by those operations fixed, so both operations describe the same pose.</p>',
      sections: [
        {
          id: 'choose-the-conversion',
          title: 'Choose the source and target frames',
          html: `<p><code>SpaceConverter3</code> keeps the <code>FrameGraph3</code> passed to its constructor. <code>point(value, source, target)</code> interprets the value in <code>source</code> and returns its coordinates in <code>target</code>. The conversion changes the coordinate description; it does not move an entity or update a frame.</p>
            ${table(['Input', 'Method', 'Result'], [
              ['Position', '<code>point(point, source, target)</code>', 'Rotates and translates the point into the target frame.'],
              ['Displacement or velocity', '<code>vector(vector, source, target)</code>', 'Rotates the vector. Translation has no effect.'],
              ['Direction', '<code>direction(direction, source, target)</code>', 'Rotates the direction without normalizing it. Its length is preserved within rounding.'],
              ['Root/world conversion', '<code>toWorldPoint(source, point)</code><br><code>fromWorldPoint(target, worldPoint)</code>', 'Converts to or from the graph root. Matching vector and direction methods are available.'],
              ['Several values with one relative pose', '<code>transform(source, target)</code>', 'Returns an immutable <code>RigidTransform3</code> that can be applied repeatedly.']
            ])}
            <p>Both frame IDs must exist, including when <code>source.equals(target)</code>. An existing frame converted to itself uses the identity transform. An unknown frame throws <code>IllegalArgumentException</code>; it does not return an empty result.</p>
            <p>Relative conversion finds the nearest common ancestor and composes only the edges below it. Converting directly from a tool to its ship avoids adding and subtracting the ship's world offset. Once a point has already lost precision in world coordinates, converting it back cannot recover the lost detail.</p>`
        },
        {
          id: 'live-and-frozen-state',
          title: 'Compare live and frozen frame state',
          html: `<p>A converter built with a mutable graph observes later calls to <code>define</code>, including changes to a frame's parent. Removing a referenced frame makes later live conversions fail. Values already returned by a conversion keep their original coordinates.</p>
            <p><code>frames.snapshot()</code> copies the current frame definitions into a frozen graph. Move the live ship in this diagram and compare its point with the captured point. Capture again to make the frozen definitions match the current pose.</p>
            <div data-diagram="snapshots"></div>
            ${table(['Object', 'What it retains', 'Effect of later live updates'], [
              ['<code>new SpaceConverter3(live)</code>', 'The same mutable graph reference.', 'Later calls use the updated definitions.'],
              ['<code>live.frame(id)</code>', 'One immutable <code>Frame3</code> definition.', 'The returned definition stays unchanged.'],
              ['<code>live.frames()</code>', 'An unmodifiable map of immutable definitions in first-definition order.', 'The returned map stays unchanged. It is a collection, not a queryable graph.'],
              ['<code>live.transform(source, target)</code>', 'One computed immutable relative transform.', 'Applying this value still uses its captured transform.'],
              ['<code>live.snapshot()</code>', 'A queryable frozen graph containing all current definitions.', 'Conversions on this graph keep the captured pose and frame membership.'],
              ['<code>attachedGrid.snapshot()</code>', 'A frame-attached mapper with a frozen graph and the same mapping configuration.', 'Its frame pose stays fixed. It does not copy voxel data.']
            ])}
            <p>Snapshot creation copies definitions without computing accumulated world transforms. A local conversion can therefore remain usable even when an ancestor's world transform would overflow. Snapshot creation takes <code>O(n)</code> time and additional memory for <code>n</code> frames. Calling <code>snapshot()</code> on a frozen graph or an already frozen attached mapper returns that same instance.</p>`
        },
        {
          id: 'share-a-query-snapshot',
          title: 'Share one snapshot across a query',
          html: `<p>Capture the graph while it is stable, then pass the same snapshot to every converter and mapper participating in that query. This example converts a tool point to world coordinates and indexes the same point in the ship's grid. The live graph can subsequently move or remove the ship without changing those captured definitions.</p>
            ${code(`import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.FrameGridSpaceMapper3;
import nsk.nu.ashspace.api.space.SpaceConverter3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

public final class SnapshotQueryExample {
    public static void main(String[] args) {
        FrameGraph3 live = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        FrameId tool = new FrameId("tool");
        live.define(ship, live.root(), RigidTransform3.translation(10, 0, 0));
        live.define(tool, ship, RigidTransform3.translation(0, 2, 0));

        FrameGraph3 queryFrames = live.snapshot();
        SpaceConverter3 converter = new SpaceConverter3(queryFrames);
        FrameGridSpaceMapper3 shipGrid = new FrameGridSpaceMapper3(
                queryFrames, ship, 1.0, Vector3.ZERO,
                new SquareXZChunkScheme(16));

        live.define(ship, live.root(), RigidTransform3.translation(20, 0, 0));
        live.removeSubtree(ship);

        Vector3 toolPoint = new Vector3(1, 0, 0);
        Vector3 worldPoint = converter.toWorldPoint(tool, toolPoint);
        assert worldPoint.x() == 11 && worldPoint.y() == 2 && worldPoint.z() == 0;
        assert shipGrid.localToCell(tool, toolPoint).x() == 1;
        assert shipGrid.localToCell(tool, toolPoint).y() == 2;
        assert shipGrid.localToCell(tool, toolPoint).z() == 0;
        assert !live.contains(ship) && queryFrames.contains(ship);
        System.out.println("worldX=" + worldPoint.x());
        System.out.println("worldY=" + worldPoint.y());
        System.out.println("shipCell=" + shipGrid.localToCell(tool, toolPoint));
        System.out.println("liveHasShip=" + live.contains(ship));
        System.out.println("snapshotHasShip=" + queryFrames.contains(ship));
    }
}`, 'SnapshotQueryExample.java')}
            ${code(`worldX=11.0
worldY=2.0
shipCell=CellIndex3[x=1, y=2, z=0]
liveHasShip=false
snapshotHasShip=true`, 'Expected output', 'output')}
            <p>The ship grid uses unit cells in the ship frame. Its cell <code>(1, 2, 0)</code> differs from the point's world coordinates because the ship origin is at world X = 10 in the snapshot. <code>SquareXZChunkScheme</code> comes from Ashgrid's <code>implementation.grid.indexing</code> package.</p>
            ${note('Capture the whole query once', '<p>Separate calls to <code>live.snapshot()</code> can capture different poses if the live graph changes between them. Keep one captured graph for the complete operation, including any caller-owned tracing or storage lookup that must describe the same state.</p>')}`
        },
        {
          id: 'threading-and-ownership',
          title: 'Keep capture and publication consistent',
          html: `<p>Mutable graphs are not thread-safe. Keep the graph unchanged during a complete logical query, or protect the query with the same external synchronization used by every writer. Locking only the conversion method leaves a later grid lookup free to observe another pose.</p>
            <p>The source graph must also remain stable while <code>snapshot()</code> copies it. After safe publication to another thread, the frozen graph supports concurrent reads without graph locking. A snapshot rejects <code>define</code>, <code>remove</code> and <code>removeSubtree</code> with <code>UnsupportedOperationException</code>.</p>
            <p>For a worker query, finish frame updates, capture under the caller's synchronization, and pass the snapshot through the caller's thread handoff mechanism, such as task submission to an executor. Ashspace does not schedule that work. Keep any geometry collections, voxel storage or tracing index used with it consistent separately: a frame snapshot contains none of those objects.</p>
            <p><code>GridSpaceMapper3</code> takes a graph only in its <code>localTo...</code> and <code>localAabbTo...</code> methods. Pass the shared snapshot to those calls. <code>SpaceConverter3</code> and <code>FrameGridSpaceMapper3</code> retain their constructor graph, so supply the shared snapshot when constructing them.</p>`
        },
        {
          id: 'minecraft-boundary',
          title: 'Supply Minecraft state from the caller',
          html: `<p>Ashspace accepts numeric positions, rotations and frame IDs. Your plugin reads the game state and converts it to Ashcore values such as <code>Vector3</code> and <code>Quaternion</code>. The library has no Bukkit dependency, location adapter, world lookup or entity pose provider.</p>
            <p>The default root is a frame named <code>world</code>; that name does not bind it to a Minecraft world. Keep the world identity and the choice of graph in your own integration. A <code>FrameId</code> is a nonblank string, so naming one with a UUID does not register an entity or make Ashspace track it.</p>
            <p>Read and update game objects according to the server API's threading rules before supplying their numeric state. A frozen Ashspace graph does not make server objects or a caller-owned storage implementation safe to access from another thread.</p>
            ${cards([
              { id: 'frame-chains', title: 'Frame chains', text: 'Define, reparent and remove frames with explicit parent transforms.' },
              { id: 'frame-grids', title: 'Frame-attached grids', text: 'Keep grid axes and cell coordinates attached to a moving frame.' }
            ])}`
        }
      ]
    },
    {
      id: 'api-reference',
      category: 'Reference',
      title: 'API reference',
      navTitle: 'API index',
      description: 'Public types, method families, ownership and error contracts in Ashspace 2.0.0.',
      kind: 'reference',
      intro: '<p>This reference covers the nine types under <code>nsk.nu.ashspace.api</code> and the existing public <code>ChunkLocalIndexer</code> helper. Ashcore owns the math and geometry values exposed by these signatures; Ashgrid owns the cell, chunk and integer range types.</p>',
      sections: [
        {
          id: 'public-types',
          title: 'Public types and packages',
          html: `${table(['Package', 'Type', 'Purpose'], [
            ['<code>nsk.nu.ashspace.api.frame</code>', source('FrameId','api/frame'), 'Immutable string identifier for one frame within a graph.'],
            ['<code>nsk.nu.ashspace.api.frame</code>', source('Frame3','api/frame'), 'Immutable frame definition: ID, parent and child-to-parent transform.'],
            ['<code>nsk.nu.ashspace.api.frame</code>', source('FrameGraph3','api/frame'), 'Mutable or frozen parent-linked graph and relative transform lookup.'],
            ['<code>nsk.nu.ashspace.api.transform</code>', source('RigidTransform3','api/transform'), 'Immutable rotation and translation.'],
            ['<code>nsk.nu.ashspace.api.space</code>', source('SpaceConverter3','api/space'), 'Point, vector and geometry conversion through a retained frame graph.'],
            ['<code>nsk.nu.ashspace.api.geometry</code>', source('GeometryTransforms3','api/geometry'), 'Static geometry conversion with an explicit rigid transform.'],
            ['<code>nsk.nu.ashspace.api.grid</code>', source('GridSpaceMapper3','api/grid'), 'World-aligned cell, chunk and range mapping.'],
            ['<code>nsk.nu.ashspace.api.grid</code>', source('FrameGridSpaceMapper3','api/grid'), 'The same grid model attached to a coordinate frame.'],
            ['<code>nsk.nu.ashspace.api.grid</code>', source('ChunkAddress3','api/grid'), 'Immutable pair of chunk index and chunk-local coordinates.'],
            ['<code>nsk.nu.ashspace.implementation.grid</code>', source('ChunkLocalIndexer','implementation/grid'), 'Public cell-to-chunk indexing helper included in the supported surface.']
          ])}
          <p>The dependency baseline is Ashcore <code>1.2.0</code> and Ashgrid <code>1.3.0</code>. Public signatures expose their types, so changing either dependency also needs consumer integration checks. See <a href="#/installation">Installation</a> for the Maven dependency and runtime packaging.</p>`
        },
        {
          id: 'frame-api',
          title: 'Frame definitions and graph methods',
          html: `<p><code>FrameId(String value)</code> exposes <code>value()</code>, and <code>toString()</code> returns that value. Null or blank values throw <code>IllegalArgumentException</code>. Nonblank strings are preserved; they are not trimmed or converted to lowercase.</p>
            <p><code>Frame3(FrameId id, FrameId parent, RigidTransform3 parentFromFrame)</code> exposes its three record accessors. <code>Frame3.root(id)</code> creates an identity root; <code>Frame3.child(id, parent, parentFromFrame)</code> requires a parent. <code>isRoot()</code> reports whether <code>parent()</code> is null. Creating a definition does not insert it into a graph.</p>
            ${table(['FrameGraph3 member', 'Result or effect'], [
              ['<code>new FrameGraph3(FrameId root)</code>', 'Creates a mutable graph containing the supplied identity root.'],
              ['<code>static worldRoot()</code>', 'Creates a mutable graph with root ID <code>world</code>.'],
              ['<code>root()</code> → <code>FrameId</code><br><code>size()</code> → <code>int</code><br><code>isSnapshot()</code> → <code>boolean</code>', 'Reads root identity, number of definitions including the root, and frozen state.'],
              ['<code>contains(FrameId frame)</code> → <code>boolean</code>', 'Returns false for an unknown nonnull ID.'],
              ['<code>parentOf(FrameId frame)</code> → <code>Optional&lt;FrameId&gt;</code>', 'Returns empty only for the existing root. An unknown frame throws.'],
              ['<code>frame(FrameId frame)</code> → <code>Frame3</code>', 'Returns an immutable definition of an existing frame.'],
              ['<code>frames()</code> → <code>Map&lt;FrameId, Frame3&gt;</code>', 'Returns an unmodifiable copied map in first-definition order.'],
              ['<code>define(FrameId frame, FrameId parent, RigidTransform3 parentFromFrame)</code>', 'Inserts or updates a non-root frame under an existing parent. Rejects cycles. Reparenting uses the supplied transform relative to the new parent.'],
              ['<code>remove(FrameId frame)</code>', 'Removes an existing non-root leaf. Rejects a frame with children.'],
              ['<code>removeSubtree(FrameId frame)</code> → <code>int</code>', 'Removes an existing non-root frame and its descendants; returns the number removed.'],
              ['<code>rootFrom(FrameId frame)</code> → <code>RigidTransform3</code>', 'Converts coordinates from the frame into the root.'],
              ['<code>transform(FrameId source, FrameId target)</code> → <code>RigidTransform3</code>', 'Converts source coordinates into target coordinates through their nearest common ancestor.'],
              ['<code>snapshot()</code> → <code>FrameGraph3</code>', 'Copies definitions into a frozen graph, or returns this graph if already frozen.']
            ])}
            <p>Rejected graph updates leave the graph unchanged. Updating a frame preserves its position in definition order; defining an ID again after removal appends it. All mutation methods on a snapshot throw <code>UnsupportedOperationException</code>. See <a href="#/frame-chains">Frame chains</a> for lifecycle examples.</p>`
        },
        {
          id: 'transform-api',
          title: 'Rigid transform methods',
          html: `<p><code>RigidTransform3(Quaternion rotation, Vector3 translation)</code> stores a normalized rotation and finite translation, exposed by <code>rotation()</code> and <code>translation()</code>. Points use <code>R × p + t</code>; vectors and directions use <code>R × v</code>. There is no scale or shear.</p>
            ${table(['Member', 'Result'], [
              ['<code>static identity()</code>', 'Identity rotation and zero translation.'],
              ['<code>static translation(Vector3 delta)</code><br><code>static translation(double x, double y, double z)</code>', 'Pure translation with identity rotation.'],
              ['<code>transformPoint(Vector3 point)</code> → <code>Vector3</code>', 'Rotated and translated point.'],
              ['<code>transformVector(Vector3 vector)</code> → <code>Vector3</code><br><code>transformDirection(Vector3 direction)</code> → <code>Vector3</code>', 'Rotated value, without translation or direction normalization.'],
              ['<code>then(RigidTransform3 after)</code> → <code>RigidTransform3</code>', 'Composition that applies this transform first, then <code>after</code>.'],
              ['<code>inverse()</code> → <code>RigidTransform3</code>', 'Transform in the reverse direction, subject to numeric limits.']
            ])}
            <p>Null objects throw <code>NullPointerException</code>. Non-finite components or results throw <code>IllegalArgumentException</code>. A nonzero quaternion must have a computed squared norm that is finite and at least <code>Double.MIN_NORMAL</code>; its normalized squared norm must differ from one by at most <code>1e-12</code>. The all-zero quaternion retains the identity convention. See <a href="#/transforms">Rigid transforms</a> for composition order and examples.</p>`
        },
        {
          id: 'converter-and-geometry-api',
          title: 'Coordinate and geometry conversion methods',
          html: `<p><code>SpaceConverter3(FrameGraph3 frames)</code> retains the supplied graph. <code>frames()</code> returns that same reference; <code>transform(FrameId source, FrameId target)</code> delegates to its relative transform lookup.</p>
            ${table(['SpaceConverter3 member', 'Return type'], [
              ['<code>point(Vector3 point, FrameId source, FrameId target)</code><br><code>vector(Vector3 vector, FrameId source, FrameId target)</code><br><code>direction(Vector3 direction, FrameId source, FrameId target)</code>', '<code>Vector3</code>'],
              ['<code>toWorldPoint(FrameId source, Vector3 point)</code><br><code>toWorldVector(FrameId source, Vector3 vector)</code><br><code>toWorldDirection(FrameId source, Vector3 direction)</code>', '<code>Vector3</code> in the graph root'],
              ['<code>fromWorldPoint(FrameId target, Vector3 worldPoint)</code><br><code>fromWorldVector(FrameId target, Vector3 worldVector)</code><br><code>fromWorldDirection(FrameId target, Vector3 worldDirection)</code>', '<code>Vector3</code> in the target frame'],
              ['<code>ray(Ray ray, FrameId source, FrameId target)</code>', '<code>Ray</code>'],
              ['<code>segment(Segment3 segment, FrameId source, FrameId target)</code>', '<code>Segment3</code>'],
              ['<code>sphere(Sphere sphere, FrameId source, FrameId target)</code>', '<code>Sphere</code>'],
              ['<code>capsule(Capsule capsule, FrameId source, FrameId target)</code>', '<code>Capsule</code>'],
              ['<code>orientedBox(AxisAlignedBox box, FrameId source, FrameId target)</code><br><code>orientedBox(OrientedBox box, FrameId source, FrameId target)</code>', '<code>OrientedBox</code>'],
              ['<code>axisAlignedBox(AxisAlignedBox box, FrameId source, FrameId target)</code>', '<code>AxisAlignedBox</code> enclosing the transformed box']
            ])}
            <p><code>GeometryTransforms3</code> supplies the same seven geometry overloads as static methods with <code>RigidTransform3 transform</code> first and the geometry value second: <code>ray</code>, <code>segment</code>, <code>sphere</code>, <code>capsule</code>, two <code>orientedBox</code> overloads and <code>axisAlignedBox</code>. For example, <code>GeometryTransforms3.capsule(transform, capsule)</code> returns a <code>Capsule</code>. It has no public constructor and retains no graph.</p>
            <p>Sphere and capsule radii are copied exactly. Capsule endpoints are transformed as points. OBB conversion copies existing half extents exactly and composes the box orientation with the transform rotation. AABB-to-OBB conversion represents the rotated shape within floating-point rounding; AABB-to-AABB conversion encloses its eight transformed corners and may add empty space.</p>
            <p>These methods convert geometry. They return neither collision results nor lists of occupied cells. See <a href="#/geometry">Geometry conversion</a> for shape contracts and the AABB/OBB comparison.</p>`
        },
        {
          id: 'world-grid-api',
          title: 'World grid mapping methods',
          html: `<p><code>GridSpaceMapper3(double cellSize, Vector3 worldOrigin, ChunkScheme chunkScheme)</code> creates a world-aligned grid. <code>cellSize()</code>, <code>worldOrigin()</code> and <code>chunkScheme()</code> expose the supplied configuration. Mapping uses the scheme's positive chunk size captured at construction; custom mapping methods on the scheme are not called.</p>
            ${table(['Member', 'Return type and meaning'], [
              ['<code>worldToCell(Vector3 worldPoint)</code>', '<code>CellIndex3</code> from floor division on all three axes.'],
              ['<code>worldToChunk(Vector3 worldPoint)</code>', '<code>ChunkIndex2</code> for the mapped cell in XZ.'],
              ['<code>worldToChunkLocal(Vector3 worldPoint)</code>', '<code>ChunkLocal3</code>; X/Z are local to the chunk, Y stays the cell Y.'],
              ['<code>worldToChunkAddress(Vector3 worldPoint)</code>', '<code>ChunkAddress3</code>, containing both chunk and local coordinates.'],
              ['<code>localToCell(FrameGraph3 frames, FrameId localFrame, Vector3 localPoint)</code><br><code>localToChunk(FrameGraph3 frames, FrameId localFrame, Vector3 localPoint)</code><br><code>localToChunkLocal(FrameGraph3 frames, FrameId localFrame, Vector3 localPoint)</code><br><code>localToChunkAddress(FrameGraph3 frames, FrameId localFrame, Vector3 localPoint)</code>', 'The corresponding cell, chunk, local or address result after conversion from <code>localFrame</code> to the graph root.'],
              ['<code>cellToChunk(CellIndex3 cell)</code><br><code>cellToChunkLocal(CellIndex3 cell)</code><br><code>cellToChunkAddress(CellIndex3 cell)</code>', 'Chunk information from an existing integer cell index.'],
              ['<code>cellCorner(CellIndex3 cell)</code><br><code>cellCenter(CellIndex3 cell)</code>', '<code>Vector3</code> for the minimum corner or center in world coordinates.'],
              ['<code>worldAabbToCells(AxisAlignedBox box)</code>', '<code>IntBox3</code>, a half-open cell range.'],
              ['<code>worldAabbToChunks(AxisAlignedBox box)</code>', '<code>IntRect2</code>, a half-open XZ chunk range.'],
              ['<code>localAabbToCells(FrameGraph3 frames, FrameId localFrame, AxisAlignedBox localBox)</code><br><code>localAabbToChunks(FrameGraph3 frames, FrameId localFrame, AxisAlignedBox localBox)</code>', 'The corresponding range after enclosing the transformed box in world axes.']
            ])}
            <p><code>cellSize</code> must be positive and finite, and the origin must be finite. Cell indices must fit signed 32-bit integers. Range maximums are excluded and must be representable; each range dimension must fit <code>int</code>. The mapper returns indices and bounds, with no allocation of voxel storage. See <a href="#/grid-mapping">Grid mapping</a> and <a href="#/cell-ranges">Cell ranges</a>.</p>`
        },
        {
          id: 'attached-grid-api',
          title: 'Frame-attached grid and chunk helpers',
          html: `<p><code>FrameGridSpaceMapper3(FrameGraph3 frames, FrameId gridFrame, double cellSize, Vector3 gridOrigin, ChunkScheme chunkScheme)</code> requires an existing grid frame. <code>frames()</code>, <code>gridFrame()</code>, <code>cellSize()</code>, <code>gridOrigin()</code> and <code>chunkScheme()</code> expose its graph and configuration. Origin and cell size use grid-frame units.</p>
            ${table(['Member family', 'Contract'], [
              ['<code>worldToCell(Vector3 worldPoint)</code><br><code>worldToChunk(Vector3 worldPoint)</code><br><code>worldToChunkLocal(Vector3 worldPoint)</code><br><code>worldToChunkAddress(Vector3 worldPoint)</code>', 'Converts a root/world point into the grid frame, then returns <code>CellIndex3</code>, <code>ChunkIndex2</code>, <code>ChunkLocal3</code> or <code>ChunkAddress3</code>.'],
              ['<code>localToCell(FrameId source, Vector3 point)</code><br><code>localToChunk(FrameId source, Vector3 point)</code><br><code>localToChunkLocal(FrameId source, Vector3 point)</code><br><code>localToChunkAddress(FrameId source, Vector3 point)</code>', 'Converts directly from <code>source</code> into the grid frame, then returns the corresponding index or address.'],
              ['<code>cellCorner(CellIndex3 cell)</code><br><code>cellCenter(CellIndex3 cell)</code>', 'Returns a <code>Vector3</code> in the root/world frame. A rotated local minimum corner is not necessarily the minimum of a world AABB.'],
              ['<code>cellCorner(CellIndex3 cell, FrameId target)</code><br><code>cellCenter(CellIndex3 cell, FrameId target)</code>', 'Returns the point directly in <code>target</code>.'],
              ['<code>worldAabbToCells(AxisAlignedBox box)</code><br><code>worldAabbToChunks(AxisAlignedBox box)</code>', 'Returns <code>IntBox3</code> or <code>IntRect2</code> after enclosure in grid axes.'],
              ['<code>localAabbToCells(FrameId source, AxisAlignedBox box)</code><br><code>localAabbToChunks(FrameId source, AxisAlignedBox box)</code>', 'Returns the corresponding range for a box expressed in <code>source</code>.'],
              ['<code>snapshot()</code> → <code>FrameGridSpaceMapper3</code>', 'Freezes the retained graph. Returns this mapper if its graph is already frozen.']
            ])}
            <p><code>ChunkAddress3(ChunkIndex2 chunk, ChunkLocal3 local)</code> exposes <code>chunk()</code> and <code>local()</code>. Both values must be nonnull.</p>
            <p><code>ChunkLocalIndexer(int chunkSize)</code> requires a positive size and exposes <code>chunkSize()</code>. <code>chunkOfCell(CellIndex3 cell)</code> returns <code>ChunkIndex2</code> using floor division in XZ. <code>localOfCell(CellIndex3 cell)</code> returns <code>ChunkLocal3</code> using floor modulo in XZ and preserving cell Y. Both reject null cells.</p>`
        },
        {
          id: 'results-and-costs',
          title: 'Empty results, exceptions and operation costs',
          html: `${table(['Condition', 'Result'], [
            ['Unknown nonnull ID passed to <code>contains</code>', '<code>false</code>.'],
            ['Existing root passed to <code>parentOf</code>', '<code>Optional.empty()</code>.'],
            ['Unknown ID passed to a required frame lookup or conversion', '<code>IllegalArgumentException</code>, including unknown-to-itself conversion.'],
            ['Null object argument', 'Normally <code>NullPointerException</code>. <code>FrameId(null)</code> instead throws <code>IllegalArgumentException</code>. A root definition permits a null parent.'],
            ['Mutation of a frozen graph', '<code>UnsupportedOperationException</code>, checked before mutation arguments.'],
            ['Invalid finite range, non-finite numeric value or arithmetic overflow', '<code>IllegalArgumentException</code>. Finite rounded results can still lose spatial precision.'],
            ['Zero extent of the mapped AABB', 'Cell ranges are empty if any mapped axis has zero extent. Chunk ranges consider only mapped XZ extent. Enclosure after rotation can change extents.']
          ])}
          ${table(['Operation', 'Expected cost'], [
            ['Fixed transform or geometry conversion', '<code>O(1)</code>; AABB enclosure transforms eight corners.'],
            ['Relative graph conversion', '<code>O(hs + ht)</code> parent-link inspection for source and target depths. Only edges below the common ancestor are composed.'],
            ['<code>rootFrom</code> or <code>define</code>', '<code>O(h)</code> for the relevant parent chain.'],
            ['<code>frames()</code> or snapshot of a mutable graph', '<code>O(n)</code> time and additional memory for <code>n</code> definitions.'],
            ['<code>remove</code> / <code>removeSubtree</code>', '<code>O(n)</code> time; respectively <code>O(1)</code> / <code>O(n)</code> additional memory.'],
            ['World grid point or range mapping', '<code>O(1)</code> arithmetic. A returned range is not enumerated.'],
            ['Frame-attached point, center or range conversion', 'A relative frame lookup plus fixed-size mapping.']
          ])}
          <p>Hash-map lookups are assumed to take constant expected time. Graph walks use constant live additional memory but allocate temporary transform values as they compose edges. There is no transform cache. These are operation counts, not measured latency or an allocation-free guarantee.</p>`
        }
      ]
    },
    {
      id: 'troubleshooting',
      category: 'Reference',
      title: 'Troubleshooting',
      description: 'Find the cause of frame errors, inconsistent poses, boundary results and precision loss.',
      kind: 'guide',
      intro: '<p>Check the source frame, target frame and graph state first. Then inspect the numeric values in the coordinate system used by the operation. A valid finite value can still have too little precision to distinguish nearby cells.</p>',
      sections: [
        {
          id: 'unknown-frame',
          title: 'A conversion reports an unknown frame',
          html: `<p><code>IllegalArgumentException: unknown frame: ...</code> means the ID is absent from the graph used by that query. Check <code>converter.frames().contains(id)</code> or <code>mapper.frames().contains(id)</code> on the actual adapter. A matching string in another graph does not define it in this graph.</p>
            <p>Define parents before children. Keep frames present for all live operations that reference them. After removal, existing snapshots can still contain a frame while the live graph does not. Constructing a frame-attached mapper requires its grid frame to exist; trying to snapshot a live mapper after its grid frame was removed also fails.</p>
            <p>Converting an unknown ID to the same unknown ID still throws. Use <code>contains</code> when absence is an expected condition, then perform the complete query while the graph remains stable. See <a href="#/frame-chains">Frame chains</a>.</p>`
        },
        {
          id: 'mutation-errors',
          title: 'A frame cannot be changed or removed',
          html: `${table(['Message or exception', 'Cause and next action'], [
            ['<code>cannot modify a frame graph snapshot</code>', 'The graph is frozen. Apply updates to the live graph, then capture a new snapshot for later queries.'],
            ['<code>cannot redefine root frame</code><br><code>cannot remove root frame</code>', 'The root remains the graph origin. Place a movable frame below it.'],
            ['<code>parent frame is not defined: ...</code>', 'Define the intended parent in this graph before defining its child.'],
            ['<code>frame definition would create a cycle: ...</code>', 'The chosen parent is the frame itself or one of its descendants. Choose a parent outside that subtree.'],
            ['<code>frame has children: ...</code>', '<code>remove</code> accepts only a leaf. Remove or reparent its children first, or use <code>removeSubtree</code> when all descendants should be removed.']
          ])}
          <p>Rejected operations leave the graph unchanged. Reparenting keeps descendants attached and interprets the new <code>parentFromFrame</code> relative to the new parent. If the object changes world pose after reparenting, check that supplied transform; the operation does not preserve its old world pose automatically.</p>`
        },
        {
          id: 'inconsistent-pose',
          title: 'The ray and grid result describe different poses',
          html: `<p>Check whether a mutable graph changed between conversion and indexing. A returned ray stays unchanged, but a later call through a converter retaining the live graph can use a newer pose. The same mismatch can occur when two adapters receive snapshots captured at different times.</p>
            <p>Capture one <code>FrameGraph3</code> while the source is stable and share it across every adapter in the query. Keep tracing data and voxel storage consistent through your own integration. Ashspace snapshots freeze frame definitions only.</p>
            <p>If repeated calls using the same snapshot differ, compare the actual input values and mapper settings. Repeatability requires equal inputs, definitions, configuration, dependency versions and the same runtime environment. Cross-JDK or cross-release bitwise agreement is not promised. See <a href="#/spaces-and-snapshots">Conversions and snapshots</a>.</p>`
        },
        {
          id: 'wrong-conversion-direction',
          title: 'A point rotates or translates in the wrong direction',
          html: `<p><code>parentFromFrame</code> converts from child to parent, and <code>transform(source, target)</code> returns a transform from source to target. Check whether the supplied pose instead describes parent-to-child coordinates; use its inverse when that is the direction you actually have.</p>
            <p><code>a.then(b)</code> applies <code>a</code> first and <code>b</code> second. Use <code>point</code> for positions and <code>vector</code> or <code>direction</code> for offsets and directions. A direction deliberately ignores translation and is not normalized by the transform method.</p>
            <p>Ashcore's <code>Quaternion.fromAxisAngle</code> takes radians. A 90-degree turn is <code>Math.PI / 2.0</code>. The convention is right-handed with Y up: a positive 90-degree turn about Y maps positive X toward negative Z. See <a href="#/transforms">Rigid transforms</a>.</p>`
        },
        {
          id: 'unexpected-cells',
          title: 'A boundary point maps to an unexpected cell',
          html: `<p>Point lookup evaluates <code>floor((coordinate - origin) / cellSize)</code> on each grid axis. With unit cells at zero, X = <code>-0.2</code> belongs to cell X = <code>-1</code>. Truncating a negative value toward zero in caller code gives a different rule.</p>
            <p>Check the coordinate system of the origin. <code>GridSpaceMapper3.worldOrigin</code> is a world point; <code>FrameGridSpaceMapper3.gridOrigin</code> is expressed in the attached frame. A custom <code>ChunkScheme</code> changes the captured chunk size only; its custom point or range mapping methods are not used.</p>
            <p>Decimal subtraction and division are rounded doubles. The mapper adds no epsilon to move a point across a boundary. A nonzero quotient that underflows to signed zero keeps its side of the boundary for floor/ceil selection, but this does not recover lost distance precision.</p>
            <p>AABB range maximums are excluded. A zero-extent mapped axis makes a cell range empty, whereas chunk ranges ignore mapped Y extent. See <a href="#/grid-mapping">Grid mapping</a> and <a href="#/cell-ranges">Cell ranges</a> for boundary examples.</p>`
        },
        {
          id: 'extra-range-cells',
          title: 'A rotated box selects cells outside the shape',
          html: `<p>A rotated AABB is enclosed in the destination grid axes before range mapping. Cells in that enclosing range can lie outside the rotated shape. The result is a conservative region to examine; it is not a collision result or an exact list of occupied cells.</p>
            <p>Use <code>orientedBox</code> when you need the rotated box shape, then apply the appropriate collision or occupancy check in the consuming library. AABB boundaries and geometric contact checks also have different semantics from the mapper's half-open integer ranges. See <a href="#/geometry">Geometry conversion</a>.</p>`
        },
        {
          id: 'numeric-limits',
          title: 'Numeric conversion fails or loses small offsets',
          html: `<p><code>IllegalArgumentException</code> with a finite-value or integer-range message means a component, intermediate result or output exceeded the accepted range. Check all three coordinates, including Y for chunk point queries. A positive finite <code>cellSize</code> can still be too small for a particular coordinate difference.</p>
            <p><code>rotation outside supported normalization range</code> means a nonzero quaternion's computed squared norm overflowed or fell below <code>Double.MIN_NORMAL</code>. Use a finite rotation in the supported normalization range. The all-zero <code>RigidTransform3</code> quaternion means identity, while an Ashcore OBB requires a nonzero orientation.</p>
            <p>If distinct cell centers become equal, inspect the ratio between coordinate magnitude and cell size. At origin X = <code>2^54</code> with unit cells, the world centers of cells 0 and 1 round to the same double. Keep the working origin near the data, or use direct frame-to-frame queries for nearby objects sharing an ancestor. Increasing numeric tolerance cannot restore bits that were already lost.</p>
            <p>Range dimensions and exclusive maximums also have integer limits. Bound the total number of cells with checked arithmetic and a caller-owned work limit before allocating storage or iterating a range. A valid range can still be too large for the intended operation.</p>`
        },
        {
          id: 'missing-runtime-class',
          title: 'A consumer cannot load an Ashcore or Ashgrid class',
          html: `<p>Check the dependency tree and the contents of the consumer's runtime artifact. Ashspace's public methods use Ashcore and Ashgrid types. Compiling against the dependency does not by itself put those libraries into a standalone Minecraft plugin JAR.</p>
            <p>Ashspace <code>2.0.0</code> uses Ashcore <code>1.2.0</code> and Ashgrid <code>1.3.0</code>. OBB methods require the <code>OrientedBox</code> type supplied by Ashcore <code>1.2.0</code>; forcing an older Ashcore can leave that class unavailable. Inspect version overrides and shading rules in the consumer project.</p>
            ${cards([
              { id: 'installation', title: 'Installation', text: 'Use the published dependency and package its runtime requirements.' },
              { id: 'api-reference', title: 'API reference', text: 'Check exact method names, argument order and error contracts.' }
            ])}`
        }
      ]
    }
  );
})();
