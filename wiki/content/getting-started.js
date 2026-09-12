(() => {
  const {code, table, note, cards} = window.WIKI_UI;
  window.WIKI_PAGES.push(
    {
      id: 'overview', category: 'Getting started', title: 'Ashspace documentation', navTitle: 'Overview', kind: 'guide', readingTime: 3,
      description: 'Coordinate frames, rigid transforms, and grid mapping for your Java project.',
      intro: '<p>Ashspace is a Java library for coordinate frames, rigid transforms, geometry conversion, and world/local-to-grid mapping. Use it inside a Minecraft plugin or any Java application to locate a point on a moving ship in world space, another tool’s frame, or a voxel grid.</p>',
      sections: [
        {id: 'start-building', title: 'Start with a working example', html: `<p>This WIKI documents <strong>Ashspace 2.0.0</strong>. You need <strong>Java 21 or newer</strong>. The library uses Ashcore 1.2.0 and Ashgrid 1.3.0 as transitive dependencies.</p><div class="link-cards my-[22px] grid grid-cols-2 gap-[13px] max-[680px]:grid-cols-1"><a class="link-card block rounded-[6px] border border-line p-[18px] [background:linear-gradient(145deg,var(--surface),transparent)] transition-[border-color] duration-150 hover:border-accent" href="#/installation"><span>01 · SETUP <b>↗</b></span><h3>Add Ashspace</h3><p>Add the Maven or Gradle dependency and package it with your application.</p></a><a class="link-card block rounded-[6px] border border-line p-[18px] [background:linear-gradient(145deg,var(--surface),transparent)] transition-[border-color] duration-150 hover:border-accent" href="#/quick-start"><span>02 · FIRST RESULT <b>↗</b></span><h3>Convert a ship point</h3><p>Define a ship frame and locate one of its points in a world-aligned grid.</p></a><a class="link-card block rounded-[6px] border border-line p-[18px] [background:linear-gradient(145deg,var(--surface),transparent)] transition-[border-color] duration-150 hover:border-accent" href="#/coordinate-spaces"><span>03 · COORDINATES <b>↗</b></span><h3>Explore coordinate spaces</h3><p>Move and rotate a frame, then compare a point with a direction.</p></a><a class="link-card block rounded-[6px] border border-line p-[18px] [background:linear-gradient(145deg,var(--surface),transparent)] transition-[border-color] duration-150 hover:border-accent" href="#/api-reference"><span>04 · REFERENCE <b>↗</b></span><h3>Find an API type</h3><p>Browse the public types by package and follow their contracts.</p></a></div>`},
        {id: 'choose-a-tool', title: 'Choose a tool for the job', html: table(['Your task','Start here','Result'],[
          ['Name and connect coordinate frames','<a href="#/frame-chains">Frame chains</a>','A parent chain with relative poses.'],
          ['Rotate and translate a value','<a href="#/transforms">Rigid transforms</a>','A point or vector in a new coordinate system.'],
          ['Convert between named frames','<a href="#/coordinate-spaces">Coordinate spaces</a>','Points, directions, rays, and shapes in the target frame.'],
          ['Move geometry with a known transform','<a href="#/geometry">Geometry conversion</a>','Transformed shapes or an enclosing AABB.'],
          ['Index a world-aligned grid','<a href="#/grid-mapping">Cells and chunks</a>','A cell, chunk, or chunk-local address.'],
          ['Attach a grid to a moving frame','<a href="#/frame-grids">Frame-attached grids</a>','Cell indices in a grid that moves and rotates with its frame.'],
          ['Keep one pose for a complete query','<a href="#/spaces-and-snapshots">State and snapshots</a>','Frozen frame definitions for later reads.']
        ])},
        {id: 'library-boundary', title: 'Where Ashspace fits', html: '<p>Your application supplies coordinates, units, frame poses, and grid configuration. Ashspace computes values from those inputs. It does not read a Minecraft world or register server commands, permissions, listeners, or configuration files. A frame named <code>world</code> identifies the graph’s root; it carries no Minecraft world reference.</p><p>Converting a ray or box changes its coordinate representation. It does not test a hit, move an entity, or simulate motion. A cell address identifies a location in a grid; it does not contain voxel data. Your application owns pose updates, synchronization, persistence, and gameplay.</p><p>Ashspace uses Ashcore vectors, quaternions, and geometry types in its public API. Ashcore supplies collision queries for those shapes. Ashgrid supplies grid indices and storage/traversal APIs. Ashspace connects coordinate frames to those grid indices; rendering, scene traversal, and pathfinding belong to other systems.</p>'},
        {id: 'terms', title: 'Terms used in this WIKI', html: table(['Term','Meaning'],[
          ['Position unit','The unit chosen by your application. Use blocks when supplying Minecraft positions, and use the same unit for translations, geometry, and cell size.'],
          ['Frame','A named origin and orientation. Each non-root frame stores its pose relative to one parent. See <a href="#/frame-chains">frame chains</a>.'],
          ['World / local space','Coordinates in the graph’s root / coordinates in a chosen frame. The coordinate system is right-handed with Y up.'],
          ['Rigid transform','Rotation followed by translation, with no scale or shear. A point receives both; a vector or direction receives rotation only.'],
          ['Chunk address','A chunk index in XZ paired with chunk-local XYZ indices. Local X and Z use floor modulo; local Y remains the grid cell Y.'],
          ['Half-open range','An interval <code>[min, max)</code> that includes its minimum and excludes its maximum. See <a href="#/cell-ranges">cell and chunk ranges</a>.'],
          ['Snapshot','A frozen copy of frame definitions. Later source updates do not change it; it does not copy grid storage or Minecraft state.']
        ])},
        {id: 'version-and-source', title: 'Version and source', html: '<p>The examples and contracts were checked against the current 2.0.0 source. Maven coordinates use <code>dev.nasaka.blackframe:ashspace</code>; Java imports use <code>nsk.nu.ashspace</code>.</p><p>Read <a href="#/changelog">migration notes</a> before updating an existing integration. Browse the <a href="https://github.com/Miciasty/Ashspace">source repository</a> or the <a href="https://central.sonatype.com/artifact/dev.nasaka.blackframe/ashspace/2.0.0">Maven Central artifact</a> for this version. Ashspace is distributed under the <a href="https://github.com/Miciasty/Ashspace/blob/master/LICENSE">Apache License 2.0</a>.</p>'}
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
