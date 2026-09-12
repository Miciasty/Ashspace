(() => {
  const {code, table, note, cards} = window.WIKI_UI;
  window.WIKI_PAGES.push(
    {
      id: 'overview', category: 'Getting started', title: 'Ashspace', kind: 'concept',
      description: 'Coordinate frames, rigid transforms, and grid mapping for your Minecraft plugin.',
      intro: '<p>A tool stays in the same place on a ship while the ship moves through the world. Ashspace converts that local position into world coordinates, another tool’s frame, or a voxel cell. You supply the pose; the library supplies the coordinate math.</p>',
      sections: [
        {id: 'from-tool-to-cell', title: 'From a tool to a cell', html: `
          <div class="my-6 grid grid-cols-3 gap-3 max-[680px]:grid-cols-1">
            <div class="rounded-md border border-line bg-surface p-4"><span class="font-mono text-[11px] text-accent">01 / LOCAL</span><h3>Tool position</h3><p>A point relative to the ship’s origin and axes.</p></div>
            <div class="rounded-md border border-line bg-surface p-4"><span class="font-mono text-[11px] text-accent">02 / TRANSFORM</span><h3>World position</h3><p>Rotate the point, then add the ship’s translation.</p></div>
            <div class="rounded-md border border-line bg-surface p-4"><span class="font-mono text-[11px] text-accent">03 / GRID</span><h3>Cell address</h3><p>Apply floor mapping, then split the cell into chunk and local indices.</p></div>
          </div>
          <p>Use a world-aligned grid for terrain. Use a frame-attached grid for cells that move with the ship. Direct frame-to-frame conversion also lets two tools share coordinates without an intermediate world point.</p>
          ${cards([{id:'quick-start',title:'Build your first conversion',text:'Define a ship frame and locate one of its points in a grid.'},{id:'coordinate-spaces',title:'Explore coordinate spaces',text:'Move and rotate a frame. Compare a point with a direction.'}])}`},
        {id: 'choose-an-api', title: 'Choose an API', html: table(['You need to…','Use','Result'],[
          ['Name and connect coordinate frames','<a href="#/frame-chains"><code>FrameGraph3</code></a>','A parent chain with relative poses.'],
          ['Rotate and translate a value','<a href="#/transforms"><code>RigidTransform3</code></a>','A point or vector in a new coordinate system.'],
          ['Convert between named frames','<a href="#/coordinate-spaces"><code>SpaceConverter3</code></a>','Points, directions, rays, and shapes in the target frame.'],
          ['Move geometry with a known transform','<a href="#/geometry"><code>GeometryTransforms3</code></a>','Transformed shapes or an enclosing AABB.'],
          ['Index a world-aligned grid','<a href="#/grid-mapping"><code>GridSpaceMapper3</code></a>','Cell, chunk, chunk-local address, or half-open range.'],
          ['Attach a grid to a moving frame','<a href="#/frame-grids"><code>FrameGridSpaceMapper3</code></a>','The same index operations in that frame’s grid.'],
          ['Keep one pose for a complete query','<a href="#/spaces-and-snapshots"><code>snapshot()</code></a>','Frozen frame definitions for later reads.']
        ])},
        {id: 'library-boundaries', title: 'Where Ashspace fits', html: `<p>Ashspace is a Java 21 library packaged with your application or plugin. It has no server entry point, commands, permissions, or configuration file. A frame named <code>world</code> is the graph’s root, not a Bukkit world reference.</p>
          ${table(['Project','Responsibility'],[
            ['<a href="https://github.com/Miciasty/Ashcore">Ashcore 1.2.0</a>','Vectors, quaternions, shapes, and collision math used by the public API.'],
            ['<strong>Ashspace 2.0.0</strong>','Frame relationships, rigid conversion, and coordinates-to-indices mapping.'],
            ['<a href="https://github.com/Miciasty/Ashgrid">Ashgrid 1.3.0</a>','Grid indices and storage/traversal APIs.'],
            ['Your plugin','World selection, pose updates, synchronization, persistence, and gameplay.']
          ])}
          <p>Ashspace does not simulate motion, trace Minecraft blocks, render shapes, or search for paths. All transforms preserve scale. Coordinates use a right-handed system with Y up.</p>`},
        {id: 'read-the-wiki', title: 'Read the WIKI', html: `<p>Start with installation and the runnable example. The spatial model pages explain the geometry; the grid pages explain indexing and boundary rules. Each interactive figure illustrates the documented equations in your browser. It does not run Java or a Minecraft server.</p>${cards([{id:'grid-mapping',title:'Understand negative coordinates',text:'See why −0.2 maps to cell −1, and why chunk-local X becomes 15.'},{id:'spaces-and-snapshots',title:'Keep a query consistent',text:'Compare a moving live graph with a frozen pose.'}])}<p>This WIKI describes the current <code>2.0.0</code> checkout. See <a href="#/changelog">Changelog</a> for migration behavior and <a href="#/api-reference">API reference</a> for exact type names.</p>`}
      ]
    },
    {
      id:'installation', category:'Getting started', title:'Installation', description:'Add Ashspace 2.0.0 to a Java project and make its dependencies available at runtime.', kind:'guide',
      sections:[
        {id:'requirements',title:'Requirements',html:`<p>Use JDK 21 or newer. Ashspace depends on Ashcore <code>1.2.0</code> and Ashgrid <code>1.3.0</code>. Both are transitive Maven dependencies. Your server or application must also run Java 21 or newer.</p><p>All three artifacts use Maven Central. Their dependency coordinates differ from the Java package names: the group is <code>dev.nasaka.blackframe</code>, while imports start with <code>nsk.nu</code>.</p>`},
        {id:'maven',title:'Add the Maven dependency',html:`<p>Put this entry inside your project’s <code>dependencies</code> element.</p>${code(`<dependency>
  <groupId>dev.nasaka.blackframe</groupId>
  <artifactId>ashspace</artifactId>
  <version>2.0.0</version>
</dependency>`, 'pom.xml','xml')}<p>Maven resolves the two library dependencies automatically. No extra repository entry is needed.</p>`},
        {id:'gradle',title:'Add the Gradle dependency',html:`<p>For Gradle Kotlin DSL, enable Maven Central and declare the dependency.</p>${code(`repositories {
    mavenCentral()
}

dependencies {
    implementation("dev.nasaka.blackframe:ashspace:2.0.0")
}

java {
    toolchain.languageVersion.set(JavaLanguageVersion.of(21))
}`, 'build.gradle.kts','kotlin')}<p>Use the equivalent <code>implementation 'dev.nasaka.blackframe:ashspace:2.0.0'</code> syntax in a Groovy build.</p>`},
        {id:'plugin-runtime',title:'Package a Minecraft plugin',html:`<p>Declare the dependency in your plugin’s build. Then include Ashspace, Ashcore, and Ashgrid in the plugin’s shaded JAR, or use your server platform’s supported runtime dependency loader. A normal Java dependency declaration alone does not bundle JAR contents.</p><p>Use one compatible set of library versions. If your packaging setup relocates library packages, relocate references consistently across all three libraries. Their public methods share Ashcore and Ashgrid types.</p>${note('No standalone server plugin', '<p>Putting the Ashspace JAR in the server’s plugins folder does not install an Ashspace plugin. Ashspace has no plugin descriptor or Bukkit/Paper dependency. Choose the supported Minecraft version through your own plugin and server API.</p>')}<p>Convert platform coordinates into <code>Vector3</code> values in your integration code. Keep separate world contexts separate; a numeric point and a <code>FrameId</code> carry no Minecraft world UUID. Ashspace does not provide an Euler-yaw adapter, so verify the sign and units when translating platform rotations into quaternions.</p>`},
        {id:'check-dependencies',title:'Check the dependency tree',html:`${code('mvn dependency:tree -Dincludes=dev.nasaka.blackframe', 'Project terminal','bash')}<p>The resolved tree should contain <code>ashspace:2.0.0</code>, <code>ashcore:1.2.0</code>, and <code>ashgrid:1.3.0</code>. If a dependency override selects an older Ashcore, <code>OrientedBox</code> may be unavailable.</p><p>Continue with the <a href="#/quick-start">quick start</a>. To build this repository from source, use Maven 3.9+ and run <code>mvn -B clean verify</code>.</p>`}
      ]
    },
    {
      id:'quick-start', category:'Getting started',title:'Your first conversion',navTitle:'Quick start',description:'Define a ship frame, convert a point, and find its world-grid cell.',kind:'guide',
      sections:[
        {id:'define-the-example',title:'Set up the example',html:`<p>After adding the dependency, save the following file in your project’s Java source directory. The ship has no rotation and sits at <code>(10, 0, −4)</code>. Its tool is at <code>(0.9, −0.1, 0.9)</code> in ship coordinates.</p><p>The grid uses half-unit cells and 16 cells per chunk edge along X and Z. In a plugin where one world unit means one block, a cell edge is half a block and a chunk edge is eight blocks. These are library grid chunks; they do not automatically match Minecraft’s native chunks.</p>`},
        {id:'run-the-example',title:'Convert the point',html:code(`import nsk.nu.ashcore.api.math.Quaternion;
import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashspace.api.frame.FrameGraph3;
import nsk.nu.ashspace.api.frame.FrameId;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.space.SpaceConverter3;
import nsk.nu.ashspace.api.transform.RigidTransform3;

public final class FirstConversionExample {
    public static void main(String[] args) {
        FrameGraph3 live = FrameGraph3.worldRoot();
        FrameId ship = new FrameId("ship");
        live.define(ship, live.root(), new RigidTransform3(
                Quaternion.identity(), new Vector3(10, 0, -4)));

        FrameGraph3 query = live.snapshot();
        SpaceConverter3 converter = new SpaceConverter3(query);
        Vector3 world = converter.toWorldPoint(ship,
                new Vector3(0.9, -0.1, 0.9));

        GridSpaceMapper3 grid = new GridSpaceMapper3(
                0.5, Vector3.ZERO, new SquareXZChunkScheme(16));
        CellIndex3 cell = grid.worldToCell(world);
        assert cell.equals(new CellIndex3(21, -1, -7));
        System.out.printf("cell=(%d, %d, %d)%n", cell.x(), cell.y(), cell.z());
        System.out.println(grid.cellToChunkAddress(cell));
    }
}`, 'FirstConversionExample.java')},
        {id:'read-the-result',title:'Read the result',html:`<p>Run <code>FirstConversionExample.main</code> in your IDE. The world point is approximately <code>(10.9, −0.1, −3.1)</code>. Dividing by <code>0.5</code> and applying floor gives cell <code>(21, −1, −7)</code>.</p>${table(['Address part','Value','Reason'],[
          ['Cell','<code>(21, −1, −7)</code>','Each axis uses floor, including negative coordinates.'],
          ['Chunk XZ','<code>(1, −1)</code>','Floor-divide cell X and Z by 16.'],
          ['Chunk-local XYZ','<code>(5, −1, 9)</code>','Floor-modulo on XZ; Y remains the cell Y.']
        ])}<p>The snapshot makes this query use one pose. The example does not allocate grid storage or perform a hit test.</p>${cards([{id:'coordinate-spaces',title:'Add a rotation',text:'Follow a point and a vector as the ship’s axes turn.'},{id:'frame-grids',title:'Move the grid with the ship',text:'Locate cells defined in the ship’s own coordinate system.'}])}`}
      ]
    },
    {
      id:'changelog',category:'Reference',title:'Changelog',description:'Ashspace 2.0.0 behavior and migration notes for consumers of 1.0.0.',kind:'reference',
      sections:[
        {id:'version-2',title:'2.0.0',html:`<p>The current checkout declares version <code>2.0.0</code>. It uses Ashcore <code>1.2.0</code> and Ashgrid <code>1.3.0</code>. This summary describes the checked-in behavior; it does not assign release dates to individual changes.</p>${table(['Area','Current behavior'],[
          ['Grid boundaries','Point mapping uses rounded division followed by floor, without a boundary epsilon.'],
          ['Chunk mapping','All point routes validate signed int cell coordinates and use one captured positive XZ chunk size. Custom scheme mapping methods are not used.'],
          ['Validation','Invalid extreme rotations, non-finite transformed results, and unknown-frame self-conversions fail explicitly.'],
          ['Frame lifecycle','Leaf removal, subtree removal, and frozen graph snapshots are available.'],
          ['Attached grids','<code>FrameGridSpaceMapper3</code> maps cells in a frame that can translate and rotate.'],
          ['Relative transforms','Queries compose paths below the nearest common ancestor, reducing unnecessary world-coordinate arithmetic.'],
          ['Geometry','Capsule and oriented-box conversions preserve radii and half extents.']
        ])}`},
        {id:'migrate-from-1',title:'Migrate from 1.0.0',html:`<p>No existing public type, constructor, or method was removed or moved. Version 2.0.0 uses a major version because stricter validation and corrected boundary rounding can change results despite unchanged signatures.</p><ol><li>Check decimal boundaries and negative coordinates in your own grid queries.</li><li>Confirm that your layout uses standard square XZ chunks.</li><li>Handle validation errors instead of depending on previously accepted non-finite or overflowing values.</li><li>Keep the graph stable for each complete query, or share one frozen snapshot.</li><li>Run integration tests with Ashcore 1.2.0 and Ashgrid 1.3.0 on the runtime classpath.</li></ol><p>Common-ancestor composition can change floating-point rounding compared with the earlier world-based path. Ashspace does not promise serialized formats or bitwise agreement across releases.</p>`},
        {id:'source-and-releases',title:'Source and releases',html:`<p>Browse the <a href="https://github.com/Miciasty/Ashspace">repository</a>, <a href="https://github.com/Miciasty/Ashspace/releases">release list</a>, or <a href="https://central.sonatype.com/artifact/dev.nasaka.blackframe/ashspace/2.0.0">Maven Central artifact</a>. The <a href="#/api-reference">API reference</a> links each public type to its source.</p>`}
      ]
    }
  );
})();
