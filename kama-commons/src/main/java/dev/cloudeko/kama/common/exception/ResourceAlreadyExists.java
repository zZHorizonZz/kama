package dev.cloudeko.kama.common.exception;

import io.vertx.core.json.JsonObject;
import io.vertx.serviceproxy.ServiceException;

public class ResourceAlreadyExists extends ServiceException {

    private static final int FAILURE_CODE = 409;

    public ResourceAlreadyExists(String message) {
        super(FAILURE_CODE, message);
    }

    public ResourceAlreadyExists(String message, Throwable cause) {
        super(FAILURE_CODE, message, JsonObject.mapFrom(cause));
    }
}
