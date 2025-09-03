package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.collection.v1.Collection;
import dev.cloudeko.kama.collection.v1.CreateCollectionRequest;
import dev.cloudeko.kama.server.CollectionService;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.server.util.ResourceUtil;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class CreateCollectionV1Handler extends BaseCollectionHandler<CreateCollectionRequest, Collection> {

    public static final ServiceMethod<CreateCollectionRequest, Collection> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.collection.v1"),
            "CreateCollection",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(CreateCollectionRequest.newBuilder()));

    protected CreateCollectionV1Handler(CollectionService collectionService) {
        super(collectionService);
    }

    @Override
    public void handle(GrpcServerRequest<CreateCollectionRequest, Collection> request) {
        request.handler(req -> collectionService.createCollection(ResourceUtil.encode(req.getCollection()))
                .onSuccess(response -> {
                    if (response == null) {
                        request.response().status(GrpcStatus.INTERNAL).end();
                        return;
                    }
                    request.response().end(ResourceUtil.decode(response));
                })
                .onFailure(err -> {
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.INTERNAL).end();
                })
        );
    }
}
