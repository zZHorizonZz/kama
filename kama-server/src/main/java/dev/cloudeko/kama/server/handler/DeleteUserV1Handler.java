package dev.cloudeko.kama.server.handler;

import com.google.protobuf.Empty;
import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.identity.v1.DeleteUserRequest;
import dev.cloudeko.kama.server.exception.GrpcException;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class DeleteUserV1Handler extends BaseIdentityHandler<DeleteUserRequest, Empty> {

    public static final ServiceMethod<DeleteUserRequest, Empty> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.identity.v1.IdentityServer"),
            "DeleteUser",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(DeleteUserRequest.newBuilder()));

    public DeleteUserV1Handler(UserService userService) {
        super(userService);
    }

    @Override
    public void handle(GrpcServerRequest<DeleteUserRequest, Empty> request) {
        request.handler(req -> {
            String name = req.getName();
            
            // Extract user ID from resource name (users/{user})
            if (!name.startsWith("users/")) {
                request.response().status(GrpcStatus.INVALID_ARGUMENT).statusMessage("Invalid user name format").end();
                return;
            }
            
            String userId = name.substring(6); // Remove "users/" prefix
            
            userService.deleteUser(userId)
                .onSuccess(response -> {
                    request.response().end(Empty.getDefaultInstance());
                })
                .onFailure(err -> {
                    logger.error("Failed to delete user", err);
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.NOT_FOUND).statusMessage("User not found").end();
                });
        });
    }
}