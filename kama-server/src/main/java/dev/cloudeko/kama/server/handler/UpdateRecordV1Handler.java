package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.record.v1.Record;
import dev.cloudeko.kama.record.v1.UpdateRecordRequest;
import dev.cloudeko.kama.server.RecordService;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.server.util.ResourceUtil;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class UpdateRecordV1Handler extends BaseRecordHandler<UpdateRecordRequest, Record> {

    public static final ServiceMethod<UpdateRecordRequest, Record> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.record.v1.RecordService"),
            "UpdateRecord",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(UpdateRecordRequest.newBuilder()));

    public UpdateRecordV1Handler(RecordService recordService) { super(recordService); }

    @Override
    public void handle(GrpcServerRequest<UpdateRecordRequest, Record> request) {
        request.handler(req -> recordService.updateRecord(ResourceUtil.encode(req.getRecord()))
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
