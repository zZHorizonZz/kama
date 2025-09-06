package dev.cloudeko.kama.database;

import dev.cloudeko.kama.common.DatabaseOptions;
import io.vertx.core.Future;
import io.vertx.core.VerticleBase;
import io.vertx.core.eventbus.MessageConsumer;
import io.vertx.core.json.JsonObject;
import io.vertx.serviceproxy.ServiceBinder;

public class DatabaseVerticle extends VerticleBase {

    private CollectionService collectionService;
    private RecordService recordService;

    private MessageConsumer<JsonObject> collectionServiceBinder;
    private MessageConsumer<JsonObject> recordServiceBinder;

    @Override
    public Future<?> start() {
        DatabaseOptions databaseOptions = new DatabaseOptions(config().getJsonObject("database"));

        collectionService = CollectionService.create(vertx, databaseOptions);
        recordService = RecordService.create(vertx, collectionService, databaseOptions);

        collectionServiceBinder = new ServiceBinder(vertx).setAddress("dev.cloudeko.kama.database.CollectionService").register(CollectionService.class, collectionService);
        recordServiceBinder = new ServiceBinder(vertx).setAddress("dev.cloudeko.kama.database.RecordService").register(RecordService.class, recordService);

        return Future.succeededFuture();
    }

    @Override
    public Future<?> stop() {
        return Future.all(collectionServiceBinder.unregister(), recordServiceBinder.unregister());
    }
}
