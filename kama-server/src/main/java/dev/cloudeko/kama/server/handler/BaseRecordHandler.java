package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.server.RecordService;
import io.vertx.core.Handler;
import io.vertx.grpc.server.GrpcServerRequest;

public abstract class BaseRecordHandler<Req, Resp> implements Handler<GrpcServerRequest<Req, Resp>> {

    protected final RecordService recordService;

    protected BaseRecordHandler(RecordService recordService) {
        this.recordService = recordService;
    }
}
