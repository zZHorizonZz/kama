package dev.cloudeko.kama.server.exception;

import io.vertx.grpc.common.GrpcStatus;

public class ResourceAlreadyExists extends GrpcException {

    private static final GrpcStatus STATUS = GrpcStatus.ALREADY_EXISTS;

    public ResourceAlreadyExists(String message) {
        super(message, STATUS);
    }

    public ResourceAlreadyExists(String message, Throwable cause) {
        super(message, STATUS, cause);
    }
}
