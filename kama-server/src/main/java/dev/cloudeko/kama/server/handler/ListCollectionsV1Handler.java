package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.collection.v1.Collection;
import dev.cloudeko.kama.collection.v1.ListCollectionsRequest;
import dev.cloudeko.kama.collection.v1.ListCollectionsResponse;
import dev.cloudeko.kama.server.CollectionService;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.server.util.ResourceUtil;
import io.vertx.core.Future;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

import java.util.ArrayList;
import java.util.List;

public class ListCollectionsV1Handler extends BaseCollectionHandler<ListCollectionsRequest, ListCollectionsResponse> {

    public static final ServiceMethod<ListCollectionsRequest, ListCollectionsResponse> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.collection.v1.CollectionService"),
            "ListCollections",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(ListCollectionsRequest.newBuilder()));

    public ListCollectionsV1Handler(CollectionService collectionService) {
        super(collectionService);
    }

    @Override
    public void handle(GrpcServerRequest<ListCollectionsRequest, ListCollectionsResponse> request) {
        logger.debug("Received list collections request");
        request.handler(req -> collectionService.listCollections()
                .map(jsonList -> {
                    List<Collection> protos = new ArrayList<>();
                    for (var json : jsonList) {
                        protos.add(ResourceUtil.decode(json));
                    }
                    return ListCollectionsResponse.newBuilder().addAllCollections(protos).build();
                })
                .onSuccess(resp -> request.response().end(resp))
                .onFailure(err -> {
                    logger.error("Failed to list collections", err);
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.INTERNAL).end();
                })
        );
    }
}
