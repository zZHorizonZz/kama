package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.record.v1.CreateRecordRequest;
import dev.cloudeko.kama.record.v1.Record;
import dev.cloudeko.kama.server.RecordService;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.server.util.ResourceUtil;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class CreateRecordV1Handler extends BaseRecordHandler<CreateRecordRequest, Record> {

    public static final ServiceMethod<CreateRecordRequest, Record> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.record.v1.RecordService"),
            "CreateRecord",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(CreateRecordRequest.newBuilder()));

    public CreateRecordV1Handler(RecordService recordService) {
        super(recordService);
    }

    @Override
    public void handle(GrpcServerRequest<CreateRecordRequest, Record> request) {
        request.handler(req -> recordService.createRecord(req.getParent(), ResourceUtil.encode(req.getRecord()))
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
