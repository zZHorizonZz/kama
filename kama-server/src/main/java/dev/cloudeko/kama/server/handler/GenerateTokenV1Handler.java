package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.identity.v1.GenerateTokenRequest;
import dev.cloudeko.kama.identity.v1.TokenResponse;
import dev.cloudeko.kama.server.exception.GrpcException;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class GenerateTokenV1Handler extends BaseIdentityHandler<GenerateTokenRequest, TokenResponse> {

    public static final ServiceMethod<GenerateTokenRequest, TokenResponse> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.identity.v1.IdentityServer"),
            "GenerateToken",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(GenerateTokenRequest.newBuilder()));

    public GenerateTokenV1Handler(UserService userService) {
        super(userService);
    }

    @Override
    public void handle(GrpcServerRequest<GenerateTokenRequest, TokenResponse> request) {
        request.handler(req -> {
            String name = req.getName();
            
            // Extract user ID from resource name (users/{user})
            if (!name.startsWith("users/")) {
                request.response().status(GrpcStatus.INVALID_ARGUMENT).statusMessage("Invalid user name format").end();
                return;
            }
            
            String userId = name.substring(6); // Remove "users/" prefix
            
            userService.generateJwtToken(userId)
                .onSuccess(response -> {
                    if (response == null) {
                        request.response().status(GrpcStatus.INTERNAL).end();
                        return;
                    }
                    
                    TokenResponse tokenResponse = TokenResponse.newBuilder()
                        .setToken(response.getString("token"))
                        .setExpiresIn(response.getLong("expiresIn", 3600L))
                        .build();
                    
                    request.response().end(tokenResponse);
                })
                .onFailure(err -> {
                    logger.error("Failed to generate token", err);
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.INTERNAL).end();
                });
        });
    }
}