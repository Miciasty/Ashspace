package nsk.nu.ashspace.api.frame;

/**
 * Stable identifier for a coordinate frame in a frame graph.
 */
public record FrameId(String value) {

    public FrameId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("frame id must not be null or blank");
        }
    }

    @Override
    public String toString() {
        return value;
    }
}
