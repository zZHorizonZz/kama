package dev.cloudeko.kama.server.impl;

import dev.cloudeko.kama.collection.v1.Collection;
import dev.cloudeko.kama.server.CollectionService;
import dev.cloudeko.kama.server.util.ResourceUtil;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.Tuple;
import io.vertx.sqlclient.templates.RowMapper;
import io.vertx.sqlclient.templates.TupleMapper;

import java.util.List;
import java.util.UUID;
import java.util.function.Function;

public record CollectionServiceImpl(Vertx vertx) implements CollectionService {

    @Override
    public Future<JsonObject> createCollection(JsonObject collection) {
        Collection resource = ResourceUtil.decode(collection);
        if (resource == null) {
            return Future.failedFuture("Invalid collection");
        }

        UUID id = UUID.randomUUID();
        resource = Collection.newBuilder().setId(id.toString()).setName("/collections/" + id).build();

        return null;
    }

    @Override
    public Future<JsonObject> updateCollection(JsonObject collection) {
        return null;
    }

    @Override
    public Future<Void> deleteCollection(String collection) {
        return null;
    }

    @Override
    public Future<JsonObject> getCollection(String collection) {
        return null;
    }

    @Override
    public Future<List<JsonObject>> listCollections() {
        return null;
    }

    private static final class CollectionMapper implements RowMapper<Collection>, TupleMapper<Collection> {

        @Override
        public Collection map(Row row) {
            return null;
        }

        @Override
        public Tuple map(Function<Integer, String> function, int i, Collection collection) {
            return null;
        }
    }
}
