package dev.cloudeko.kama.server.handler;

import com.google.protobuf.Empty;
import dev.cloudeko.kama.record.v1.DeleteRecordRequest;
import dev.cloudeko.kama.server.RecordService;
import dev.cloudeko.kama.server.exception.GrpcException;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class DeleteRecordV1Handler extends BaseRecordHandler<DeleteRecordRequest, Empty> {

    public static final ServiceMethod<DeleteRecordRequest, Empty> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.record.v1"),
            "DeleteRecord",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(DeleteRecordRequest.newBuilder()));

    public DeleteRecordV1Handler(RecordService recordService) { super(recordService); }

    @Override
    public void handle(GrpcServerRequest<DeleteRecordRequest, Empty> request) {
        request.handler(req -> recordService.deleteRecord(req.getName())
                .onSuccess(v -> request.response().end(Empty.getDefaultInstance()))
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
