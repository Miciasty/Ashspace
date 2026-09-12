# Ashspace WIKI

English documentation for Ashspace 2.0.0, based on the shared Minecraft plugin WIKI template and its documentation language rules. The topbar matches Ashcore: Documentation, Examples, and API reference, with a Maven Central artifact link. The site uses local assets, local search, hash routes, dark/light themes, copyable syntax-highlighted examples, and interactive SVG figures, including an orbitable 3D frame hierarchy.

## Preview

Use Node.js 20 or newer. From this directory:

```powershell
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:4173. If that port is occupied, set `PORT` to another port before starting the preview. `npm run dev` builds CSS, watches changes, and starts a preview. Refresh the browser after saving a change.

The generated `assets/styles.css` is committed. You can also open `index.html` directly, or preview without installing dependencies with `node preview.mjs`.

## Content and validation

Edit `content/site.js` for navigation and product metadata. `content/pages.js` defines shared components; the other content scripts contain the articles. `assets/diagrams.js` and `src/diagrams.css` implement the figures. Edit `src/*.css`, then rebuild; do not edit generated CSS.

The frame-chain scene lives in `assets/frame-chain-3d.js` and `src/frame-chain-3d.css`. The geometry scene lives in `assets/aabb-3d.js` and `src/aabb-3d.css`; it compares an OBB with the AABB enclosing its eight rotated corners and an optional lattice of candidate unit cells. Its X/Y/Z sliders apply rotations around fixed axes in that order. The two scenes project shaded faces through a perspective camera into SVG, with no external renderer or downloaded assets. They redraw only after a pose, camera, size or theme change. Diagram cleanup removes pointer/keyboard listeners, observers and pending animation frames. Drag or use arrow keys to orbit, scroll or use the zoom buttons to zoom, and use Home / Reset view to restore the camera. Reset all also restores model controls.

```powershell
npm run build
npm run check:examples
```

The build checks page and section links, navigation, relative assets, version metadata, removed demonstration content, the frame-chain model's reference poses and relative-coordinate invariants, and the AABB model's analytical bounds, rotation order, edge lengths and cell coverage. It then writes browser files to `wiki/_site`. The example check requires JDK 21+ (`JAVA_HOME` or PATH) and the POM's Ashcore/Ashgrid dependencies in the default Maven repository. For a custom Maven repository, set `MAVEN_REPO_LOCAL`, or run the following from the repository root first:

```powershell
mvn -B -ntp dependency:build-classpath -DincludeScope=compile -Dmdep.outputFile=target/wiki-classpath.txt
```

The checker reads that classpath file if present; `ASHSPACE_EXAMPLE_CLASSPATH` can explicitly override it. It extracts complete Java examples directly from article code blocks, compiles them with the current Ashspace source, and runs their main methods with assertions enabled. Work files stay under ignored `.verification`. It does not require a Minecraft server.

## GitHub Pages

The prepared `.github/workflows/pages.yml` builds the site and checks its Java examples on matching pull requests and changes to `master`. Only `master` can deploy. The uploaded artifact contains `index.html`, `.nojekyll`, `assets`, `content`, `LICENSE` and `NOTICE`; authoring scripts and node_modules stay out of the artifact.

After the owner approves pushing the work, configure **Settings → Pages → Source → GitHub Actions**, then merge or run the workflow on `master`. No repository setting is changed by creating these local files. Expected project URL after deployment: https://Miciasty.github.io/Ashspace/.

The build follows [GitHub's custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Publication and remote verification remain separate from local preparation.

## Source basis

Article facts were checked against the local 2.0.0 `pom.xml`, `README.md`, `src/main/java`, and tests. `getting-started.js` documents setup; `spaces.js` covers frame/transform types; `grids.js` covers geometry and grid mapping; `integration.js` covers state, API contracts and diagnostics. Migration records checked-in behavior without inventing release dates. There is no Bukkit adapter or server plugin API in this library.

Figures illustrate Java's documented math with bounded JavaScript examples. They do not run the Java library. All values have nearby textual explanations; controls support keyboard input and reset. Keep mathematical assertions in the copied Java examples authoritative when changing illustrations.

Before publishing, verify desktop and mobile navigation, search, clipboard buttons, both themes, section links, diagram controls, and asset loading under `/Ashspace/`.
