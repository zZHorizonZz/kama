package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.identity.v1.ChangePasswordRequest;
import dev.cloudeko.kama.identity.v1.PasswordChangeResponse;
import dev.cloudeko.kama.server.exception.GrpcException;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class ChangePasswordV1Handler extends BaseIdentityHandler<ChangePasswordRequest, PasswordChangeResponse> {

    public static final ServiceMethod<ChangePasswordRequest, PasswordChangeResponse> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.identity.v1.IdentityServer"),
            "ChangePassword",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(ChangePasswordRequest.newBuilder()));

    public ChangePasswordV1Handler(UserService userService) {
        super(userService);
    }

    @Override
    public void handle(GrpcServerRequest<ChangePasswordRequest, PasswordChangeResponse> request) {
        request.handler(req -> {
            String name = req.getName();
            String oldPassword = req.getOldPassword();
            String newPassword = req.getNewPassword();
            
            // Extract user ID from resource name (users/{user})
            if (!name.startsWith("users/")) {
                request.response().status(GrpcStatus.INVALID_ARGUMENT).statusMessage("Invalid user name format").end();
                return;
            }
            
            String userId = name.substring(6); // Remove "users/" prefix
            
            userService.changePassword(userId, oldPassword, newPassword)
                .onSuccess(response -> {
                    if (response == null) {
                        request.response().status(GrpcStatus.INTERNAL).end();
                        return;
                    }
                    
                    PasswordChangeResponse passwordResponse = PasswordChangeResponse.newBuilder()
                        .setMessage(response.getString("message", "Password changed successfully"))
                        .build();
                    
                    request.response().end(passwordResponse);
                })
                .onFailure(err -> {
                    logger.error("Failed to change password", err);
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    if (err.getMessage() != null && err.getMessage().contains("Invalid old password")) {
                        request.response().status(GrpcStatus.PERMISSION_DENIED).statusMessage("Invalid old password").end();
                        return;
                    }
                    request.response().status(GrpcStatus.INTERNAL).end();
                });
        });
    }
}