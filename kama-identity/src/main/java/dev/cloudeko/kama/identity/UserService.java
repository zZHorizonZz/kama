package dev.cloudeko.kama.identity;

import io.vertx.codegen.annotations.ProxyGen;
import io.vertx.codegen.annotations.VertxGen;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import dev.cloudeko.kama.common.DatabaseOptions;
import dev.cloudeko.kama.identity.impl.UserServiceImpl;

import java.util.List;

@ProxyGen
@VertxGen
public interface UserService {

    static UserService create(Vertx vertx, DatabaseOptions databaseOptions) {
        return new UserServiceImpl(vertx, databaseOptions);
    }

    static UserService createProxy(Vertx vertx, String address) {
        return new UserServiceVertxEBProxy(vertx, address);
    }

    Future<JsonObject> createUser(String email, String password, String displayName);

    Future<JsonObject> authenticateUser(String email, String password);

    Future<JsonObject> getUserById(String userId);

    Future<JsonObject> getUserByEmail(String email);

    Future<JsonObject> updateUser(String userId, JsonObject updates);

    Future<Void> deleteUser(String userId);

    Future<List<JsonObject>> listUsers(int limit, int offset);

    Future<JsonObject> resetPassword(String email);

    Future<JsonObject> changePassword(String userId, String oldPassword, String newPassword);

    Future<JsonObject> generateJwtToken(String userId);

    Future<JsonObject> validateJwtToken(String token);
}