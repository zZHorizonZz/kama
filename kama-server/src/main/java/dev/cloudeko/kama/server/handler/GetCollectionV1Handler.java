package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.collection.v1.Collection;
import dev.cloudeko.kama.collection.v1.GetCollectionRequest;
import dev.cloudeko.kama.server.CollectionService;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.server.util.ResourceUtil;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class GetCollectionV1Handler extends BaseCollectionHandler<GetCollectionRequest, Collection> {

    public static final ServiceMethod<GetCollectionRequest, Collection> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.collection.v1.CollectionService"),
            "GetCollection",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(GetCollectionRequest.newBuilder()));

    public GetCollectionV1Handler(CollectionService collectionService) {
        super(collectionService);
    }

    @Override
    public void handle(GrpcServerRequest<GetCollectionRequest, Collection> request) {
        request.handler(req -> collectionService.getCollection(req.getName())
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
