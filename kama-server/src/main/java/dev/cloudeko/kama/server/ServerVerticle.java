package dev.cloudeko.kama.server;

import dev.cloudeko.kama.common.DatabaseOptions;
import dev.cloudeko.kama.common.MigrationVerticle;
import dev.cloudeko.kama.database.CollectionService;
import dev.cloudeko.kama.database.DatabaseVerticle;
import dev.cloudeko.kama.database.RecordService;
import dev.cloudeko.kama.identity.IdentityVerticle;
import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.server.impl.GrpcCollectionServiceImpl;
import dev.cloudeko.kama.server.impl.GrpcRecordServiceImpl;
import dev.cloudeko.kama.server.impl.GrpcIdentityServiceImpl;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Future;
import io.vertx.core.VerticleBase;
import io.vertx.core.http.HttpServer;
import io.vertx.core.http.HttpServerOptions;
import io.vertx.core.json.JsonObject;
import io.vertx.grpc.server.GrpcServer;
import io.vertx.grpc.server.GrpcServerOptions;
import org.jboss.logging.Logger;

public class ServerVerticle extends VerticleBase {

    private static final Logger logger = Logger.getLogger(ServerVerticle.class);

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
        return Future.all(
                vertx.deployVerticle(new MigrationVerticle(), databaseOptions),
                vertx.deployVerticle(DatabaseVerticle.class, databaseOptions),
                vertx.deployVerticle(IdentityVerticle.class, databaseOptions)
        ).compose(migrationResult -> {
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

        CollectionService collectionServiceProxy = CollectionService.createProxy(vertx, "dev.cloudeko.kama.database.CollectionService");
        RecordService recordServiceProxy = RecordService.createProxy(vertx, "dev.cloudeko.kama.database.RecordService");
        UserService userServiceProxy = UserService.createProxy(vertx, "dev.cloudeko.kama.identity.UserService");

        // Create service implementations
        GrpcCollectionServiceImpl collectionService = new GrpcCollectionServiceImpl(collectionServiceProxy);
        GrpcRecordServiceImpl recordService = new GrpcRecordServiceImpl(recordServiceProxy);
        GrpcIdentityServiceImpl identityService = new GrpcIdentityServiceImpl(userServiceProxy);

        // Register services with gRPC server
        collectionService.bind(grpcServer);
        recordService.bind(grpcServer);
        identityService.bind(grpcServer);

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
                    logger.infov("HTTP server started on {0}:{1,number,#}", host, port);
                    logger.infov("Available services:");
                    logger.infov("  - cloudeko.kama.collection.v1.CollectionService");
                    logger.infov("  - cloudeko.kama.record.v1.RecordService");
                    logger.infov("  - cloudeko.kama.identity.v1.IdentityServer");
                })
                .onFailure(cause -> logger.errorv(cause, "Failed to start gRPC server"))
                .mapEmpty();
    }

    @Override
    public Future<?> stop() throws Exception {
        Future<Void> httpFuture = httpServer != null ? httpServer.close() : Future.succeededFuture();

        return httpFuture
                .onSuccess(_ -> logger.infov("HTTP server stopped successfully"))
                .onFailure(cause -> logger.errorv(cause, "Failed to stop HTTP server"));
    }
}