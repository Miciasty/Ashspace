package nsk.nu.ashspace.implementation.grid;

import nsk.nu.ashcore.api.math.DivMod;
import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.api.grid.indexing.ChunkIndex2;
import nsk.nu.ashgrid.api.grid.indexing.ChunkLocal3;

/**
 * Cell-to-chunk and chunk-local mapping helper for XZ chunk layouts.
 */
public final class ChunkLocalIndexer {
    private final int chunkSize;

    public ChunkLocalIndexer(int chunkSize) {
        if (chunkSize <= 0) throw new IllegalArgumentException("chunkSize must be > 0");
        this.chunkSize = chunkSize;
    }

    public int chunkSize() {
        return chunkSize;
    }

    /**
     * Chunk index for a global cell index.
     */
    public ChunkIndex2 chunkOfCell(CellIndex3 cell) {
        if (cell == null) throw new NullPointerException("cell");
        return new ChunkIndex2(
                DivMod.floorDiv(cell.x(), chunkSize),
                DivMod.floorDiv(cell.z(), chunkSize)
        );
    }

    /**
     * Chunk-local coordinates for a global cell index.
     *
     * <p>For XZ-chunked layouts, {@code ly} is copied from global {@code y}.</p>
     */
    public ChunkLocal3 localOfCell(CellIndex3 cell) {
        if (cell == null) throw new NullPointerException("cell");
        return new ChunkLocal3(
                DivMod.floorMod(cell.x(), chunkSize),
                cell.y(),
                DivMod.floorMod(cell.z(), chunkSize)
        );
    }
}
