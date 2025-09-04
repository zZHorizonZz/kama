package dev.cloudeko.kama.platform;

import dev.cloudeko.kama.server.ServerVerticle;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Vertx;
import io.vertx.core.VertxOptions;
import io.vertx.core.json.JsonObject;

public class Main {
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

        System.out.println("Starting Kama Server...");
        System.out.println("Configuration:");
        System.out.println("  Host: " + config.getString("host"));
        System.out.println("  Port: " + config.getInteger("port"));
        System.out.println("  Database URL: " + config.getJsonObject("database").getString("url"));

        // Deploy the server verticle
        vertx.deployVerticle(new ServerVerticle(), deploymentOptions).onComplete(result -> {
            if (result.succeeded()) {
                System.out.println("Kama Server started successfully!");
                System.out.println("Deployment ID: " + result.result());

                // Add shutdown hook
                Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                    System.out.println("Shutting down Kama Server...");
                    vertx.close();
                }));
            } else {
                System.err.println("Failed to start Kama Server: " + result.cause().getMessage());
                result.cause().printStackTrace();
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
