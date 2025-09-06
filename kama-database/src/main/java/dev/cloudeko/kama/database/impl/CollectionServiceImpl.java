package dev.cloudeko.kama.database.impl;

import com.google.protobuf.Timestamp;
import dev.cloudeko.kama.database.CollectionService;
import dev.cloudeko.kama.collection.v1.Collection;
import dev.cloudeko.kama.collection.v1.CollectionField;
import dev.cloudeko.kama.common.DatabaseOptions;
import dev.cloudeko.kama.common.ResourceUtil;
import dev.cloudeko.kama.common.exception.ResourceAlreadyExists;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.jdbcclient.JDBCConnectOptions;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.PoolOptions;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.SqlClient;
import io.vertx.sqlclient.templates.RowMapper;
import io.vertx.sqlclient.templates.SqlTemplate;
import io.vertx.sqlclient.templates.TupleMapper;

import java.util.*;
import java.util.function.Function;

public class CollectionServiceImpl implements CollectionService {

    private static final Set<String> SYSTEM_FIELDS = Set.of("id", "create_time", "update_time");

    private final Vertx vertx;
    private final SqlClient client;
    private final DatabaseOptions options;

    public CollectionServiceImpl(Vertx vertx, DatabaseOptions options) {
        this.vertx = vertx;
        this.options = options;

        JDBCConnectOptions connect = new JDBCConnectOptions().setJdbcUrl(options.getUrl()).setUser(options.getUsername()).setPassword(options.getPassword());
        PoolOptions opts = new PoolOptions().setMaxSize(5);
        this.client = JDBCPool.pool(vertx, connect, opts);
    }

    private static String safeIdent(String s) {
        // Use only letters, digits, underscore; fallback to UUID if empty
        String out = s == null ? "" : "\"" + s.replaceAll("[^A-Za-z0-9_]", "_") + "\"";
        if (out.isBlank()) {
            out = "t_" + UUID.randomUUID().toString().replace("-", "");
        }
        return out;
    }

    private static String tableNameFor(Collection c) {
        // Prefer using the UUID to guarantee uniqueness
        return "\"c_" + c.getId().replace("-", "") + "\"";
    }

    private static String sqlTypeFor(CollectionField f) {
        return switch (f.getTypeCase()) {
            case IDENTIFIER_TYPE -> "VARCHAR(36) PRIMARY KEY";
            case STRING_TYPE, REFERENCE_TYPE -> "VARCHAR(1024)";
            case INTEGER_TYPE -> "BIGINT";
            case BOOL_TYPE -> "BOOLEAN";
            case DOUBLE_TYPE -> "DOUBLE";
            case TIMESTAMP_TYPE -> "TIMESTAMP";
            case BYTES_TYPE -> "BLOB";
            case ARRAY_TYPE, MAP_TYPE, TYPE_NOT_SET -> "CLOB"; // store as JSON text initially
        };
    }

    private String buildCreateTableDdl(Collection c) {
        StringBuilder sb = new StringBuilder();
        String tbl = tableNameFor(c);
        sb.append("CREATE TABLE IF NOT EXISTS ").append(tbl).append(" (");

        boolean first = true;

        for (Map.Entry<String, CollectionField> e : c.getFieldsMap().entrySet()) {
            String col = safeIdent(e.getKey());
            String type = sqlTypeFor(e.getValue());
            boolean notNull = e.getValue().getRequired();
            if (!first) {
                sb.append(", ");
            }
            first = false;
            sb.append(col).append(" ").append(type);
            if (notNull) {
                sb.append(" NOT NULL");
            }
        }

        sb.append(")");
        return sb.toString();
    }

    @Override
    public Future<JsonObject> createCollection(JsonObject collection) {
        Collection incoming = ResourceUtil.decodeCollection(collection);
        if (incoming == null) {
            return Future.failedFuture("Invalid collection");
        }

        UUID id = UUID.randomUUID();
        // Server-populated fields: id, name
        Collection.Builder toStore = Collection.newBuilder(incoming)
                .setId(id.toString())
                .setName("collections/" + id);

        // Add columns per field
        Map<String, CollectionField> fieldsMap = new LinkedHashMap<>(); // Use LinkedHashMap to maintain insertion order

        // Add id first
        fieldsMap.put("id", CollectionField.newBuilder().setIdentifierType("UUID").setRequired(true).setSystem(true).build());

        // Add all non-system fields from original map
        toStore.getFieldsMap().forEach((key, value) -> {
            if (!value.getSystem() && !SYSTEM_FIELDS.contains(key)) {
                fieldsMap.put(key, value);
            }
        });

        // Add timestamp fields last
        fieldsMap.put("create_time", CollectionField.newBuilder().setTimestampType(Timestamp.newBuilder()).setSystem(true).build());
        fieldsMap.put("update_time", CollectionField.newBuilder().setTimestampType(Timestamp.newBuilder()).setSystem(true).build());

        toStore.clearFields().putAllFields(fieldsMap);

        JsonObject doc = ResourceUtil.encodeCollection(toStore.build());

        // 1) Insert into metadata
        String sql = "INSERT INTO \"collections_meta\" (\"id\", \"name\", \"display_name\", \"schema_json\") VALUES (#{id}, #{name}, #{display_name}, #{schema})";
        Map<String, Object> params = new HashMap<>();
        params.put("id", toStore.getId());
        params.put("name", toStore.getName());
        params.put("display_name", toStore.getDisplayName());
        params.put("schema", doc.encode());

        return SqlTemplate.forUpdate(client, sql)
                .execute(params)
                .recover(err -> {
                    String message = String.valueOf(err.getMessage());
                    if (message != null && message.toLowerCase(Locale.ROOT).contains("unique")) {
                        return Future.failedFuture(new ResourceAlreadyExists("Collection already exists"));
                    }
                    return Future.failedFuture(err);
                })
                .compose(v -> {
                    // 2) Create physical table for the collection
                    String ddl = buildCreateTableDdl(toStore.build());
                    return client.query(ddl).execute().map(doc);
                });
    }

    @Override
    public Future<JsonObject> updateCollection(JsonObject collection) {
        Collection incoming = ResourceUtil.decodeCollection(collection);
        if (incoming == null || incoming.getName().isBlank()) {
            return Future.failedFuture("Invalid collection");
        }
        // Get current to preserve id and name
        return getCollection(incoming.getName()).compose(existingJson -> {
            Collection existing = ResourceUtil.decodeCollection(existingJson);
            Collection.Builder toStore = Collection.newBuilder(incoming)
                    .setId(existing.getId())
                    .setName(existing.getName());

            // Add columns per field
            Map<String, CollectionField> fieldsMap = new LinkedHashMap<>(); // Use LinkedHashMap to maintain insertion order

            // Add id first
            fieldsMap.put("id", CollectionField.newBuilder().setIdentifierType("UUID").setRequired(true).setSystem(true).build());

            // Add all non-system fields from original map
            toStore.getFieldsMap().forEach((key, value) -> {
                if (!value.getSystem() && !SYSTEM_FIELDS.contains(key)) {
                    fieldsMap.put(key, value);
                }
            });

            // Add timestamp fields last
            fieldsMap.put("create_time", CollectionField.newBuilder().setTimestampType(Timestamp.newBuilder()).setSystem(true).build());
            fieldsMap.put("update_time", CollectionField.newBuilder().setTimestampType(Timestamp.newBuilder()).setSystem(true).build());

            toStore.clearFields().putAllFields(fieldsMap);

            JsonObject doc = ResourceUtil.encodeCollection(toStore.build());

            String sql = "UPDATE \"collections_meta\" SET \"display_name\" = #{display_name}, \"schema_json\" = #{schema}, \"update_time\" = CURRENT_TIMESTAMP WHERE \"name\" = #{name}";
            Map<String, Object> params = Map.of(
                    "display_name", toStore.getDisplayName(),
                    "schema", doc.encode(),
                    "name", toStore.getName()
            );

            return SqlTemplate.forUpdate(client, sql)
                    .execute(params)
                    .compose(r -> r.rowCount() == 0 ? Future.failedFuture("Not found") : Future.succeededFuture(doc));
        });
    }

    @Override
    public Future<Void> deleteCollection(String name) {
        if (name == null || name.isBlank()) {
            return Future.failedFuture("Invalid name");
        }
        return getCollection(name)
                .compose(json -> {
                    Collection c = ResourceUtil.decodeCollection(json);
                    String drop = "DROP TABLE IF EXISTS " + tableNameFor(c);
                    return client.query(drop).execute().mapEmpty().recover(err -> Future.succeededFuture()); // ignore drop issues
                })
                .compose(v -> SqlTemplate.forUpdate(client, "DELETE FROM \"collections_meta\" WHERE \"name\" = #{name}").execute(Map.of("name", name)))
                .compose(r -> r.rowCount() == 0 ? Future.failedFuture("Not found") : Future.succeededFuture());
    }

    @Override
    public Future<JsonObject> getCollection(String name) {
        if (name == null || name.isBlank()) {
            return Future.failedFuture("Invalid name");
        }
        String sql = "SELECT \"schema_json\" FROM \"collections_meta\" WHERE \"name\" = #{name}";
        return SqlTemplate.forQuery(client, sql).execute(Map.of("name", name))
                .compose(rs -> {
                    Iterator<Row> it = rs.iterator();
                    if (!it.hasNext()) {
                        return Future.failedFuture("Not found");
                    }
                    Row row = it.next();
                    return Future.succeededFuture(new JsonObject(row.getString("schema_json")));
                });
    }

    @Override
    public Future<List<JsonObject>> listCollections() {
        String sql = "SELECT \"schema_json\" FROM \"collections_meta\" ORDER BY \"create_time\"";
        return SqlTemplate.forQuery(client, sql).execute(Collections.emptyMap())
                .map(rowSet -> {
                    List<JsonObject> list = new ArrayList<>();
                    for (Row row : rowSet) {
                        list.add(new JsonObject(row.getString("schema_json")));
                    }
                    return list;
                });
    }

    // TupleMapper for completeness (not strictly needed since we use Map params). RowMapper for proto if needed elsewhere.
    private static final class CollectionMapper implements RowMapper<Collection>, TupleMapper<Collection> {
        @Override
        public Collection map(Row row) {
            String doc = row.getString(row.getColumnIndex("document"));
            return ResourceUtil.decodeCollection(new JsonObject(doc));
        }

        @Override
        public io.vertx.sqlclient.Tuple map(Function<Integer, String> function, int size, Collection collection) {
            JsonObject json = ResourceUtil.encodeCollection(collection);
            return io.vertx.sqlclient.Tuple.of(collection.getId(), collection.getName(), json.encode());
        }
    }
}
