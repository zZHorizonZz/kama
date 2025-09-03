package dev.cloudeko.kama.server;

import dev.cloudeko.kama.collection.v1.Collection;
import dev.cloudeko.kama.server.impl.CollectionServiceImpl;
import io.vertx.codegen.annotations.ProxyGen;
import io.vertx.codegen.annotations.VertxGen;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;

import java.util.List;

@VertxGen
@ProxyGen
public interface CollectionService {

    static CollectionService create(Vertx vertx) {
        return new CollectionServiceImpl(vertx);
    }

    static CollectionService createProxy(Vertx vertx, String address) {
        return new CollectionServiceVertxEBProxy(vertx, address);
    }

    Future<JsonObject> createCollection(JsonObject collection);

    Future<JsonObject> updateCollection(JsonObject collection);

    Future<Void> deleteCollection(String collection);

    Future<JsonObject> getCollection(String collection);

    Future<List<JsonObject>> listCollections();
}
