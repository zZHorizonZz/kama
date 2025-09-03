package dev.cloudeko.kama.server.exception;

import io.vertx.grpc.common.GrpcStatus;

public class GrpcException extends RuntimeException {

    private final GrpcStatus status;

    public GrpcException(String message, GrpcStatus status) {
        super(message);
        this.status = status;
    }

    public GrpcException(String message, GrpcStatus status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public GrpcStatus getStatus() {
        return status;
    }
}
