package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.identity.UserService;
import io.vertx.core.Handler;
import io.vertx.grpc.server.GrpcServerRequest;
import org.jboss.logging.Logger;

public abstract class BaseIdentityHandler<Req, Resp> implements Handler<GrpcServerRequest<Req, Resp>> {

    protected final Logger logger = Logger.getLogger(getClass());
    protected final UserService userService;

    protected BaseIdentityHandler(UserService userService) {
        this.userService = userService;
    }
}