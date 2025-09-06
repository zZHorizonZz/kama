package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.identity.v1.ResetPasswordRequest;
import dev.cloudeko.kama.identity.v1.PasswordResetResponse;
import dev.cloudeko.kama.server.exception.GrpcException;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class ResetPasswordV1Handler extends BaseIdentityHandler<ResetPasswordRequest, PasswordResetResponse> {

    public static final ServiceMethod<ResetPasswordRequest, PasswordResetResponse> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.identity.v1.IdentityServer"),
            "ResetPassword",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(ResetPasswordRequest.newBuilder()));

    public ResetPasswordV1Handler(UserService userService) {
        super(userService);
    }

    @Override
    public void handle(GrpcServerRequest<ResetPasswordRequest, PasswordResetResponse> request) {
        request.handler(req -> {
            String email = req.getEmail();
            
            userService.resetPassword(email)
                .onSuccess(response -> {
                    if (response == null) {
                        request.response().status(GrpcStatus.INTERNAL).end();
                        return;
                    }
                    
                    PasswordResetResponse.Builder responseBuilder = PasswordResetResponse.newBuilder()
                        .setMessage(response.getString("message", "Password reset initiated"));
                    
                    if (response.containsKey("resetToken")) {
                        responseBuilder.setResetToken(response.getString("resetToken"));
                    }
                    
                    request.response().end(responseBuilder.build());
                })
                .onFailure(err -> {
                    logger.error("Failed to reset password", err);
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.INTERNAL).end();
                });
        });
    }
}