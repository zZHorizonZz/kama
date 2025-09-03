package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.server.CollectionService;
import io.vertx.core.Handler;
import io.vertx.grpc.server.GrpcServerRequest;

public abstract class BaseCollectionHandler<Req, Resp> implements Handler<GrpcServerRequest<Req, Resp>> {

    protected final CollectionService collectionService;

    protected BaseCollectionHandler(CollectionService collectionService) {
        this.collectionService = collectionService;
    }
}
