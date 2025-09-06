package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.identity.v1.AuthenticateUserRequest;
import dev.cloudeko.kama.identity.v1.AuthenticationResponse;
import dev.cloudeko.kama.identity.v1.User;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.common.ResourceUtil;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class AuthenticateUserV1Handler extends BaseIdentityHandler<AuthenticateUserRequest, AuthenticationResponse> {

    public static final ServiceMethod<AuthenticateUserRequest, AuthenticationResponse> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.identity.v1.IdentityServer"),
            "AuthenticateUser",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(AuthenticateUserRequest.newBuilder()));

    public AuthenticateUserV1Handler(UserService userService) {
        super(userService);
    }

    @Override
    public void handle(GrpcServerRequest<AuthenticateUserRequest, AuthenticationResponse> request) {
        request.handler(req -> {
            String email = req.getEmail();
            String password = req.getPassword();
            
            userService.authenticateUser(email, password)
                .compose(userJson -> {
                    // Generate JWT token for the authenticated user
                    String userId = userJson.getString("id");
                    return userService.generateJwtToken(userId)
                        .map(tokenJson -> {
                            User user = ResourceUtil.decodeUser(userJson);
                            AuthenticationResponse.Builder responseBuilder = AuthenticationResponse.newBuilder()
                                .setUser(user)
                                .setToken(tokenJson.getString("token"))
                                .setExpiresIn(tokenJson.getLong("expiresIn"));
                            return responseBuilder.build();
                        });
                })
                .onSuccess(response -> {
                    if (response == null) {
                        request.response().status(GrpcStatus.INTERNAL).end();
                        return;
                    }
                    request.response().end(response);
                })
                .onFailure(err -> {
                    logger.error("Failed to authenticate user", err);
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.UNAUTHENTICATED).statusMessage("Invalid credentials").end();
                });
        });
    }
}