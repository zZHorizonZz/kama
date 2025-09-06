package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.identity.v1.ValidateTokenRequest;
import dev.cloudeko.kama.identity.v1.TokenValidationResponse;
import dev.cloudeko.kama.server.exception.GrpcException;
import io.vertx.core.json.JsonObject;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class ValidateTokenV1Handler extends BaseIdentityHandler<ValidateTokenRequest, TokenValidationResponse> {

    public static final ServiceMethod<ValidateTokenRequest, TokenValidationResponse> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.identity.v1.IdentityServer"),
            "ValidateToken",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(ValidateTokenRequest.newBuilder()));

    public ValidateTokenV1Handler(UserService userService) {
        super(userService);
    }

    @Override
    public void handle(GrpcServerRequest<ValidateTokenRequest, TokenValidationResponse> request) {
        request.handler(req -> {
            String token = req.getToken();
            
            userService.validateJwtToken(token)
                .onSuccess(response -> {
                    if (response == null) {
                        request.response().status(GrpcStatus.INTERNAL).end();
                        return;
                    }
                    
                    TokenValidationResponse.Builder responseBuilder = TokenValidationResponse.newBuilder()
                        .setValid(response.getBoolean("valid", false));
                    
                    if (response.containsKey("userId")) {
                        responseBuilder.setUserId(response.getString("userId"));
                    }
                    if (response.containsKey("error")) {
                        responseBuilder.setError(response.getString("error"));
                    }
                    
                    request.response().end(responseBuilder.build());
                })
                .onFailure(err -> {
                    logger.error("Failed to validate token", err);
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.INTERNAL).end();
                });
        });
    }
}