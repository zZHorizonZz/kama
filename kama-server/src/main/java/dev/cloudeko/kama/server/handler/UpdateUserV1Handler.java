package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.identity.v1.UpdateUserRequest;
import dev.cloudeko.kama.identity.v1.User;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.common.ResourceUtil;
import io.vertx.core.json.JsonObject;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class UpdateUserV1Handler extends BaseIdentityHandler<UpdateUserRequest, User> {

    public static final ServiceMethod<UpdateUserRequest, User> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.identity.v1.IdentityServer"),
            "UpdateUser",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(UpdateUserRequest.newBuilder()));

    public UpdateUserV1Handler(UserService userService) {
        super(userService);
    }

    @Override
    public void handle(GrpcServerRequest<UpdateUserRequest, User> request) {
        request.handler(req -> {
            User user = req.getUser();
            String name = user.getName();
            
            // Extract user ID from resource name (users/{user})
            if (!name.startsWith("users/")) {
                request.response().status(GrpcStatus.INVALID_ARGUMENT).statusMessage("Invalid user name format").end();
                return;
            }
            
            String userId = name.substring(6); // Remove "users/" prefix
            
            JsonObject updates = new JsonObject();
            if (!user.getEmail().isEmpty()) {
                updates.put("email", user.getEmail());
            }
            if (!user.getDisplayName().isEmpty()) {
                updates.put("displayName", user.getDisplayName());
            }
            
            userService.updateUser(userId, updates)
                .onSuccess(response -> {
                    if (response == null) {
                        request.response().status(GrpcStatus.NOT_FOUND).statusMessage("User not found").end();
                        return;
                    }
                    User updatedUser = ResourceUtil.decodeUser(response);
                    request.response().end(updatedUser);
                })
                .onFailure(err -> {
                    logger.error("Failed to update user", err);
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.INTERNAL).end();
                });
        });
    }
}