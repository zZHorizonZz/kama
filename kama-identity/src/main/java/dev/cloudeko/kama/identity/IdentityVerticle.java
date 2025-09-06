package dev.cloudeko.kama.identity;

import dev.cloudeko.kama.common.DatabaseOptions;
import dev.cloudeko.kama.common.MigrationVerticle;
import io.vertx.core.Future;
import io.vertx.core.VerticleBase;
import io.vertx.core.eventbus.MessageConsumer;
import io.vertx.core.json.JsonObject;
import io.vertx.serviceproxy.ServiceBinder;
import org.jboss.logging.Logger;

public class IdentityVerticle extends VerticleBase {

    private static final Logger LOGGER = Logger.getLogger(IdentityVerticle.class);

    private UserService userService;
    private MessageConsumer<JsonObject> userServiceBinder;

    @Override
    public Future<?> start() {
        LOGGER.info("Starting Identity Verticle");

        DatabaseOptions databaseOptions = new DatabaseOptions(config().getJsonObject("database"));

        // Run database migrations first
        return deployMigrations(databaseOptions)
            .compose(v -> {
                // Create and register services
                userService = UserService.create(vertx, databaseOptions);
                userServiceBinder = new ServiceBinder(vertx)
                    .setAddress("dev.cloudeko.kama.identity.UserService")
                    .register(UserService.class, userService);

                LOGGER.info("Identity Verticle started successfully");
                return Future.succeededFuture();
            });
    }

    @Override
    public Future<?> stop() {
        LOGGER.info("Stopping Identity Verticle");
        
        if (userServiceBinder != null) {
            return userServiceBinder.unregister()
                .onSuccess(v -> LOGGER.info("Identity Verticle stopped successfully"))
                .onFailure(err -> LOGGER.error("Failed to stop Identity Verticle", err));
        }
        
        return Future.succeededFuture();
    }

    private Future<Void> deployMigrations(DatabaseOptions databaseOptions) {
        LOGGER.info("Running identity database migrations");
        
        JsonObject migrationConfig = new JsonObject()
            .put("database", JsonObject.mapFrom(databaseOptions))
            .put("migrationsLocation", "db/migration");
            
        return vertx.deployVerticle(new MigrationVerticle(), 
            new io.vertx.core.DeploymentOptions().setConfig(migrationConfig))
            .compose(deploymentId -> {
                LOGGER.info("Identity migrations completed");
                return Future.succeededFuture();
            });
    }
}