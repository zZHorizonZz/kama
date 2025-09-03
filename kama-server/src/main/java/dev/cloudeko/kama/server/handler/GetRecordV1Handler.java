package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.record.v1.GetRecordRequest;
import dev.cloudeko.kama.record.v1.Record;
import dev.cloudeko.kama.server.RecordService;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.server.util.ResourceUtil;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class GetRecordV1Handler extends BaseRecordHandler<GetRecordRequest, Record> {

    public static final ServiceMethod<GetRecordRequest, Record> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.record.v1"),
            "GetRecord",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(GetRecordRequest.newBuilder()));

    public GetRecordV1Handler(RecordService recordService) { super(recordService); }

    @Override
    public void handle(GrpcServerRequest<GetRecordRequest, Record> request) {
        request.handler(req -> recordService.getRecord(req.getName())
                .onSuccess(response -> {
                    if (response == null) {
                        request.response().status(GrpcStatus.INTERNAL).end();
                        return;
                    }
                    request.response().end(ResourceUtil.decodeRecord(response));
                })
                .onFailure(err -> {
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.INTERNAL).end();
                })
        );
    }
}
