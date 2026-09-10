package nsk.nu.ashspace.integration.artifact;

import nsk.nu.ashcore.api.math.Vector3;
import nsk.nu.ashgrid.api.grid.indexing.ChunkScheme;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import javax.tools.ToolProvider;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;
import java.util.jar.JarFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PackagedArtifactIT {

    @TempDir
    Path temporaryDirectory;

    @Test
    void release_artifacts_contain_code_sources_documentation_and_notices() throws Exception {
        // GIVEN
        Path main = artifact("");
        Path sources = artifact("-sources");
        Path javadoc = artifact("-javadoc");

        // WHEN / THEN
        try (JarFile jar = new JarFile(main.toFile())) {
            assertNotNull(jar.getEntry("nsk/nu/ashspace/api/grid/GridSpaceMapper3.class"));
            assertNotNull(jar.getEntry("nsk/nu/ashspace/api/grid/FrameGridSpaceMapper3.class"));
            assertNotNull(jar.getEntry("nsk/nu/ashspace/implementation/grid/ChunkLocalIndexer.class"));
            assertNotNull(jar.getEntry("META-INF/LICENSE"));
            assertNotNull(jar.getEntry("META-INF/NOTICE"));
            assertFalse(jar.stream().anyMatch(entry -> entry.getName().startsWith("org/junit/")));
            Properties coordinates = new Properties();
            try (var input = jar.getInputStream(jar.getEntry("META-INF/maven/dev.nasaka.blackframe/ashspace/pom.properties"))) {
                coordinates.load(input);
            }
            assertEquals("dev.nasaka.blackframe", coordinates.getProperty("groupId"));
            assertEquals("ashspace", coordinates.getProperty("artifactId"));
            assertEquals(System.getProperty("artifactVersion"), coordinates.getProperty("version"));
        }
        try (JarFile jar = new JarFile(sources.toFile())) {
            assertNotNull(jar.getEntry("nsk/nu/ashspace/api/grid/GridSpaceMapper3.java"));
            assertNotNull(jar.getEntry("nsk/nu/ashspace/api/grid/FrameGridSpaceMapper3.java"));
        }
        try (JarFile jar = new JarFile(javadoc.toFile())) {
            assertNotNull(jar.getEntry("index.html"));
            assertNotNull(jar.getEntry("nsk/nu/ashspace/api/grid/GridSpaceMapper3.html"));
            assertNotNull(jar.getEntry("nsk/nu/ashspace/api/grid/FrameGridSpaceMapper3.html"));
        }
    }

    @Test
    void readme_quick_start_compiles_and_runs_against_the_packaged_jar() throws Exception {
        // GIVEN
        String readme = Files.readString(Path.of(System.getProperty("projectDirectory"), "README.md")).replace("\r\n", "\n");
        int start = readme.indexOf("```java\n");
        assertTrue(start >= 0, "README must contain the complete Java quick start");
        int end = readme.indexOf("```", start + 8);
        assertTrue(end > start, "Java quick start must have a closing fence");
        Path source = temporaryDirectory.resolve("AshspaceQuickStart.java");
        Files.writeString(source, readme.substring(start + 8, end));
        Path core = dependency(Vector3.class);
        Path grid = dependency(ChunkScheme.class);
        String classpath = String.join(File.pathSeparator, artifact("").toString(), core.toString(), grid.toString());
        var compiler = ToolProvider.getSystemJavaCompiler();
        assertNotNull(compiler, "Verification requires a JDK");
        ByteArrayOutputStream errors = new ByteArrayOutputStream();

        // WHEN
        int result = compiler.run(null, null, errors, "--release", "21", "-classpath", classpath,
                "-d", temporaryDirectory.toString(), source.toString());

        // THEN
        assertEquals(0, result, errors.toString());
        URL[] urls = {temporaryDirectory.toUri().toURL(), artifact("").toUri().toURL(),
                core.toUri().toURL(), grid.toUri().toURL()};
        try (URLClassLoader loader = new URLClassLoader(urls, ClassLoader.getPlatformClassLoader())) {
            Class<?> example = loader.loadClass("AshspaceQuickStart");
            example.getMethod("main", String[].class).invoke(null, (Object) new String[0]);
        }
    }

    private static Path artifact(String classifier) {
        return Path.of(System.getProperty("artifactDirectory"), System.getProperty("artifactName") + classifier + ".jar");
    }

    private static Path dependency(Class<?> type) throws Exception {
        return Path.of(type.getProtectionDomain().getCodeSource().getLocation().toURI());
    }
}
