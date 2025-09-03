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

    public static JsonObject encode(Collection collection) {
        return new JsonObject(COLLECTION_ENCODER.encode(collection, WireFormat.JSON).payload());
    }

    public static Collection decode(JsonObject collection) {
        return COLLECTION_DECODER.decode(GrpcMessage.message("identity", WireFormat.JSON, collection.toBuffer()));
    }
}
