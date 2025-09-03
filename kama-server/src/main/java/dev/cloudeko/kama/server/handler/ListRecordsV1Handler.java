package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.record.v1.ListRecordsRequest;
import dev.cloudeko.kama.record.v1.ListRecordsResponse;
import dev.cloudeko.kama.record.v1.Record;
import dev.cloudeko.kama.server.RecordService;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.server.util.ResourceUtil;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

import java.util.ArrayList;
import java.util.List;

public class ListRecordsV1Handler extends BaseRecordHandler<ListRecordsRequest, ListRecordsResponse> {

    public static final ServiceMethod<ListRecordsRequest, ListRecordsResponse> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.record.v1"),
            "ListRecords",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(ListRecordsRequest.newBuilder()));

    public ListRecordsV1Handler(RecordService recordService) { super(recordService); }

    @Override
    public void handle(GrpcServerRequest<ListRecordsRequest, ListRecordsResponse> request) {
        request.handler(req -> recordService.listRecords(req.getParent())
                .map(jsonList -> {
                    List<Record> protos = new ArrayList<>();
                    for (var json : jsonList) protos.add(ResourceUtil.decodeRecord(json));
                    return ListRecordsResponse.newBuilder().addAllRecords(protos).build();
                })
                .onSuccess(resp -> request.response().end(resp))
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
