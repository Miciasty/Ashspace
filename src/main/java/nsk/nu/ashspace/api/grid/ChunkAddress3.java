package nsk.nu.ashspace.api.grid;

import nsk.nu.ashgrid.api.grid.indexing.ChunkIndex2;
import nsk.nu.ashgrid.api.grid.indexing.ChunkLocal3;

/**
 * Chunk address of a cell: chunk index in XZ and chunk-local coordinates.
 */
public record ChunkAddress3(ChunkIndex2 chunk, ChunkLocal3 local) {

    public ChunkAddress3 {
        if (chunk == null) throw new NullPointerException("chunk");
        if (local == null) throw new NullPointerException("local");
    }
}
