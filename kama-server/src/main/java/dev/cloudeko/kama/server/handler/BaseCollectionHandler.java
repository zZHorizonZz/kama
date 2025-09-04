package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.server.CollectionService;
import io.vertx.core.Handler;
import io.vertx.grpc.server.GrpcServerRequest;
import org.jboss.logging.Logger;

public abstract class BaseCollectionHandler<Req, Resp> implements Handler<GrpcServerRequest<Req, Resp>> {

    protected final Logger logger = Logger.getLogger(getClass());
    protected final CollectionService collectionService;

    protected BaseCollectionHandler(CollectionService collectionService) {
        this.collectionService = collectionService;
    }
}
