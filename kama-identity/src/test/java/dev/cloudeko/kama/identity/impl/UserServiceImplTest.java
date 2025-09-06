package dev.cloudeko.kama.identity.impl;

import dev.cloudeko.kama.common.DatabaseOptions;
import dev.cloudeko.kama.common.MigrationVerticle;
import dev.cloudeko.kama.identity.UserService;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.junit5.VertxExtension;
import io.vertx.junit5.VertxTestContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(VertxExtension.class)
class UserServiceImplTest {

    private UserService userService;

    @BeforeEach
    void setUp(Vertx vertx) throws TimeoutException {
        vertx = Vertx.vertx();

        DatabaseOptions options = new DatabaseOptions();
        options.setUrl("jdbc:h2:mem:DB;DB_CLOSE_DELAY=-1;");

        JsonObject database = new JsonObject().put("database", options.toJson());
        MigrationVerticle migrationVerticle = new MigrationVerticle();

        vertx.deployVerticle(migrationVerticle, new DeploymentOptions().setConfig(database)).await(5, TimeUnit.SECONDS);

        userService = UserService.create(vertx, options);
    }

    @Test
    void testCreateUser(VertxTestContext testContext) {
        userService.createUser("test@example.com", "password123", "Test User")
            .onComplete(testContext.succeeding(user -> testContext.verify(() -> {
                assertNotNull(user);
                assertEquals("test@example.com", user.getString("email"));
                assertEquals("Test User", user.getString("display_name"));
                assertNotNull(user.getString("id"));
                testContext.completeNow();
            })));
    }

    @Test
    void testAuthenticateUser(VertxTestContext testContext) {
        userService.createUser("auth@example.com", "password123", "Auth User")
            .compose(user -> userService.authenticateUser("auth@example.com", "password123"))
            .onComplete(testContext.succeeding(user -> testContext.verify(() -> {
                assertNotNull(user);
                assertEquals("auth@example.com", user.getString("email"));
                assertEquals("Auth User", user.getString("display_name"));
                assertFalse(user.containsKey("passwordHash"));
                testContext.completeNow();
            })));
    }

    @Test
    void testGenerateJwtToken(VertxTestContext testContext) {
        String userId = "test-user-id";
        
        userService.generateJwtToken(userId)
            .onComplete(testContext.succeeding(result -> testContext.verify(() -> {
                assertNotNull(result);
                assertTrue(result.containsKey("token"));
                assertTrue(result.containsKey("expires_in"));
                assertEquals(3600, result.getInteger("expires_in"));
                testContext.completeNow();
            })));
    }

    @Test
    void testValidateJwtToken(VertxTestContext testContext) {
        String userId = "test-user-id";
        
        userService.generateJwtToken(userId)
            .compose(tokenResult -> userService.validateJwtToken(tokenResult.getString("token")))
            .onComplete(testContext.succeeding(validation -> testContext.verify(() -> {
                assertNotNull(validation);
                assertTrue(validation.getBoolean("valid"));
                assertEquals(userId, validation.getString("user_id"));
                testContext.completeNow();
            })));
    }
}