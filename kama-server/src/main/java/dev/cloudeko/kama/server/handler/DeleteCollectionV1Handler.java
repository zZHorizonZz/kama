package dev.cloudeko.kama.server.handler;

import com.google.protobuf.Empty;
import dev.cloudeko.kama.collection.v1.DeleteCollectionRequest;
import dev.cloudeko.kama.server.CollectionService;
import dev.cloudeko.kama.server.exception.GrpcException;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class DeleteCollectionV1Handler extends BaseCollectionHandler<DeleteCollectionRequest, Empty> {

    public static final ServiceMethod<DeleteCollectionRequest, Empty> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.collection.v1.CollectionService"),
            "DeleteCollection",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(DeleteCollectionRequest.newBuilder()));

    public DeleteCollectionV1Handler(CollectionService collectionService) {
        super(collectionService);
    }

    @Override
    public void handle(GrpcServerRequest<DeleteCollectionRequest, Empty> request) {
        request.handler(req -> collectionService.deleteCollection(req.getName())
                .onSuccess(v -> request.response().end(Empty.getDefaultInstance()))
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
