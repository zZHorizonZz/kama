package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.server.RecordService;
import io.vertx.core.Handler;
import io.vertx.grpc.server.GrpcServerRequest;
import org.jboss.logging.Logger;

public abstract class BaseRecordHandler<Req, Resp> implements Handler<GrpcServerRequest<Req, Resp>> {

    protected final Logger logger = Logger.getLogger(getClass());
    protected final RecordService recordService;

    protected BaseRecordHandler(RecordService recordService) {
        this.recordService = recordService;
    }
}
