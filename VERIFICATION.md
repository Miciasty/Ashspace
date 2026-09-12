# Ashspace verification record

Current release coordinates: **Ashspace 2.0.0**, with Ashcore **1.2.0** and Ashgrid **1.3.0**.
The current source set passed **87 tests + 2 artifact tests** as part of the 545-test Java 21
[shared release verification](../Ashnav/VERIFICATION.md#release-version-alignment).
That record contains current artifact hashes and reproduction. No Git operations or publication
were performed. The shape-conversion and older records below retain their historical snapshot hashes.

## 2026-09-10 — Shape-preserving conversions (SPACE-012)

Branch: `fix/ashspace-shape-conversions-20260910`; checkpoint `93c28e3` records the incoming backlog;
implementation baseline `f652173`. All writes, Maven metadata, logs and outputs stayed inside Ashspace.
Coordinates remain `dev.nasaka.blackframe:ashspace:2.0.0-SNAPSHOT`; no released coordinate was replaced.

### Scope and compatibility

`GeometryTransforms3` and `SpaceConverter3` now convert capsules, AABBs to OBBs and OBBs to OBBs.
Capsule endpoints and box centers use the existing rigid point transform. Radius and existing OBB half
extents are copied exactly. OBB orientation applies box-local rotation before the frame rotation, using
Ashcore quaternion composition. AABB center/half-extent conversion avoids overflow when half the side
length remains representable. Double rounding can still collapse tiny extents or nearby coordinates;
README and Javadoc state this limit, supported degeneracies, units and invalid-input behavior.

All three frame conversions resolve one relative transform. Live graphs reflect later updates; frozen
graphs and returned values remain unchanged after live removal. Common-ancestor calculation remains
usable even when a shared ancestor's world transform overflows. Storage and tracing indexes are not copied.
Existing `axisAlignedBox` and grid mapping implementations are unchanged and retain conservative semantics.
No collision algorithm, geometry type, scale, shear or motion runtime was added to Ashspace.

The six methods are additive. `javap -public` comparison for all 11 class entries in the previous JAR
found **six added methods and zero removed public signatures**. Baseline JAR SHA-256:
`7f0e82346ee9c880a42e68eb24902439af7e9aba5ad7222b39930d9ab3cb0e94`, matching the SPACE-011 record below.
It was read from Ashtrace's isolated repository; no consumer files were modified. Listings are retained
as `.verification/shape-api-before.txt` and `.verification/shape-api-after.txt`.

### Dependency identity

Ashcore `1.2.0-SNAPSHOT` supplies the established CORE-011 `OrientedBox` API. Its owner checkout was
inspected at `ddbf98cb092603e3543c71485a34b5e1a36264c0`; the copied JAR matches both Ashcore's current
`target` and its recorded isolated `extensions-repository` artifact. Ashgrid remains `1.3.0-SNAPSHOT`;
its JAR copied from Ashtrace's integration repository matches the current Ashgrid `target` (checkout
`8199f9be15ff2238514fc392b6580649da42255f`). Neither lower-layer project was rebuilt or edited here.
JARs and matching POM/metadata directories were copied into Ashspace's `.verification/repository`.

| Resolved compile dependency | SHA-256 of the JAR actually used |
| --- | --- |
| `dev.nasaka.blackframe:ashcore:1.2.0-SNAPSHOT` | `4aca690477eea1f3943e3c8b333da6882ff9f76fd2d99f2ceb2a6a0a9d9e1379` |
| `dev.nasaka.blackframe:ashgrid:1.3.0-SNAPSHOT` | `b4a8d0ac87ebe34132f1f86d8870e8f32f5f270b95d263a0fc21e345a6e71285` |

The dependency tree and Surefire XML classpath confirm these versions. The direct Ashcore dependency
wins over Ashgrid's older declared transitive version; the tests did not load that older Core JAR.
JUnit 5.10.2 and its dependencies remain test-scoped. Hosted builds and consumers must provision the
identified snapshots; their remote availability was not checked. Runtime users of the new API need
Ashcore 1.2.0-SNAPSHOT and must not force an older version onto the classpath.

### Executed checks

Windows 11 amd64, Eclipse Adoptium **21.0.12.1+1**, Maven **3.9.9**, UTF-8/pl_PL, compiler release **21**.
The local JDK is `.verification/jdk/jdk-21.0.12.1+1`; Maven is `.verification/apache-maven-3.9.9/bin/mvn.cmd`.
With `JAVA_HOME` pointing to that JDK, the following commands ran from Ashspace using explicit settings
and the isolated repository, offline:

```text
mvn -B -ntp -o -s .verification/settings.xml -Dmaven.repo.local=.verification/repository clean test
mvn -B -ntp -o -s .verification/settings.xml -Dmaven.repo.local=.verification/repository -Dtest=ShapeTransforms3ApiTest,ShapeSpaceConverter3ApiTest test
mvn -B -ntp -o -s .verification/settings.xml -Dmaven.repo.local=.verification/repository clean verify dependency:tree
```

| Check | Actual result |
| --- | --- |
| Baseline before edits, with Ashcore 1.1.0-SNAPSHOT | **74 tests passed**, no failures/errors/skips. |
| Focused acceptance tests for new API | **13 tests passed**, no failures/errors/skips. These are feature acceptance tests, not reproduced failures of the former API. |
| Final `clean verify dependency:tree` | **87 tests + 2 packaged-artifact tests passed**, no failures/errors/skips. Finished 2026-09-10 15:56:18 +02:00, exit 0. |
| Javadoc and exact main/sources/Javadoc JARs | Passed with doclint `all,-missing` and errors enabled; representative geometry/converter entries and notices checked. |
| Complete README Java example against the packaged JAR | Compiled with release 21 and ran successfully through an isolated classloader. Capsule radius `0.5`, returned half extents `(1,1,1)`, `insideEnclosure=true`, `insideShape=false`; both ship-cell outputs remain `(1,0,1)`. |

The 13 new tests cover translation, 45/90/180-degree rotations, noncommuting orientation order,
capsule axis length and six surface points, all eight box corners and six face centers, inverse round
trips, nested frames, live updates/removal, snapshots, relative queries under overflowing ancestors,
null/missing frames, non-finite legacy AABBs, output overflow, degenerate shapes, extreme bounds and
documented half-extent underflow. Moderate-scale coordinate assertions use absolute `1e-12`; copied
radii and half extents use exact assertions. This tolerance is not a global accuracy guarantee.
Existing mapping tests, including Ashgrid agreement and quotient underflow, passed with the new Core.

Logs: `.verification/shape-baseline.log`, `shape-focused.log`, `shape-verify.log`; XML reports in `target`.
No test/build attempt failed. Initial Git inspection found that the workspace parent is not a repository;
Ashspace ownership was handled with per-command `safe.directory`, without global configuration changes.

| Output | SHA-256 |
| --- | --- |
| `target/ashspace-2.0.0-SNAPSHOT.jar` | `eec0770d713355b67e856a831ff3d370e41baf0fedabaa9005f86dd58171f389` |
| `target/ashspace-2.0.0-SNAPSHOT-sources.jar` | `e8cdb8340e199a800da4f0ea3e179bd1aa1f270d5f68dccacd045b82e4c32529` |
| `target/ashspace-2.0.0-SNAPSHOT-javadoc.jar` | `4e51286e0174dcb674599ea3a3acaec5c3a20d357acc90bd740604f5524f5284` |
| `pom.xml` | `5ce0198d0affd786f37e606a93595b1b350b78e91cf837516bfff15ca3827851` |

SPACE-012 is complete locally. The earlier SPACE-001–SPACE-011 statuses are retained. No consumer suite,
benchmark, cross-platform repeatability check, remote CI, tag, push or publication was run in this session.
TRACE-012 adoption remains in Ashtrace; the release destinations and release-owner checks below still apply.

## 2026-09-10 — contract revision 2.0 corrections

Coordinates: `dev.nasaka.blackframe:ashspace:2.0.0-SNAPSHOT`.
Scope: local corrections in Ashspace only. No release tag, upload, deployment or publication was performed.

Work started on `fix/ashspace-contract-v2-20260910`, after checkpoint commit `b976a15` recorded the original source state and the previously untracked `ISSUES.md`. The implementation baseline was `3f1b910`. Correction commit: `79a66f3`; the artifact hashes below identify the binaries tested before that commit. The later frame-completion work is recorded separately below.

### Environment and commands

- Windows 11 amd64, UTF-8, locale `pl_PL`.
- Eclipse Adoptium JDK **21.0.12.1+1**.
- Apache Maven **3.9.9**, revision `8e8579a9e76f7d015ee5ec7bfcdc97d260186937`.
- `actionlint` **1.7.7**, with optional ShellCheck/Pyflakes integrations disabled.
- Maven and the JDK were downloaded into ignored `.verification/` and checked against their published SHA-512/SHA-256 values. The Maven dependency repository was initially empty and also lives under `.verification/`. No sibling library was built or installed.

The final verification finished at **2026-09-10 06:53:27 +02:00**, exit code **0**:

```powershell
$env:JAVA_HOME = (Resolve-Path '.verification/jdk/jdk-21.0.12.1+1').Path
& './.verification/apache-maven-3.9.9/bin/mvn.cmd' -B -ntp -o `
    -s .verification/settings.xml '-Dmaven.repo.local=.verification/repository' clean verify
```

`.verification/settings.xml` contains only an empty Maven settings element. Earlier online runs used the same command without `-o` to fetch dependencies and build plugins from Central. The standard equivalent for a configured JDK/Maven environment is `mvn -B clean verify`; no test-skip properties or publishing profile were set.

Additional commands completed successfully:

```text
mvn -B -ntp -s .verification/settings.xml -Dmaven.repo.local=.verification/repository dependency:tree -DoutputFile=.verification/dependency-tree.txt help:effective-pom -Doutput=.verification/effective-pom.xml
.verification/actionlint/actionlint.exe -shellcheck= -pyflakes= .github/workflows/maven.yml .github/workflows/publish.yml
git -c safe.directory=G:/Github/Blackframe/Ashspace diff --check
git -c safe.directory=G:/Github/Blackframe/Ashspace ls-remote --symref origin HEAD
```

The last command returned `refs/heads/main` and remote HEAD `18db5782777f147476dfb40b9815fdebf63ef762`. CI now covers every branch push and every pull request. The updated workflows passed local actionlint; they have not been executed on GitHub in this session.

Compiler `3.13.0` uses `release=21` (see [Maven's release option](https://maven.apache.org/plugins/maven-compiler-plugin/examples/set-compiler-release.html)). Surefire/Failsafe are pinned at `3.2.5`; Javadoc `3.7.0` uses `doclint=all,-missing` and `failOnError=true`. Missing documentation tags are not a release-blocking style rule, but invalid documentation is not silently ignored. Core lifecycle, packaging, dependency-report and help plugin versions are pinned in the POM.

### Test evidence

| Stage | Result |
| --- | --- |
| Original tests before corrections | 31 tests passed. |
| New regression cases against the original implementation | 39 tests: 6 failures and 1 error, reproducing seven problem paths. |
| First corrections | All 39 tests passed. |
| First complete packaging gate | 52 tests and 2 packaged-artifact tests passed. |
| Final gate, including range-size protection and updated README example | **54 tests + 2 packaged-artifact tests passed; 0 failures, 0 errors, 0 skipped.** |
| Workflow validation | Both workflow files passed actionlint, exit 0. |

The original regression failures were decimal cell-boundary disagreement with `VoxelSpace`, chunk underflow just below zero, overflow from generated world coordinates, inconsistent int limits across point routes, extreme quaternion acceptance, missing-frame self-conversion, and the reciprocal of a subnormal cell size.

| Issue | Evidence and decision |
| --- | --- |
| SPACE-001 | `GridMappingIntegrationTest` compares cells with `VoxelSpace`, all point-to-chunk routes with cell/address routes, and reconstructs global cells from chunk-local addresses. It covers negative/boundary/adjacent-double points, two origins and five cell sizes. Custom scheme methods are deliberately excluded: only the captured positive size configures standard square XZ chunking. No Ashgrid API was moved or changed. |
| SPACE-002 | `RigidTransform3ApiTest` checks zero-as-identity, rejection of unsupported extreme normalization magnitudes, length and inverse/composition properties, finite inputs and overflow. Ashcore still performs normalization; the adapter checks its supported input range and unit-norm postcondition. Ray tests compare the same distance parameter before and after transformation. |
| SPACE-003 | `GridSpaceMapper3ApiTest` checks exact/nextUp/nextDown boundaries, subnormal sizes, intermediate/output overflow, int endpoints, range lengths and a known loss of cell detail at origin `2^54`. Integration tests check representative center round trips including the int extremes. No universal floating-point error bound is claimed. |
| SPACE-004 | `FrameGraph3ApiTest` covers unknown frames including self-conversion, cycles, missing parents, unchanged state on rejection, updates, reparenting, immutable snapshots and insertion order. Geometry tests contain all computed corners after oblique rotations and show extra enclosed space. API/README state the caller's stable-state obligation and parent-chain costs. |
| SPACE-005 | `PackagedArtifactIT` extracts the complete Java quick start directly from README, compiles with `--release 21` against the main JAR plus Ashcore/Ashgrid JARs, and runs it in a class loader isolated from project classes. Existing public signatures remain; stricter behavior is reserved for `2.0.0-SNAPSHOT`, with migration notes for Ashtrace/Ashnav. |
| SPACE-006 | Final clean verify, effective POM, dependency tree, packaged main/sources/Javadoc checks, notices, strict Javadoc errors, confirmed remote branch and actionlint provide local evidence. Publication routes/status are stated below; remote publication itself remains unverified. |

Final quick-start output:

```text
world=Vector3[x=10.9, y=-0.1, z=-4.9]
cell=CellIndex3[x=21, y=-1, z=-10]
chunkAddress=ChunkAddress3[chunk=ChunkIndex2[cx=1, cz=-1], local=ChunkLocal3[lx=5, ly=-1, lz=6]]
```

### Resolved dependencies

Fresh downloads came from `https://repo.maven.apache.org/maven2`; their local `_remote.repositories` records identify `central`. This avoids relying on locally installed sibling snapshots or an older user's Maven cache. Source inspection used the matching Ashcore/Ashgrid source JARs; integration execution used the freshly resolved binary versions.

| Dependency | Effective scope | SHA-256 of binary JAR |
| --- | --- | --- |
| Ashcore 1.0.1 | compile | `0ea3a990d28a01aac97c574497c21be2f2ced5b90eaa03637c8499cbf1d62d0b` |
| Ashgrid 1.2.0 | compile | `b0ea0b634f77504747142b1e3475676c3ab40fea92c5f76075d47bb2d5d24ef7` |
| JUnit Jupiter 5.10.2 | test | JUnit API/params/engine and their transitive dependencies remain test-scoped. |

Ashgrid's transitive Ashcore dependency resolves to the same 1.0.1. There are no other production dependencies and no Ashspace SPI providers. `PackagedArtifactIT` checks that JUnit classes are not packaged in the main JAR.

### Artifacts checked

The main JAR includes public classes, `META-INF/LICENSE`, `META-INF/NOTICE` and matching Maven coordinates. Separate JARs contain sources and generated API documentation. Exact filenames are used; neither verification nor CI selects an arbitrary first JAR.

| File in `target/` | SHA-256 |
| --- | --- |
| `ashspace-2.0.0-SNAPSHOT.jar` | `20c1934338f100e203d14ff1ab2a6d45465aae1b4f8786b770add1b84bf91d0f` |
| `ashspace-2.0.0-SNAPSHOT-sources.jar` | `8ec2f3f56b649772f055cb0ec82f0281915379a7ee823a436b482c112f6fa612` |
| `ashspace-2.0.0-SNAPSHOT-javadoc.jar` | `e4fb058330f48f27e3192b4700af36290ee1c9ab326f0964b3de48dfd508fd6a` |

Raw logs/reports are available locally in ignored `.verification/` and `target/surefire-reports`, `target/failsafe-reports`. They are not publication artifacts. A fixed output timestamp is configured, but cross-environment bitwise reproducible builds have not been tested.

### Publication and remaining integration work

- **GitHub Packages:** configured by `distributionManagement` and `publish.yml`. Verification and a matching non-snapshot `v<version>` tag precede deploy. Credentials, remote execution and artifact availability for a future release remain unverified.
- **GitHub Release:** release publication triggers the workflow; automatic JAR attachment to a release is intentionally not configured. CI uploads build artifacts through GitHub Actions.
- **Maven Central:** the existing `central` profile provides signing and Central publishing. It was not activated and its publishing/credential path was not tested. No claim is made about historical Ashspace publication based on that profile.
- **This snapshot:** no release tag, publication destination or release availability. The issue closure concerns the local correction criteria, which explicitly allow publication to remain recorded as unverified. A release owner must validate intended destinations and record tag, commit, workflow URL/date and artifact availability before a release.
- **Lower layers:** CORE-001 normalization and GRID-002 indexing work remain owned by Ashcore/Ashgrid. Ashspace restricts unsafe inputs without introducing a second quaternion implementation. Range-size validation prevents overflow in Ashgrid 1.2.0's int dimension/empty helpers; caller-controlled aggregate-size limits are still required.
- **Consumers:** TRACE-002/TRACE-005 and NAV-003/NAV-007 need integration checks before their own dependency upgrades. No consumer test suite or checkout was modified or run here. Future dependency versions require new integration evidence.

Environment obstacles were resolved locally: the default PATH exposed Java 8 and no usable Maven; restricted network access required approved downloads into Ashspace. Git's ownership warning was handled with a per-command `safe.directory` for Ashspace, without changing global configuration. An initial actionlint checksum read treated the downloaded response incorrectly; the published checksum was then read as a file and matched the downloaded ZIP before execution. No rejected checksum was bypassed, and no failed build was counted as passing.

## 2026-09-10 — frame lifecycle, frozen queries and moving grids

Branch: `feat/ashspace-frame-completeness-20260910`; checkpoint `8b4747c`; implementation baseline `79a66f3`. Coordinates remain `dev.nasaka.blackframe:ashspace:2.0.0-SNAPSHOT`. No published version or consumer checkout was changed. The four new tracked items are SPACE-007 through SPACE-010.

### Implemented scope

- `FrameGraph3.remove` removes a non-root leaf; `removeSubtree` removes a non-root frame and its current descendants. Rejected operations preserve state, surviving definitions retain insertion order, and subtree traversal is iterative.
- `FrameGraph3.snapshot` returns a frozen `FrameGraph3`, directly usable by existing converters. Its nodes are immutable and its copied map is unmodifiable. All mutators reject changes. Creating the copy requires stable source state; the resulting graph supports concurrent reads after safe publication. No world transforms are eagerly evaluated.
- `FrameGridSpaceMapper3` binds an explicitly identified frame to a grid origin, cell size and captured XZ chunk size. It provides world/other-frame point and range mapping, cell centers/corners in target frames, and frozen copies. Storage remains an Ashgrid responsibility.
- Relative transforms use the nearest common ancestor. Parent-link inspection still costs O(hs + ht); only transforms below that ancestor are composed. This addresses loss of small relative offsets and avoidable overflow without claiming arbitrary precision for world coordinates.

All previous public signatures remain available. Relative arithmetic can round differently; the version is still an unpublished major-version snapshot. Returning the same graph type for frozen copies preserves compatibility with existing consumer constructor signatures.

### Tests and artifact verification

Environment: the same Windows 11 amd64, Eclipse Adoptium JDK 21.0.12.1+1 and Maven 3.9.9 recorded above. No production dependency or workflow change was needed for this feature set.

| Check | Result |
| --- | --- |
| New common-ancestor regressions against baseline | 12 frame tests, 1 failure and 1 error. An expected relative X offset of -1 became 0 at a shared world translation of `2^54`; a local query also failed from overflow in shared ancestors. |
| Frame lifecycle and snapshot tests after implementation | Passed, including a 2048-frame removal and concurrent snapshot readers. |
| Moving-grid API and storage integration | Passed, including translated/rotated frames, local origin, half-open boundaries, negative cells, snapshots, invalid inputs and grid-frame queries far from world origin. |
| Final Ashspace `clean verify` | **72 tests + 2 packaged-artifact tests; 0 failures, 0 errors, 0 skipped.** Finished 2026-09-10 07:23:03 +02:00, exit 0. |
| Existing Ashtrace suite with this Ashspace JAR | **43 tests passed**, 0 failures/errors/skips. Finished 07:24:39 +02:00, exit 0. |
| Existing Ashnav suite with this Ashspace JAR | **29 tests passed**, 0 failures/errors/skips. Finished 07:25:00 +02:00, exit 0. |
| Original consumer input checksums | **63 original POM/source/test/resource files unchanged** after the runs. |

`MovingGridIntegrationTest` stores a block in Ashgrid 1.2.0 `HashSparseGrid3i`. After moving and rotating the vehicle, a new world point finds the same stored cell while a frozen mapper still resolves the old pose. The storage itself is not snapshotted. Existing consumer integration tests include `FrameTraceBroadPhaseIntegrationTest`, `FrameDynamicBroadPhaseIntegrationTest` and `SpaceMappedGridNavigator3IntegrationTest`; these are cooperating-library tests, not engine/plugin applications.

The packaged-artifact test also checks the new mapper's class, source and generated Javadoc. It compiles and runs the updated complete README example against the packaged JAR, including snapshot creation, moving-grid lookup and removal from the live graph. Its final two lines are both `CellIndex3[x=1, y=0, z=1]` with the `shipCell=` and `snapshotShipCell=` labels.

| Artifact | SHA-256 |
| --- | --- |
| `target/ashspace-2.0.0-SNAPSHOT.jar` | `232b5524c201d881cfb9287906ca2eea74c2f3ee372dc0202ea1c568f46a019d` |
| `target/ashspace-2.0.0-SNAPSHOT-sources.jar` | `0bdf9edb7c6bcee63c5a0c63fb7f23128a0b0d13874b6017831926753bad77f9` |
| `target/ashspace-2.0.0-SNAPSHOT-javadoc.jar` | `13d289519d6e242d93a86bd0e4eb07c507428eef85762386f8d8218c064b88da` |

The main JAR installed into the isolated Maven repository has the same SHA-256 as the tested `target` JAR. Surefire XML classpaths for both consumers identify that exact snapshot path plus Ashcore 1.0.1 and Ashgrid 1.2.0. No Ashspace 1.0.0 JAR appears in those classpaths.

### Consumer sources and repeatable commands

| Consumer | Original checkout revision | Test-copy adjustment |
| --- | --- | --- |
| Ashtrace 1.0.0 | `5c516fc4a891433ce10c920abaac3846fbee9926` | Only copied POM dependency `ashspace` changed from 1.0.0 to 2.0.0-SNAPSHOT. |
| Ashnav 1.0.0 | `08e7d26a8be5e379e940166dd94307ef5aa2baaa` | Only copied POM dependency `ashspace` changed from 1.0.0 to 2.0.0-SNAPSHOT. |

The existing `src` trees and POM files were copied into `.verification/consumer-tests/Ashtrace` and `.verification/consumer-tests/Ashnav`. Their test sources were not modified. `.verification/consumer-tests/input-manifest.json` records original per-file SHA-256 values and revisions. All copies, targets, logs and Maven metadata are inside Ashspace. The original consumer repositories were read only.

Commands ran from Ashspace with `JAVA_HOME` pointing to the local JDK listed above and the local Maven 3.9.9 executable:

```text
mvn -B -ntp -o -s .verification/settings.xml -Dmaven.repo.local=.verification/repository clean verify
mvn -B -ntp -s .verification/settings.xml -Dmaven.repo.local=.verification/repository org.apache.maven.plugins:maven-install-plugin:3.1.3:install-file -Dfile=target/ashspace-2.0.0-SNAPSHOT.jar -DpomFile=pom.xml
mvn -B -ntp -s .verification/settings.xml -Dmaven.repo.local=G:/Github/Blackframe/Ashspace/.verification/repository -f .verification/consumer-tests/Ashtrace/pom.xml clean test
mvn -B -ntp -o -s .verification/settings.xml -Dmaven.repo.local=G:/Github/Blackframe/Ashspace/.verification/repository -f .verification/consumer-tests/Ashnav/pom.xml clean test
```

`install-file` wrote only to the isolated repository under Ashspace; it did not publish or overwrite a released coordinate. The initial offline consumer attempts stopped before running tests because their default clean plugin 3.2.0 was not cached. An online Ashtrace run fetched the missing build dependencies, after which Ashnav completed offline. Logs are retained as `.verification/frame-completion-*.log` and `.verification/consumer-tests/*-tests*.log`.

This verifies the existing consumer suites against the current snapshot and selected dependency artifacts. It does not claim complete coverage of every consumer behavior, separate application validation, benchmark evidence, snapshotting of external storage/indexes, cross-platform bitwise reproducibility, or successful publication. The release-owner checks described in the earlier section remain applicable.

## 2026-09-10 — Grid quotient underflow (SPACE-011)

Branch `fix/ashspace-grid-underflow-integration-20260910`, checkpoint `51f5340`, base `a4c813b`.
The user expanded the Ashtrace integration task to permit fixing a blocking defect in its owner.
Ashgrid and Ashcore remained unchanged. No push, publication or released artifact replacement.

The unchanged `GridMappingIntegrationTest` failed against the corrected dependency set used by
Ashtrace. At `cellSize=2`, origin zero, point X=`-Double.MIN_VALUE`, Ashgrid `VoxelSpace` returns
cell -1, but Ashspace returned 0 because the quotient underflows to -0.0. This is an extreme-input
integration defect, not evidence of a general failure in ordinary-scale queries. It can select
the wrong cell or make a tiny nonempty range empty, so it was treated as a P1 contract blocker.

`GridSpaceMapper3` now preserves the sign of a nonzero offset only when its quotient becomes zero.
An internal signed `Double.MIN_VALUE` retains the correct side for floor/ceil selection; it is not
exposed as an accurate distance or applied as a tolerance to ordinary inputs. Both frame and plain
mappers, chunk addresses and range endpoints use the correction. Public signatures are unchanged.
The POM now uses Ashcore 1.1.0-SNAPSHOT and Ashgrid 1.3.0-SNAPSHOT, matching the integration set.
These dependencies must be provisioned before hosted builds; their remote availability is unverified.

Two added regression tests plus the existing mapping suite ran before the fix: **7 tests, 3 failures**.
After the fix, `clean verify dependency:tree` passed **74 tests + 2 packaged-artifact tests**, zero
failures/errors/skips, on Adoptium JDK 21.0.12.1+1, Maven 3.9.16, Windows 11 amd64/UTF-8/pl_PL.
The gate finished 2026-09-10 09:34:31 +02:00. Tests cover both signs, three cell sizes, two origins,
the plain/frame mappers, cells, chunk addresses and half-open positive/negative/cross-zero ranges.
Core/Grid binary hashes remain the ones recorded by Ashtrace's development dependency manifest.

| Output | SHA-256 |
| --- | --- |
| Main JAR | `7f0e82346ee9c880a42e68eb24902439af7e9aba5ad7222b39930d9ab3cb0e94` |
| Sources JAR | `fbd6e1c875b05547ddca370f502e8b4055d98461af00d6a7fb7e06150d6256a4` |
| Javadoc JAR | `dda2b19966672abc379ee6f8fb352ee7affeee989a326e908cf8322c3f54a98c` |
| Matching POM | `3aefb1556e47d99fd6a86b736d31006af4543dcf04e2972afe71ea83c645c073` |

Verification used Ashtrace's isolated Maven repository and explicit settings. Logs are under
`Ashtrace/.verification/ashspace-underflow-*.log`; final reports are in Ashspace `target`.
One `clean` attempt could not remove a class owned by a different execution account. Only the
resolved `Ashspace/target` directory was removed using its owner account; the next full gate passed.
Consumer verification with the new JAR is recorded in [Ashtrace VERIFICATION.md](../Ashtrace/VERIFICATION.md).
