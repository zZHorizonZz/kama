package dev.cloudeko.kama.common;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.configuration.Configuration;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.jboss.logging.Logger;

public class MigrationVerticle extends AbstractVerticle {

    private static final Logger log = Logger.getLogger(MigrationVerticle.class);

    @Override
    public void start(Promise<Void> promise) {
        JsonObject config = config().getJsonObject("database", new JsonObject());
        DatabaseOptions options = new DatabaseOptions(config);

        log.infov("Starting Flyway migration for database: {0}", options.getUrl());

        Configuration migrationsConfiguration = convertToFluentConfiguration(options);
        Flyway flyway = new Flyway(migrationsConfiguration);

        try {
            flyway.migrate();
            promise.complete();
        } catch (Exception e) {
            log.errorv(e, "Failed to migrate database: {0}", e.getMessage());
            promise.fail(e);
        }
    }

    private FluentConfiguration convertToFluentConfiguration(DatabaseOptions options) {
        FluentConfiguration config = new FluentConfiguration()
                .dataSource(
                        options.getUrl(),
                        options.getUsername(),
                        options.getPassword()
                );

        // SQLite doesn't support schemas, so don't configure them for SQLite
        if (!options.getUrl().startsWith("jdbc:sqlite:")) {
            config
                    .createSchemas(true)
                    .schemas(options.getSchema())
                    .defaultSchema(options.getSchema());
        } else {
            config.createSchemas(false);
        }

        return config;
    }
}

