package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.identity.v1.CreateUserRequest;
import dev.cloudeko.kama.identity.v1.User;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.common.ResourceUtil;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class CreateUserV1Handler extends BaseIdentityHandler<CreateUserRequest, User> {

    public static final ServiceMethod<CreateUserRequest, User> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.identity.v1.IdentityServer"),
            "CreateUser",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(CreateUserRequest.newBuilder()));

    public CreateUserV1Handler(UserService userService) {
        super(userService);
    }

    @Override
    public void handle(GrpcServerRequest<CreateUserRequest, User> request) {
        request.handler(req -> {
            String email = req.getEmail();
            String password = req.getPassword();
            String displayName = req.getDisplayName();
            
            userService.createUser(email, password, displayName)
                .onSuccess(response -> {
                    if (response == null) {
                        request.response().status(GrpcStatus.INTERNAL).end();
                        return;
                    }
                    User user = ResourceUtil.decodeUser(response);
                    request.response().end(user);
                })
                .onFailure(err -> {
                    logger.error("Failed to create user", err);
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.INTERNAL).end();
                });
        });
    }
}