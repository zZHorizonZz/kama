package dev.cloudeko.kama.database.impl;

import dev.cloudeko.kama.database.CollectionService;
import dev.cloudeko.kama.database.RecordService;
import dev.cloudeko.kama.collection.v1.Collection;
import dev.cloudeko.kama.common.DatabaseOptions;
import dev.cloudeko.kama.common.ResourceUtil;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.jdbcclient.JDBCConnectOptions;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.PoolOptions;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.SqlClient;
import io.vertx.sqlclient.templates.SqlTemplate;

import java.util.*;

public class RecordServiceImpl implements RecordService {

    private final Vertx vertx;
    private final SqlClient client;
    private final CollectionService collectionService;

    public RecordServiceImpl(Vertx vertx, CollectionService collectionService, DatabaseOptions options) {
        this.vertx = vertx;
        this.collectionService = collectionService;

        JDBCConnectOptions connect = new JDBCConnectOptions().setJdbcUrl(options.getUrl()).setUser(options.getUsername()).setPassword(options.getPassword());
        PoolOptions opts = new PoolOptions().setMaxSize(5);
        this.client = JDBCPool.pool(vertx, connect, opts);
    }

    private static String tableNameFor(Collection c) {
        return "\"c_" + c.getId().replace("-", "") + "\"";
    }

    @Override
    public Future<JsonObject> createRecord(String parent, JsonObject record) {
        dev.cloudeko.kama.record.v1.Record incoming = ResourceUtil.decodeRecord(record);
        String collectionName = (incoming.getCollection() == null || incoming.getCollection().isBlank()) ? parent : incoming.getCollection();
        if (collectionName == null || collectionName.isBlank()) {
            return Future.failedFuture("parent collection required");
        }
        return collectionService.getCollection(collectionName).compose(json -> {
            Collection collection = ResourceUtil.decodeCollection(json);

            // Validate and prepare values according to schema
            Map<String, dev.cloudeko.kama.collection.v1.CollectionField> schema = collection.getFieldsMap();
            // Values are in incoming.getValues().getFieldsMap() as Struct fields encoded in JSON in ResourceUtil pipeline.
            // We receive JsonObject; but here we have the proto. Extract values from the JSON we were passed for type-friendly handling.
            JsonObject inputJson = record.getJsonObject("values");
            if (inputJson == null)
                inputJson = new JsonObject();

            // Validate required fields present
            for (Map.Entry<String, dev.cloudeko.kama.collection.v1.CollectionField> e : schema.entrySet()) {
                if (e.getValue().getRequired() && !e.getValue().getSystem()) {
                    if (!inputJson.containsKey(e.getKey()) || inputJson.getValue(e.getKey()) == null) {
                        return Future.failedFuture("Missing required field: " + e.getKey());
                    }
                }
            }

            // Build column list and params
            List<String> columns = new ArrayList<>();
            Map<String, Object> params = new HashMap<>();

            UUID id = UUID.randomUUID();
            columns.add("\"id\"");
            params.put("id", id.toString());

            for (Map.Entry<String, dev.cloudeko.kama.collection.v1.CollectionField> e : schema.entrySet()) {
                String field = e.getKey();
                if (!inputJson.containsKey(field))
                    continue; // optional and not provided
                Object raw = inputJson.getValue(field);
                String colName = field.replaceAll("[^A-Za-z0-9_]", "_");
                String paramName = "p_" + colName;

                // Basic type conversions
                switch (e.getValue().getTypeCase()) {
                    case STRING_TYPE, REFERENCE_TYPE -> {
                        if (raw != null && !(raw instanceof String))
                            return Future.failedFuture("Field '" + field + "' must be string");
                        params.put(paramName, raw);
                    }
                    case INTEGER_TYPE -> {
                        if (raw == null) {
                            params.put(paramName, null);
                            break;
                        }
                        if (raw instanceof Number) {
                            params.put(paramName, ((Number) raw).longValue());
                        } else if (raw instanceof String s && !s.isBlank()) {
                            try {
                                params.put(paramName, Long.parseLong(s));
                            } catch (NumberFormatException ex) {
                                return Future.failedFuture("Field '" + field + "' must be integer");
                            }
                        } else {
                            return Future.failedFuture("Field '" + field + "' must be integer");
                        }
                    }
                    case BOOL_TYPE -> {
                        if (raw == null) {
                            params.put(paramName, null);
                            break;
                        }
                        if (raw instanceof Boolean b)
                            params.put(paramName, b);
                        else if (raw instanceof String s)
                            params.put(paramName, Boolean.parseBoolean(s));
                        else
                            return Future.failedFuture("Field '" + field + "' must be boolean");
                    }
                    case DOUBLE_TYPE -> {
                        if (raw == null) {
                            params.put(paramName, null);
                            break;
                        }
                        if (raw instanceof Number n)
                            params.put(paramName, n.doubleValue());
                        else if (raw instanceof String s && !s.isBlank()) {
                            try {
                                params.put(paramName, Double.parseDouble(s));
                            } catch (NumberFormatException ex) {
                                return Future.failedFuture("Field '" + field + "' must be double");
                            }
                        } else
                            return Future.failedFuture("Field '" + field + "' must be double");
                    }
                    case TIMESTAMP_TYPE -> {
                        // Accept ISO-8601 string; store as string for H2 TIMESTAMP casting by driver if supported; otherwise reject
                        if (raw != null && !(raw instanceof String))
                            return Future.failedFuture("Field '" + field + "' must be RFC3339 string");
                        params.put(paramName, raw);
                    }
                    case BYTES_TYPE -> {
                        if (raw == null) {
                            params.put(paramName, null);
                            break;
                        }
                        if (raw instanceof String s) { // expect base64 over JSON; store as string, H2 BLOB may accept bytes; keep simple as string
                            params.put(paramName, s);
                        } else
                            return Future.failedFuture("Field '" + field + "' must be base64 string");
                    }
                    case ARRAY_TYPE, MAP_TYPE, TYPE_NOT_SET -> {
                        // Store JSON text
                        params.put(paramName, inputJson.getValue(field) == null ? null : io.vertx.core.json.Json.encode(inputJson.getValue(field)));
                    }
                }
                columns.add(colName);
            }

            // Build SQL with named params. Note: We must quote column identifiers that may be mixed case; we used safe characters only.
            String tbl = tableNameFor(collection);
            StringBuilder sql = new StringBuilder("INSERT INTO ").append(tbl).append(" (");
            sql.append(String.join(", ", columns.stream().map(c -> c.startsWith("\"") ? c : "\"" + c + "\"").toList()));
            sql.append(") VALUES (");
            List<String> valueParams = new ArrayList<>();
            valueParams.add("#{id}");
            for (int i = 1; i < columns.size(); i++) {
                String col = columns.get(i);
                String pn = "#{p_" + col.replace("\"", "").replaceAll("[^A-Za-z0-9_]", "_") + "}";
                valueParams.add(pn);
            }
            sql.append(String.join(", ", valueParams)).append(")");

            final JsonObject valuesOut = inputJson;
            return SqlTemplate.forUpdate(client, sql.toString()).execute(params).map(v -> {
                dev.cloudeko.kama.record.v1.Record toStore = dev.cloudeko.kama.record.v1.Record.newBuilder(incoming)
                        .setId(id.toString())
                        .setName(collectionName + "/records/" + id)
                        .setCollection(collectionName)
                        .build();
                // Return with original values JSON
                JsonObject out = ResourceUtil.encodeRecord(toStore);
                out.put("values", valuesOut);
                return out;
            });
        });
    }

    @Override
    public Future<JsonObject> getRecord(String name) {
        if (name == null || name.isBlank())
            return Future.failedFuture("Invalid name");
        // Extract collection and record id
        int idx = name.lastIndexOf("/records/");
        if (idx < 0)
            return Future.failedFuture("Invalid name format");
        String collectionName = name.substring(0, idx);
        String id = name.substring(idx + "/records/".length());
        return collectionService.getCollection(collectionName).compose(json -> {
            Collection collection = ResourceUtil.decodeCollection(json);

            String tbl = tableNameFor(collection);
            // Build a select that includes all schema columns
            Set<String> fields = collection.getFieldsMap().keySet();
            String selectCols = "\"id\"" + (fields.isEmpty() ? "" : ", " + String.join(", ", fields.stream().map(f -> "\"" + f.replaceAll("[^A-Za-z0-9_]", "_") + "\"").toList()));
            String sql = "SELECT " + selectCols + " FROM " + tbl + " WHERE \"id\" = #{id}";
            return SqlTemplate.forQuery(client, sql).execute(Map.of("id", id))
                    .compose(rs -> {
                        if (!rs.iterator().hasNext())
                            return Future.failedFuture("Not found");
                        Row row = rs.iterator().next();
                        JsonObject values = new JsonObject();
                        int idxCol = 0;
                        // first column is id, skip
                        for (String f : fields) {
                            String col = f.replaceAll("[^A-Za-z0-9_]", "_");
                            Object v = row.getValue(col);
                            if (v == null)
                                continue;
                            values.put(f, v);
                        }
                        dev.cloudeko.kama.record.v1.Record rec = dev.cloudeko.kama.record.v1.Record.newBuilder()
                                .setId(id)
                                .setName(name)
                                .setCollection(collectionName)
                                .build();
                        JsonObject out = ResourceUtil.encodeRecord(rec);
                        out.put("values", values);
                        return Future.succeededFuture(out);
                    });
        });
    }

    @Override
    public Future<List<JsonObject>> listRecords(String parent) {
        if (parent == null || parent.isBlank()) {
            return Future.failedFuture("parent required");
        }

        return collectionService.getCollection(parent).compose(json -> {
            Collection collection = ResourceUtil.decodeCollection(json);

            String tbl = tableNameFor(collection);
            String sql = "SELECT \"id\" FROM " + tbl + " ORDER BY \"create_time\"";

            return SqlTemplate.forQuery(client, sql).execute(Collections.emptyMap())
                    .map(rowSet -> {
                        List<JsonObject> out = new ArrayList<>();
                        for (Row row : rowSet) {
                            String id = row.getString("id");
                            dev.cloudeko.kama.record.v1.Record rec = dev.cloudeko.kama.record.v1.Record.newBuilder()
                                    .setId(id)
                                    .setName(parent + "/records/" + id)
                                    .setCollection(parent)
                                    .build();
                            out.add(ResourceUtil.encodeRecord(rec));
                        }
                        return out;
                    });
        });
    }

    @Override
    public Future<JsonObject> updateRecord(JsonObject record) {
        dev.cloudeko.kama.record.v1.Record incoming = ResourceUtil.decodeRecord(record);
        String name = incoming.getName();
        if (name == null || name.isBlank())
            return Future.failedFuture("name required");
        // No actual column updates for now; just check existence and return same
        return getRecord(name);
    }

    @Override
    public Future<Void> deleteRecord(String name) {
        if (name == null || name.isBlank()) {
            return Future.failedFuture("name required");
        }

        int idx = name.lastIndexOf("/records/");
        if (idx < 0) {
            return Future.failedFuture("Invalid name format");
        }

        String collectionName = name.substring(0, idx);
        String id = name.substring(idx + "/records/".length());
        return collectionService.getCollection(collectionName).compose(json -> {
            Collection collection = ResourceUtil.decodeCollection(json);

            String tbl = tableNameFor(collection);
            String sql = "DELETE FROM " + tbl + " WHERE \"id\" = #{id}";

            return SqlTemplate.forUpdate(client, sql).execute(Map.of("id", id)).compose(r -> r.rowCount() == 0 ? Future.failedFuture("Not found") : Future.succeededFuture());
        });
    }
}
