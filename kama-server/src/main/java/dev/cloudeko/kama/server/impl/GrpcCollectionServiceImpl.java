package dev.cloudeko.kama.server.impl;

import com.google.protobuf.Empty;
import dev.cloudeko.kama.collection.v1.*;
import dev.cloudeko.kama.common.ResourceUtil;
import dev.cloudeko.kama.database.CollectionService;
import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;

public final class GrpcCollectionServiceImpl extends VertxCollectionServiceGrpcService {

    private final CollectionService service;

    public GrpcCollectionServiceImpl(CollectionService service) {
        this.service = service;
    }

    @Override
    public Future<Collection> createCollection(CreateCollectionRequest request) {
        return service.createCollection(ResourceUtil.encodeCollection(request.getCollection())).map(ResourceUtil::decodeCollection);
    }

    @Override
    public Future<Collection> updateCollection(UpdateCollectionRequest request) {
        return service.updateCollection(ResourceUtil.encodeCollection(request.getCollection())).map(ResourceUtil::decodeCollection);
    }

    @Override
    public Future<Empty> deleteCollection(DeleteCollectionRequest request) {
        return service.deleteCollection(request.getName()).mapEmpty();
    }

    @Override
    public Future<Collection> getCollection(GetCollectionRequest request) {
        return service.getCollection(request.getName()).map(ResourceUtil::decodeCollection);
    }

    @Override
    public Future<ListCollectionsResponse> listCollections(ListCollectionsRequest request) {
        return service.listCollections().map(list -> {
            ListCollectionsResponse.Builder builder = ListCollectionsResponse.newBuilder();
            for (JsonObject collection : list) {
                builder.addCollections(ResourceUtil.decodeCollection(collection));
            }
            return builder.build();
        });
    }
}
