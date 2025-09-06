package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.identity.v1.GetUserRequest;
import dev.cloudeko.kama.identity.v1.User;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.common.ResourceUtil;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class GetUserV1Handler extends BaseIdentityHandler<GetUserRequest, User> {

    public static final ServiceMethod<GetUserRequest, User> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.identity.v1.IdentityServer"),
            "GetUser",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(GetUserRequest.newBuilder()));

    public GetUserV1Handler(UserService userService) {
        super(userService);
    }

    @Override
    public void handle(GrpcServerRequest<GetUserRequest, User> request) {
        request.handler(req -> {
            String name = req.getName();
            
            // Extract user ID from resource name (users/{user})
            if (!name.startsWith("users/")) {
                request.response().status(GrpcStatus.INVALID_ARGUMENT).statusMessage("Invalid user name format").end();
                return;
            }
            
            String userId = name.substring(6); // Remove "users/" prefix
            
            userService.getUserById(userId)
                .onSuccess(response -> {
                    if (response == null) {
                        request.response().status(GrpcStatus.NOT_FOUND).statusMessage("User not found").end();
                        return;
                    }
                    User user = ResourceUtil.decodeUser(response);
                    request.response().end(user);
                })
                .onFailure(err -> {
                    logger.error("Failed to get user", err);
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.NOT_FOUND).statusMessage("User not found").end();
                });
        });
    }
}