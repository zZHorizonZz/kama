package dev.cloudeko.kama.server.impl;

import dev.cloudeko.kama.collection.v1.Collection;
import dev.cloudeko.kama.collection.v1.CollectionField;
import dev.cloudeko.kama.record.v1.Record;
import dev.cloudeko.kama.server.CollectionService;
import dev.cloudeko.kama.server.DatabaseOptions;
import dev.cloudeko.kama.server.MigrationVerticle;
import dev.cloudeko.kama.server.RecordService;
import dev.cloudeko.kama.server.util.ResourceUtil;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

public class RecordServiceImplTest {

    private static Vertx vertx;
    private static CollectionService collectionService;
    private static RecordService recordService;
    private static String collectionName;

    @BeforeAll
    static void setup() throws Exception {
        vertx = Vertx.vertx();

        DatabaseOptions options = new DatabaseOptions();
        options.setUrl("jdbc:h2:mem:DB_REC;DB_CLOSE_DELAY=-1;");

        JsonObject database = new JsonObject().put("database", options.toJson());
        MigrationVerticle migrationVerticle = new MigrationVerticle();
        vertx.deployVerticle(migrationVerticle, new DeploymentOptions().setConfig(database)).await(5, TimeUnit.SECONDS);

        collectionService = CollectionService.create(vertx, options);
        recordService = RecordService.create(vertx, options);

        // create base collection to host records
        CollectionField field = CollectionField.newBuilder().setRequired(true).setStringType("").build();
        Collection col = Collection.newBuilder()
                .putFields("title", field)
                .setDisplayName("Rec Collection")
                .build();
        JsonObject created = collectionService.createCollection(ResourceUtil.encode(col)).await(5, TimeUnit.SECONDS);
        collectionName = ResourceUtil.decode(created).getName();
    }

    @AfterAll
    static void tearDown() throws Exception {
        if (vertx != null) {
            vertx.close().await(5, TimeUnit.SECONDS);
        }
    }

    private static JsonObject baseRecord() {
        // include required field value according to schema
        JsonObject json = ResourceUtil.encode(Record.newBuilder().setCollection(collectionName).build());
        json.put("values", new JsonObject().put("title", "Hello"));
        return json;
    }

    @Test
    void testCreateGetListUpdateDeleteRecord() throws Exception {
        // Create
        JsonObject created = recordService.createRecord(collectionName, baseRecord()).await(5, TimeUnit.SECONDS);
        assertNotNull(created);
        Record createdProto = ResourceUtil.decodeRecord(created);
        assertNotNull(createdProto.getId());
        assertFalse(createdProto.getId().isBlank());
        assertTrue(createdProto.getName().startsWith(collectionName + "/records/"));
        assertEquals(collectionName, createdProto.getCollection());

        // Get
        JsonObject fetched = recordService.getRecord(createdProto.getName()).await(5, TimeUnit.SECONDS);
        Record fetchedProto = ResourceUtil.decodeRecord(fetched);
        assertEquals(createdProto.getId(), fetchedProto.getId());
        assertEquals(createdProto.getName(), fetchedProto.getName());
        assertEquals(collectionName, fetchedProto.getCollection());

        // List
        List<JsonObject> list = recordService.listRecords(collectionName).await(5, TimeUnit.SECONDS);
        assertTrue(list.stream().map(ResourceUtil::decodeRecord).anyMatch(r -> r.getId().equals(createdProto.getId())));

        // Update (no-op currently)
        Record updatedIn = Record.newBuilder(fetchedProto).build();
        JsonObject updatedJson = recordService.updateRecord(ResourceUtil.encode(updatedIn)).await(5, TimeUnit.SECONDS);
        Record updatedProto = ResourceUtil.decodeRecord(updatedJson);
        assertEquals(createdProto.getId(), updatedProto.getId());
        assertEquals(createdProto.getName(), updatedProto.getName());

        // Delete
        recordService.deleteRecord(createdProto.getName()).await(5, TimeUnit.SECONDS);
        try {
            recordService.getRecord(createdProto.getName()).await(5, TimeUnit.SECONDS);
            fail("Expected not found after delete");
        } catch (Exception ignored) {
        }
    }
}
