package dev.cloudeko.kama.database;

import dev.cloudeko.kama.common.DatabaseOptions;
import dev.cloudeko.kama.database.impl.RecordServiceImpl;
import io.vertx.codegen.annotations.ProxyGen;
import io.vertx.codegen.annotations.VertxGen;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;

import java.util.List;

@VertxGen
@ProxyGen
public interface RecordService {

    static RecordService create(Vertx vertx, CollectionService collectionService, DatabaseOptions options) {
        return new RecordServiceImpl(vertx, collectionService, options);
    }

    static RecordService createProxy(Vertx vertx, String address) {
        return new RecordServiceVertxEBProxy(vertx, address);
    }

    Future<JsonObject> createRecord(String parent, JsonObject record);

    Future<JsonObject> getRecord(String name);

    Future<List<JsonObject>> listRecords(String parent);

    Future<JsonObject> updateRecord(JsonObject record);

    Future<Void> deleteRecord(String name);
}
