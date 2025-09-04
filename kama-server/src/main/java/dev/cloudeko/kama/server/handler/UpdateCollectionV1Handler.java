package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.collection.v1.Collection;
import dev.cloudeko.kama.collection.v1.UpdateCollectionRequest;
import dev.cloudeko.kama.server.CollectionService;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.server.util.ResourceUtil;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class UpdateCollectionV1Handler extends BaseCollectionHandler<UpdateCollectionRequest, Collection> {

    public static final ServiceMethod<UpdateCollectionRequest, Collection> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.collection.v1.CollectionService"),
            "UpdateCollection",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(UpdateCollectionRequest.newBuilder()));

    public UpdateCollectionV1Handler(CollectionService collectionService) {
        super(collectionService);
    }

    @Override
    public void handle(GrpcServerRequest<UpdateCollectionRequest, Collection> request) {
        request.handler(req -> collectionService.updateCollection(ResourceUtil.encode(req.getCollection()))
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
