package dev.cloudeko.kama.common.exception;

import com.google.protobuf.ServiceException;
import io.vertx.grpc.common.GrpcStatus;

public class GrpcException extends ServiceException {

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
