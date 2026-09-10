# Ashspace verification record

## 2026-09-10 — contract revision 2.0 corrections

Coordinates: `dev.nasaka.blackframe:ashspace:2.0.0-SNAPSHOT`.
Scope: local corrections in Ashspace only. No release tag, upload, deployment or publication was performed.

Work started on `fix/ashspace-contract-v2-20260910`, after checkpoint commit `b976a15` recorded the original source state and the previously untracked `ISSUES.md`. The implementation baseline was `3f1b910`. The correction commit containing this record can be identified with `git log -1 --format=%H -- VERIFICATION.md`; the artifact hashes below identify the binaries tested before that commit.

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
