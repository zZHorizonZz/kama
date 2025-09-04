package dev.cloudeko.kama.server;

import dev.cloudeko.kama.server.impl.CollectionServiceImpl;
import dev.cloudeko.kama.server.impl.RecordServiceImpl;
import io.vertx.core.*;
import io.vertx.core.http.HttpServer;
import io.vertx.core.http.HttpServerOptions;
import io.vertx.core.json.JsonObject;
import io.vertx.grpc.server.GrpcServer;
import io.vertx.grpc.server.GrpcServerOptions;

public class ServerVerticle extends VerticleBase {

    private HttpServer httpServer;
    private GrpcServer grpcServer;

    @Override
    public Future<?> start() throws Exception {
        // Get configuration
        JsonObject config = config();
        int port = config.getInteger("port", 9000);
        String host = config.getString("host", "0.0.0.0");
        DatabaseOptions dbOptions = new DatabaseOptions(config.getJsonObject("database", new JsonObject()));

        DeploymentOptions databaseOptions = new DeploymentOptions()
                .setConfig(new JsonObject().put("database", dbOptions.toJson()));

        // Deploy migration verticle first
        return vertx.deployVerticle(new MigrationVerticle(), databaseOptions).compose(migrationResult -> {
            // Start gRPC server after migrations complete
            return startGrpcServer(host, port, dbOptions);
        });
    }

    private Future<Void> startGrpcServer(String host, int port, DatabaseOptions dbOptions) {
        // Create gRPC server options
        GrpcServerOptions grpcOptions = new GrpcServerOptions();

        // Create HTTP server options for CORS and gRPC-Web
        HttpServerOptions httpOptions = new HttpServerOptions()
                .setPort(port)
                .setHost(host);

        // Create the gRPC server
        grpcServer = GrpcServer.server(vertx, grpcOptions);

        // Create service implementations
        CollectionServiceImpl collectionService = new CollectionServiceImpl(vertx, dbOptions);
        RecordServiceImpl recordService = new RecordServiceImpl(vertx, dbOptions);

        // Register services with gRPC server
        collectionService.bind(grpcServer);
        recordService.bind(grpcServer);

        // Create HTTP server
        httpServer = vertx.createHttpServer(httpOptions);

        // Handle gRPC requests
        httpServer.requestHandler(request -> {
            // Add CORS headers for web clients
            request.response()
                    .putHeader("Access-Control-Allow-Origin", "*")
                    .putHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                    .putHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, grpc-timeout, grpc-encoding, grpc-accept-encoding, x-grpc-web, x-user-agent");

            // Handle preflight requests
            if ("OPTIONS".equals(request.method().name())) {
                request.response().setStatusCode(200).end();
                return;
            }

            // Route to gRPC server
            grpcServer.handle(request);
        });

        // Start the HTTP server
        return httpServer.listen()
                .onSuccess(server -> {
                    System.out.println("gRPC server started on " + host + ":" + port);
                    System.out.println("Available services:");
                    System.out.println("  - cloudeko.kama.collection.v1.CollectionService");
                    System.out.println("  - cloudeko.kama.record.v1.RecordService");
                })
                .onFailure(cause -> {
                    System.err.println("Failed to start gRPC server: " + cause.getMessage());
                })
                .mapEmpty();
    }

    @Override
    public Future<?> stop() throws Exception {
        Future<Void> httpFuture = httpServer != null ? httpServer.close() : Future.succeededFuture();

        return httpFuture.onSuccess(result -> {
            System.out.println("Server stopped successfully");
        }).onFailure(cause -> {
            System.err.println("Failed to stop server: " + cause.getMessage());
        });
    }
}