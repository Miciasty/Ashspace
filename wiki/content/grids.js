(() => {
  const {code, table, note, cards} = window.WIKI_UI;
  window.WIKI_PAGES.push(
    {
      id:'geometry', category:'Spatial model', title:'Geometry conversion', description:'Move rays and shapes between coordinate systems, and choose an OBB or an enclosing AABB.', kind:'concept',
      intro:'<p>A rigid transform changes a shape’s position and orientation. It preserves lengths within floating-point rounding. Ashspace uses Ashcore geometry types and returns new values after conversion.</p>',
      sections:[
        {id:'choose-the-result',title:'Choose the result shape',html:table(['Input','Method on GeometryTransforms3','Meaning of the result'],[
          ['<code>Ray</code>','<code>ray(transform, ray)</code>','Origin is rotated and translated; direction is rotated. A valid unit direction keeps the ray parameter in distance units.'],
          ['<code>Segment3</code>','<code>segment(transform, segment)</code>','Both endpoints move.'],
          ['<code>Sphere</code>','<code>sphere(transform, sphere)</code>','Center moves; radius is copied.'],
          ['<code>Capsule</code>','<code>capsule(transform, capsule)</code>','Both endpoints move; radius is copied exactly.'],
          ['<code>AxisAlignedBox</code>','<code>orientedBox(transform, box)</code>','An OBB follows the rotated box’s shape.'],
          ['<code>OrientedBox</code>','<code>orientedBox(transform, box)</code>','Center moves, orientations compose, and half extents are copied exactly.'],
          ['<code>AxisAlignedBox</code>','<code>axisAlignedBox(transform, box)</code>','An AABB encloses all eight transformed corners. It may include extra space.']
        ])},
        {id:'box-and-enclosure',title:'A box and its enclosure',html:`<p>An axis-aligned bounding box (AABB) follows the axes of its coordinate system. An oriented bounding box (OBB) has its own orientation. After a rotation, the smallest axis-aligned enclosure of the computed corners generally occupies more space than the box.</p><p>Rotate the rectangular cross-section below. The OBB outline follows the shape; the AABB outline follows the destination axes. Compare their areas to see how much extra space the enclosure adds. The separate Java example below tests a probe against a rotated cube.</p><div data-diagram="geometry"></div>${note('A candidate is not a collision', '<p>Use the enclosure to select candidate cells or objects. Apply the actual shape test separately when your query requires exact contact. Ashspace converts geometry; Ashcore or your collision system performs that test.</p>')}`},
        {id:'convert-a-box',title:'Convert a box',html:code(`import nsk.nu.ashcore.api.collision.CollisionTests;
import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.geometry.OrientedBox;
import nsk.nu.ashcore.api.geometry.Sphere;
import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashspace.api.geometry.GeometryTransforms3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

public final class GeometryConversionExample {
    public static void main(String[] args) {
        AxisAlignedBox box = new AxisAlignedBox(
                new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
        RigidTransform3 turn = new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4),
                Vector3.ZERO);
        OrientedBox shape = GeometryTransforms3.orientedBox(turn, box);
        AxisAlignedBox enclosure = GeometryTransforms3.axisAlignedBox(turn, box);
        Vector3 probe = new Vector3(1.3, 0, 1.3);
        boolean candidate = enclosure.contains(probe);
        boolean contact = CollisionTests.sphereVsOrientedBox(
                new Sphere(probe, 0), shape);
        assert candidate && !contact;
        System.out.println("insideEnclosure=" + candidate);
        System.out.println("insideShape=" + contact);
    }
}`, 'GeometryConversionExample.java')},
        {id:'named-frame-conversion',title:'Convert between named frames',html:`<p><code>SpaceConverter3</code> supplies matching instance methods with <code>(shape, source, target)</code> arguments. For example, <code>converter.capsule(tool, ship, world)</code> converts the tool capsule from the ship frame into the world frame. Each call resolves one relative transform from the retained graph.</p><p>For an OBB that already has an orientation, the original box orientation is applied first, then the transform rotation. AABB range mapping still uses an enclosure even when OBB conversion is available.</p>`},
        {id:'geometry-limits',title:'Shape and numeric limits',html:`<p>Radii and half extents must be finite and non-negative. Equal capsule endpoints represent a sphere; zero radius gives a segment or point. A box may have zero half extents. Ashcore requires an OBB orientation to be finite and nonzero; a zero OBB quaternion is invalid.</p><p>Conversions reject non-finite bounds and transformed coordinates. Large translations can collapse distinct points through rounding. Very small AABB dimensions can disappear when converted to half extents. Preserving a shape describes the rigid model, not a universal floating-point error bound.</p><p>The example uses moderate coordinates and tests one probe. Its result does not guarantee collision support at extreme magnitudes.</p>`}
      ]
    },
    {
      id:'grid-mapping',category:'Grid mapping',title:'Cells and chunks',description:'Map continuous positions to signed cell indices and square XZ chunk addresses.',kind:'concept',
      intro:'<p>A cell index identifies one cube in a grid. A chunk groups cells along X and Z. <code>GridSpaceMapper3</code> converts world coordinates into these indices without storing any cell contents.</p>',
      sections:[
        {id:'floor-rule',title:'Apply the floor rule',html:`<p>For each axis, the mapper evaluates <code>floor((world − worldOrigin) / cellSize)</code>. The origin is the minimum corner of cell <code>(0, 0, 0)</code>, in world units. The positive cell size is an edge length in the same units.</p><p>Move the point across zero and cell boundaries. The figure shows the X-axis slice of world point <code>(X, 64.5, −1.25)</code> with zero grid origin. Change the cell size to see all three cell indices change. Chunk-local Y remains the resulting global cell Y.</p><div data-diagram="grid"></div><p>With unit cells and zero origin, <code>−0.2</code> belongs to cell <code>−1</code>. Casting that coordinate to an integer would give the wrong cell. A point exactly at <code>1</code> belongs to cell <code>1</code>.</p>`},
        {id:'chunk-address',title:'Split a cell into an address',html:`<p>For chunk edge length <code>N</code> in cells, chunk X and Z use floor division. Chunk-local X and Z use floor modulo and remain in <code>[0, N)</code>. Chunk-local Y is copied from the global cell Y.</p>${table(['Cell X','Chunk X (N = 16)','Local X'],[['−17','−2','15'],['−16','−1','0'],['−1','−1','15'],['0','0','0'],['15','0','15'],['16','1','0']])}<p><code>ChunkAddress3</code> pairs <code>ChunkIndex2 chunk</code> with <code>ChunkLocal3 local</code>. Reconstruct X as <code>chunk.cx() * N + local.lx()</code>, using a sufficiently wide intermediate integer type. The same relationship holds for Z.</p>`},
        {id:'map-a-point',title:'Map a negative position',html:code(`import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashspace.api.grid.ChunkAddress3;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;

public final class NegativeGridExample {
    public static void main(String[] args) {
        GridSpaceMapper3 grid = new GridSpaceMapper3(
                1.0, Vector3.ZERO, new SquareXZChunkScheme(16));
        CellIndex3 cell = grid.worldToCell(new Vector3(-0.2, 5, -16.1));
        ChunkAddress3 address = grid.cellToChunkAddress(cell);
        assert cell.equals(new CellIndex3(-1, 5, -17));
        assert address.chunk().cx() == -1;
        assert address.chunk().cz() == -2;
        assert address.local().lx() == 15;
        assert address.local().ly() == 5;
        assert address.local().lz() == 15;
        System.out.println(address);
    }
}`, 'NegativeGridExample.java')},
        {id:'mapper-methods',title:'Choose the mapping route',html:table(['Input','Methods','Output'],[
          ['World point','<code>worldToCell</code>, <code>worldToChunk</code>, <code>worldToChunkLocal</code>, <code>worldToChunkAddress</code>','Containing cell or address.'],
          ['Local point plus graph and frame','<code>localToCell</code>, <code>localToChunk</code>, <code>localToChunkLocal</code>, <code>localToChunkAddress</code>','The local point is first transformed to the root/world frame.'],
          ['Cell index','<code>cellToChunk</code>, <code>cellToChunkLocal</code>, <code>cellToChunkAddress</code>','Integer-only chunk decomposition.'],
          ['Cell index','<code>cellCorner</code>, <code>cellCenter</code>','Minimum corner or center in world coordinates.']
        ])},
        {id:'grid-configuration',title:'Configuration and precision',html:`<p>Construct a mapper with a positive finite <code>cellSize</code>, a finite <code>worldOrigin</code>, and a <code>ChunkScheme</code> with positive <code>chunkSize()</code>. The mapper captures that size once. It retains the scheme reference but does not call the scheme’s custom coordinate, bounds, range, or neighborhood methods.</p>${note('Square XZ chunks only','<p>A custom scheme cannot change the mapper into an irregular chunk layout. Use the standard <code>SquareXZChunkScheme</code> from Ashgrid. It currently lives under <code>nsk.nu.ashgrid.implementation.grid.indexing</code>.</p>')}<p>All point routes require X, Y, and Z cell indices to fit signed <code>int</code>, even when requesting only an XZ chunk. Inputs and intermediate results must be finite. Invalid values raise <code>IllegalArgumentException</code>; null objects raise <code>NullPointerException</code>.</p><p>Mapping uses rounded double subtraction and division without a boundary epsilon. If a nonzero quotient underflows to zero, its sign is preserved for boundary selection. This does not recover already lost coordinate precision. At origin X = <code>2^54</code> with unit cells, distinct centers can round to the same world point. Keep origins near the work area and use a cell size that remains distinguishable.</p>`}
      ]
    },
    {
      id:'frame-grids',category:'Grid mapping',title:'Grids on moving frames',navTitle:'Frame-attached grids',description:'Give a ship its own cell grid and convert world or tool coordinates into that grid.',kind:'guide',
      sections:[
        {id:'choose-grid-frame',title:'Choose the grid’s coordinate system',html:`<p>A world-aligned mapper keeps its grid fixed while local objects move through it. <code>FrameGridSpaceMapper3</code> attaches the grid origin and axes to a named frame. When the ship moves or turns, its grid moves or turns with it.</p>${table(['Property','GridSpaceMapper3','FrameGridSpaceMapper3'],[
          ['Grid axes','Root/world axes','Axes of <code>gridFrame</code>'],
          ['Origin','<code>worldOrigin</code> in world units','<code>gridOrigin</code> in grid-frame units'],
          ['Local lookup','Local → world → fixed grid','Source frame → grid frame → indices'],
          ['<code>cellCenter(cell)</code>','World position','World position of the attached cell'],
          ['<code>cellCenter(cell, target)</code>','Not provided','Position expressed in another frame']
        ])}<p><code>cellSize</code> changes index spacing. It does not scale the ship transform. Chunk-local Y remains the grid’s cell Y even when the grid turns in world space.</p>`},
        {id:'create-attached-grid',title:'Attach and freeze a ship grid',html:code(`import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.FrameGridSpaceMapper3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

public final class AttachedGridExample {
    public static void main(String[] args) {
        FrameGraph3 frames = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        frames.define(ship, frames.root(), new RigidTransform3(
                Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2),
                new Vector3(10, 0, -4)));
        FrameGridSpaceMapper3 liveGrid = new FrameGridSpaceMapper3(
                frames, ship, 0.5, Vector3.ZERO, new SquareXZChunkScheme(16));
        FrameGridSpaceMapper3 queryGrid = liveGrid.snapshot();
        CellIndex3 cell = new CellIndex3(1, 0, 1);
        Vector3 worldCenter = queryGrid.cellCenter(cell);
        assert queryGrid.worldToCell(worldCenter).equals(cell);
        assert queryGrid.localToCell(ship, new Vector3(0.75, 0.25, 0.75)).equals(cell);
        frames.remove(ship);
        assert queryGrid.worldToCell(worldCenter).equals(cell);
        System.out.println("snapshotCell=" + queryGrid.worldToCell(worldCenter));
    }
}`, 'AttachedGridExample.java')},
        {id:'read-attached-result',title:'Keep the pose and the storage consistent',html:`<p>The cell center is <code>(0.75, 0.25, 0.75)</code> in the ship frame. The frozen mapper converts that center into world coordinates and back, even after the ship is removed from the live graph. A later query through <code>liveGrid</code> would reject the missing ship.</p><p>For a tool already attached to the ship, call <code>localToCell(toolFrame, toolPoint)</code>. It resolves the source-to-grid transform through their common ancestor. Converting to world and then back can discard small offsets at large world translations.</p><p><code>cellCorner</code> transforms the cell’s minimum local corner. After rotation, that point need not be the minimum of its world-space AABB. Range methods first enclose the converted corners in the grid frame; see <a href="#/cell-ranges">cell ranges</a>.</p>${note('A snapshot contains frame definitions','<p>The mapper snapshot shares its fixed mapping configuration and freezes its graph. It does not copy voxel contents, a tracing index, or Minecraft state. Keep those data consistent with the selected pose in your own query lifecycle.</p>')}${cards([{id:'spaces-and-snapshots',title:'Compare live and frozen state',text:'See which queries observe later updates.'},{id:'frame-chains',title:'Convert through a common ancestor',text:'Understand direct tool-to-tool and tool-to-grid conversion.'}])}`}
      ]
    },
    {
      id:'cell-ranges',category:'Grid mapping',title:'Cell and chunk ranges',navTitle:'Half-open ranges',description:'Convert an AABB into a half-open integer range and interpret conservative results after rotation.',kind:'concept',
      sections:[
        {id:'excluded-maximum',title:'The maximum is excluded for mapping',html:`<p><code>worldAabbToCells(box)</code> returns an Ashgrid <code>IntBox3</code>. Its lower endpoint is included and its upper endpoint is excluded. With unit cells, a box from <code>(0, 0, 0)</code> to <code>(2, 1, 1)</code> maps to X cells <code>0</code> and <code>1</code>, Y cell <code>0</code>, and Z cell <code>0</code>.</p><p>Adjust the X bounds below. The filled cells form <code>[floor(min), ceil(max))</code> for this moderate, unit-grid example. Looking up a point exactly at the maximum is a different operation: that point can belong to the next cell.</p><div data-diagram="ranges"></div>${note('Geometry and indexing have different boundary rules','<p>Ashcore geometric contact tests may include the AABB boundary. Ashspace excludes the normalized maximum when selecting a range. This rule belongs to the mapper; it does not redefine every AABB as half-open.</p>')}`},
        {id:'range-example',title:'Inspect a range',html:code(`import nsk.nu.ashcore.api.geometry.AxisAlignedBox;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;

public final class CellRangeExample {
    public static void main(String[] args) {
        GridSpaceMapper3 grid = new GridSpaceMapper3(
                1, Vector3.ZERO, new SquareXZChunkScheme(16));
        AxisAlignedBox box = new AxisAlignedBox(
                Vector3.ZERO, new Vector3(2, 1, 1));
        var cells = grid.worldAabbToCells(box);
        assert cells.minX() == 0 && cells.maxX() == 2;
        assert cells.minY() == 0 && cells.maxY() == 1;
        assert cells.minZ() == 0 && cells.maxZ() == 1;
        assert grid.worldToCell(box.max()).equals(new CellIndex3(2, 1, 1));
        System.out.println("cellRange=" + cells);
    }
}`, 'CellRangeExample.java')},
        {id:'empty-and-chunk-ranges',title:'Empty extents and chunk projection',html:`<p>A zero extent on any axis makes a cell range empty. <code>worldAabbToChunks</code> returns an <code>IntRect2</code> in XZ and ignores Y extent. A zero-height box can therefore cover chunks even when its cell range is empty. All supplied coordinates and normalized arithmetic still have to be finite.</p><p>Ashcore’s <code>AxisAlignedBox</code> constructor rejects reversed endpoints. The mapper never receives such a valid box. Extents that collapse through floating-point rounding also produce an empty range.</p>`},
        {id:'rotated-range',title:'Rotated boxes produce conservative ranges',html:`<p><code>localAabbToCells</code> transforms all eight corners and builds an enclosure in the destination grid frame before indexing. Some selected cells may lie outside the original rotated box. Chunk ranges make a further XZ projection of that enclosure.</p><p>For an attached grid, empty extents are interpreted after conversion and enclosure. A flat rectangle can have nonzero extents on all three destination axes after rotation. See the <a href="#/geometry?section=box-and-enclosure">box and enclosure figure</a> for the geometric distinction.</p><p>Use these ranges to bound a search. Test candidate cells against the actual geometry when that distinction matters to gameplay.</p>`},
        {id:'bound-iteration',title:'Bound the work before iterating',html:`<p>Both integer endpoints and each range dimension must fit signed <code>int</code>. Because the maximum is exclusive, a cell range cannot include cell <code>Integer.MAX_VALUE</code>; point lookup can still return that cell. A chunk range can cover it only if the exclusive chunk maximum fits.</p><p>A valid range can still contain too many cells for your query. Compute its total count with checked arithmetic and apply your own workload limit before allocating or iterating. The following helper accepts an application-selected limit; it does not prescribe a server-wide budget.</p>${code(`import nsk.nu.ashgrid.api.grid.bounds.IntBox3;

public final class RangeBudgetExample {
    static long checkedCount(IntBox3 box, long maximumCells) {
        if (maximumCells < 0) throw new IllegalArgumentException("maximumCells");
        long x = (long) box.maxX() - box.minX();
        long y = (long) box.maxY() - box.minY();
        long z = (long) box.maxZ() - box.minZ();
        if (x == 0 || y == 0 || z == 0) return 0;
        long count = Math.multiplyExact(Math.multiplyExact(x, y), z);
        if (count > maximumCells) throw new IllegalArgumentException("Range exceeds query budget");
        return count;
    }

    public static void main(String[] args) {
        assert checkedCount(new IntBox3(0, 0, 0, 2, 1, 1), 100) == 2;
        System.out.println("count=2");
    }
}`, 'RangeBudgetExample.java')}<p>Overflow raises <code>ArithmeticException</code> in this caller-owned helper. No large allocation occurs before the check.</p>`}
      ]
    }
  );
})();
