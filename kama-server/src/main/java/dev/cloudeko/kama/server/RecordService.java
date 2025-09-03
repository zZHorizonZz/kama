package dev.cloudeko.kama.server;

import dev.cloudeko.kama.server.impl.RecordServiceImpl;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;

import java.util.List;

public interface RecordService {

    static RecordService create(Vertx vertx, DatabaseOptions options) {
        return new RecordServiceImpl(vertx, options);
    }

    Future<JsonObject> createRecord(String parent, JsonObject record);

    Future<JsonObject> getRecord(String name);

    Future<List<JsonObject>> listRecords(String parent);

    Future<JsonObject> updateRecord(JsonObject record);

    Future<Void> deleteRecord(String name);
}
