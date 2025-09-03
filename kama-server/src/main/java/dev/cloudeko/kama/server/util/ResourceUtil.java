package dev.cloudeko.kama.server.util;

import dev.cloudeko.kama.collection.v1.Collection;
import io.vertx.core.json.JsonObject;
import io.vertx.grpc.common.GrpcMessage;
import io.vertx.grpc.common.GrpcMessageDecoder;
import io.vertx.grpc.common.GrpcMessageEncoder;
import io.vertx.grpc.common.WireFormat;

public final class ResourceUtil {

    private ResourceUtil() {
    }

    private static final GrpcMessageEncoder<Collection> COLLECTION_ENCODER = GrpcMessageEncoder.encoder();
    private static final GrpcMessageDecoder<Collection> COLLECTION_DECODER = GrpcMessageDecoder.decoder(Collection.newBuilder());

    // Record encoders/decoders
    private static final GrpcMessageEncoder<dev.cloudeko.kama.record.v1.Record> RECORD_ENCODER = GrpcMessageEncoder.encoder();
    private static final GrpcMessageDecoder<dev.cloudeko.kama.record.v1.Record> RECORD_DECODER = GrpcMessageDecoder.decoder(dev.cloudeko.kama.record.v1.Record.newBuilder());

    public static JsonObject encode(Collection collection) {
        return new JsonObject(COLLECTION_ENCODER.encode(collection, WireFormat.JSON).payload());
    }

    public static Collection decode(JsonObject collection) {
        return COLLECTION_DECODER.decode(GrpcMessage.message("identity", WireFormat.JSON, collection.toBuffer()));
    }

    public static JsonObject encode(dev.cloudeko.kama.record.v1.Record record) {
        return new JsonObject(RECORD_ENCODER.encode(record, WireFormat.JSON).payload());
    }

    public static dev.cloudeko.kama.record.v1.Record decodeRecord(JsonObject record) {
        return RECORD_DECODER.decode(GrpcMessage.message("identity", WireFormat.JSON, record.toBuffer()));
    }
}
