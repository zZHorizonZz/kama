package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.collection.v1.Collection;
import dev.cloudeko.kama.server.CollectionService;
import io.vertx.core.Handler;
import io.vertx.grpc.common.GrpcMessageDecoder;
import io.vertx.grpc.common.GrpcMessageEncoder;
import io.vertx.grpc.server.GrpcServerRequest;

public abstract class BaseCollectionHandler<Req, Resp> implements Handler<GrpcServerRequest<Req, Resp>> {

    protected static final GrpcMessageEncoder<Collection> COLLECTION_ENCODER = GrpcMessageEncoder.encoder();
    protected static final GrpcMessageDecoder<Collection> COLLECTION_DECODER = GrpcMessageDecoder.decoder(Collection.newBuilder());

    protected final CollectionService collectionService;

    protected BaseCollectionHandler(CollectionService collectionService) {
        this.collectionService = collectionService;
    }
}
