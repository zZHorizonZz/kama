package dev.cloudeko.kama.server.impl;

import dev.cloudeko.kama.collection.v1.Collection;
import dev.cloudeko.kama.collection.v1.CollectionField;
import dev.cloudeko.kama.server.CollectionService;
import dev.cloudeko.kama.server.DatabaseOptions;
import dev.cloudeko.kama.server.MigrationVerticle;
import dev.cloudeko.kama.server.util.ResourceUtil;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.jdbcclient.JDBCConnectOptions;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.PoolOptions;
import io.vertx.sqlclient.SqlClient;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;

public class CollectionServiceImplTest {

    private static Vertx vertx;
    private static CollectionService service;

    @BeforeAll
    static void setup() throws TimeoutException {
        vertx = Vertx.vertx();

        DatabaseOptions options = new DatabaseOptions();
        options.setUrl("jdbc:h2:mem:DB;DB_CLOSE_DELAY=-1;");

        JsonObject database = new JsonObject().put("database", options.toJson());
        MigrationVerticle migrationVerticle = new MigrationVerticle();

        vertx.deployVerticle(migrationVerticle, new DeploymentOptions().setConfig(database)).await(5, TimeUnit.SECONDS);

        service = CollectionService.create(vertx, options);
    }

    @AfterAll
    static void tearDown() throws Exception {
        if (vertx != null) {
            vertx.close().await(5, TimeUnit.SECONDS);
        }
    }

    private static JsonObject baseCollection() {
        // Build a minimal collection with one field
        CollectionField field = CollectionField.newBuilder().setRequired(true).setStringType("").build();
        Collection col = Collection.newBuilder()
                .putFields("title", field)
                .setDisplayName("My Collection")
                .build();
        return ResourceUtil.encode(col);
    }

    @Test
    void testCreateAndGet() throws Exception {
        JsonObject created = service.createCollection(baseCollection()).await(5, TimeUnit.SECONDS);
        assertNotNull(created);
        Collection createdProto = ResourceUtil.decode(created);
        assertNotNull(createdProto.getId());
        assertFalse(createdProto.getId().isBlank());
        assertTrue(createdProto.getName().startsWith("collections/"));
        assertEquals("My Collection", createdProto.getDisplayName());
        assertTrue(createdProto.getFieldsMap().containsKey("title"));

        JsonObject fetched = service.getCollection(createdProto.getName()).await(5, TimeUnit.SECONDS);
        Collection fetchedProto = ResourceUtil.decode(fetched);
        assertEquals(createdProto.getId(), fetchedProto.getId());
        assertEquals(createdProto.getName(), fetchedProto.getName());
    }

    @Test
    void testListAndUpdateAndDelete() throws Exception {
        // Create two collections
        JsonObject c1 = service.createCollection(baseCollection()).await(5, TimeUnit.SECONDS);
        JsonObject c2 = service.createCollection(baseCollection()).await(5, TimeUnit.SECONDS);
        Collection p1 = ResourceUtil.decode(c1);
        Collection p2 = ResourceUtil.decode(c2);

        List<JsonObject> list = service.listCollections().await(5, TimeUnit.SECONDS);
        assertTrue(list.size() >= 2);

        // Update display name of first
        Collection updated = Collection.newBuilder(ResourceUtil.decode(c1))
                .setDisplayName("Updated Name")
                .build();
        JsonObject updatedJson = service.updateCollection(ResourceUtil.encode(updated)).await(5, TimeUnit.SECONDS);
        Collection updatedProto = ResourceUtil.decode(updatedJson);
        assertEquals("Updated Name", updatedProto.getDisplayName());
        assertEquals(p1.getId(), updatedProto.getId());
        assertEquals(p1.getName(), updatedProto.getName());

        // Delete second
        service.deleteCollection(p2.getName()).await(5, TimeUnit.SECONDS);

        try {
            service.getCollection(p2.getName()).await(5, TimeUnit.SECONDS);
            fail("Expected not found after delete");
        } catch (Exception ignored) {
        }
    }
}
