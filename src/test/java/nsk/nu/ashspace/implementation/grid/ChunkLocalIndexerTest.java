package nsk.nu.ashspace.implementation.grid;

import nsk.nu.ashgrid.api.grid.indexing.CellIndex3;
import nsk.nu.ashgrid.api.grid.indexing.ChunkIndex2;
import nsk.nu.ashgrid.api.grid.indexing.ChunkLocal3;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ChunkLocalIndexerTest {

    @Test
    void maps_cell_to_chunk_and_local_with_floor_div_mod() {
        // GIVEN
        ChunkLocalIndexer indexer = new ChunkLocalIndexer(16);
        CellIndex3 cell = new CellIndex3(-1, 5, -17);

        // WHEN
        ChunkIndex2 chunk = indexer.chunkOfCell(cell);
        ChunkLocal3 local = indexer.localOfCell(cell);

        // THEN
        assertEquals(new ChunkIndex2(-1, -2), chunk);
        assertEquals(new ChunkLocal3(15, 5, 15), local);
    }

    @Test
    void rejects_non_positive_chunk_size() {
        // GIVEN / WHEN / THEN
        assertThrows(IllegalArgumentException.class, () -> new ChunkLocalIndexer(0));
    }
}
