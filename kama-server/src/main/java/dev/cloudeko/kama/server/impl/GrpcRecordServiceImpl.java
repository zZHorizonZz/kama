package dev.cloudeko.kama.server.impl;

import com.google.protobuf.Empty;
import dev.cloudeko.kama.common.ResourceUtil;
import dev.cloudeko.kama.database.RecordService;
import dev.cloudeko.kama.record.v1.*;
import dev.cloudeko.kama.record.v1.Record;
import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;

public final class GrpcRecordServiceImpl extends VertxRecordServiceGrpcService {

    private final RecordService service;

    public GrpcRecordServiceImpl(RecordService service) {
        this.service = service;
    }

    @Override
    public Future<Record> createRecord(CreateRecordRequest request) {
        return service.createRecord(request.getParent(), ResourceUtil.encodeRecord(request.getRecord())).map(ResourceUtil::decodeRecord);
    }

    @Override
    public Future<Empty> deleteRecord(DeleteRecordRequest request) {
        return service.deleteRecord(request.getName()).mapEmpty();
    }

    @Override
    public Future<Record> updateRecord(UpdateRecordRequest request) {
        return service.updateRecord(ResourceUtil.encodeRecord(request.getRecord())).map(ResourceUtil::decodeRecord);
    }

    @Override
    public Future<Record> getRecord(GetRecordRequest request) {
        return service.getRecord(request.getName()).map(ResourceUtil::decodeRecord);
    }

    @Override
    public Future<ListRecordsResponse> listRecords(ListRecordsRequest request) {
        return service.listRecords(request.getParent()).map(list -> {
            ListRecordsResponse.Builder builder = ListRecordsResponse.newBuilder();
            for (JsonObject record : list) {
                builder.addRecords(ResourceUtil.decodeRecord(record));
            }
            return builder.build();
        });
    }
}
