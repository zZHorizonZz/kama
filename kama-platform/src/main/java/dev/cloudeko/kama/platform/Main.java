package dev.cloudeko.kama.platform;

import dev.cloudeko.kama.server.ServerVerticle;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Vertx;
import io.vertx.core.VertxOptions;
import io.vertx.core.json.JsonObject;
import org.jboss.logging.Logger;

public class Main {

    private static final Logger logger = Logger.getLogger(Main.class);

    public static void main(String[] args) {
        // Configure Vert.x
        VertxOptions vertxOptions = new VertxOptions()
                .setEventLoopPoolSize(4)
                .setWorkerPoolSize(20);

        // Create Vert.x instance
        Vertx vertx = Vertx.vertx(vertxOptions);

        // Configuration
        JsonObject config = new JsonObject()
                .put("port", getIntProperty("KAMA_PORT", 9000))
                .put("host", getProperty("KAMA_HOST", "0.0.0.0"))
                .put("database", new JsonObject()
                        .put("url", getProperty("KAMA_DB_URL", "jdbc:sqlite:kama-platform/src/main/resources/kama.db"))
                        .put("user", getProperty("KAMA_DB_USER", ""))
                        .put("password", getProperty("KAMA_DB_PASSWORD", ""))
                        .put("driver", getProperty("KAMA_DB_DRIVER", "org.sqlite.JDBC")));

        // Deployment options
        DeploymentOptions deploymentOptions = new DeploymentOptions()
                .setConfig(config)
                .setInstances(1);

        logger.infov("Starting Kama Server...");
        logger.infov("Configuration:");
        logger.infov("  Host: {0}", config.getString("host"));
        logger.infov("  Port: {0}", config.getInteger("port"));
        logger.infov("  Database URL: {0}", config.getJsonObject("database").getString("url"));

        // Deploy the server verticle
        vertx.deployVerticle(new ServerVerticle(), deploymentOptions).onComplete(result -> {
            if (result.succeeded()) {
                logger.infov("Kama Server started successfully!");
                logger.infov("Deployment ID: {0}", result.result());

                // Add shutdown hook
                Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                    logger.infov("Shutting down Kama Server...");
                    vertx.close();
                }));
            } else {
                logger.errorv(result.cause(), "Failed to start Kama Server");
                vertx.close();
                System.exit(1);
            }
        });
    }

    private static String getProperty(String key, String defaultValue) {
        String value = System.getProperty(key);
        if (value == null) {
            value = System.getenv(key);
        }
        return value != null ? value : defaultValue;
    }

    private static int getIntProperty(String key, int defaultValue) {
        String value = getProperty(key, String.valueOf(defaultValue));
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
