package dev.cloudeko.kama.identity.impl;

import dev.cloudeko.kama.common.DatabaseOptions;
import dev.cloudeko.kama.identity.UserService;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.auth.PubSecKeyOptions;
import io.vertx.ext.auth.authentication.TokenCredentials;
import io.vertx.ext.auth.jwt.JWTAuth;
import io.vertx.ext.auth.jwt.JWTAuthOptions;
import io.vertx.jdbcclient.JDBCConnectOptions;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.PoolOptions;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.SqlClient;
import io.vertx.sqlclient.templates.SqlTemplate;
import org.jboss.logging.Logger;
import org.mindrot.jbcrypt.BCrypt;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;

public class UserServiceImpl implements UserService {

    private static final Logger LOGGER = Logger.getLogger(UserServiceImpl.class);

    private final SqlClient client;
    private final JWTAuth jwtAuth;

    public UserServiceImpl(Vertx vertx, DatabaseOptions databaseOptions) {
        JDBCConnectOptions connect = new JDBCConnectOptions()
                .setJdbcUrl(databaseOptions.getUrl())
                .setUser(databaseOptions.getUsername())
                .setPassword(databaseOptions.getPassword());
        PoolOptions opts = new PoolOptions().setMaxSize(5);
        this.client = JDBCPool.pool(vertx, connect, opts);

        // Configure JWT authentication
        this.jwtAuth = JWTAuth.create(vertx, new JWTAuthOptions()
                .addPubSecKey(new PubSecKeyOptions()
                        .setAlgorithm("HS256")
                        .setBuffer("secret-key"))); // TODO: Load from config
    }

    @Override
    public Future<JsonObject> createUser(String email, String password, String displayName) {
        String userId = UUID.randomUUID().toString();
        String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt());

        String sql = "INSERT INTO \"users\" (\"id\", \"email\", \"password_hash\", \"display_name\", \"create_time\", \"update_time\") VALUES (#{id}, #{email}, #{password_hash}, #{display_name}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
        Map<String, Object> params = Map.of(
                "id", userId,
                "email", email,
                "password_hash", hashedPassword,
                "display_name", displayName
        );

        return SqlTemplate.forUpdate(client, sql)
                .execute(params)
                .compose(result -> getUserById(userId))
                .onFailure(err -> LOGGER.error("Failed to create user", err));
    }

    @Override
    public Future<JsonObject> authenticateUser(String email, String password) {
        return getUserByEmail(email)
                .compose(user -> {
                    String storedHash = user.getString("password_hash");
                    if (BCrypt.checkpw(password, storedHash)) {
                        user.remove("password_hash");
                        return Future.succeededFuture(user);
                    } else {
                        return Future.failedFuture("Invalid credentials");
                    }
                });
    }

    @Override
    public Future<JsonObject> getUserById(String userId) {
        String sql = "SELECT \"id\", \"email\", \"display_name\", \"create_time\", \"update_time\" FROM \"users\" WHERE \"id\" = #{id}";
        return SqlTemplate.forQuery(client, sql)
                .execute(Map.of("id", userId))
                .compose(rs -> {
                    Iterator<Row> it = rs.iterator();
                    if (!it.hasNext()) {
                        return Future.failedFuture("User not found");
                    }
                    Row row = it.next();
                    JsonObject user = new JsonObject()
                            .put("id", row.getString("id"))
                            .put("email", row.getString("email"))
                            .put("display_name", row.getString("display_name"))
                            .put("create_time", row.getLocalDateTime("create_time").toInstant(ZoneOffset.UTC))
                            .put("update_time", row.getLocalDateTime("update_time").toInstant(ZoneOffset.UTC));
                    return Future.succeededFuture(user);
                })
                .onFailure(err -> LOGGER.error("Failed to query user", err));
    }

    @Override
    public Future<JsonObject> getUserByEmail(String email) {
        String sql = "SELECT \"id\", \"email\", \"password_hash\", \"display_name\", \"create_time\", \"update_time\" FROM \"users\" WHERE \"email\" = #{email}";
        return SqlTemplate.forQuery(client, sql)
                .execute(Map.of("email", email))
                .compose(rs -> {
                    Iterator<Row> it = rs.iterator();
                    if (!it.hasNext()) {
                        return Future.failedFuture("User not found");
                    }
                    Row row = it.next();
                    JsonObject user = new JsonObject()
                            .put("id", row.getString("id"))
                            .put("email", row.getString("email"))
                            .put("password_hash", row.getString("password_hash"))
                            .put("display_name", row.getString("display_name"))
                            .put("create_time", row.getLocalDateTime("create_time").toInstant(ZoneOffset.UTC))
                            .put("update_time", row.getLocalDateTime("update_time").toInstant(ZoneOffset.UTC));
                    return Future.succeededFuture(user);
                })
                .onFailure(err -> LOGGER.error("Failed to query user", err));
    }

    @Override
    public Future<JsonObject> updateUser(String userId, JsonObject updates) {
        StringBuilder sql = new StringBuilder("UPDATE \"users\" SET \"update_time\" = CURRENT_TIMESTAMP");
        Map<String, Object> params = new HashMap<>();

        if (updates.containsKey("display_name")) {
            sql.append(", \"display_name\" = #{display_name}");
            params.put("display_name", updates.getString("display_name"));
        }

        if (updates.containsKey("email")) {
            sql.append(", \"email\" = #{email}");
            params.put("email", updates.getString("email"));
        }

        sql.append(" WHERE \"id\" = #{id}");
        params.put("id", userId);

        return SqlTemplate.forUpdate(client, sql.toString())
                .execute(params)
                .compose(result -> {
                    if (result.rowCount() == 0) {
                        return Future.failedFuture("User not found");
                    }
                    return getUserById(userId);
                })
                .onFailure(err -> LOGGER.error("Failed to update user", err));
    }

    @Override
    public Future<Void> deleteUser(String userId) {
        String sql = "DELETE FROM \"users\" WHERE \"id\" = #{id}";
        return SqlTemplate.forUpdate(client, sql)
                .execute(Map.of("id", userId))
                .compose(result -> {
                    if (result.rowCount() == 0) {
                        return Future.failedFuture("User not found");
                    }
                    return Future.<Void> succeededFuture();
                })
                .onFailure(err -> LOGGER.error("Failed to delete user", err));
    }

    @Override
    public Future<List<JsonObject>> listUsers(int limit, int offset) {
        String sql = "SELECT \"id\", \"email\", \"display_name\", \"create_time\", \"update_time\" FROM \"users\" ORDER BY \"create_time\" DESC LIMIT #{limit} OFFSET #{offset}";
        return SqlTemplate.forQuery(client, sql)
                .execute(Map.of("limit", limit, "offset", offset))
                .map(rowSet -> {
                    List<JsonObject> users = new ArrayList<>();
                    for (Row row : rowSet) {
                        users.add(new JsonObject()
                                .put("id", row.getString("id"))
                                .put("email", row.getString("email"))
                                .put("display_name", row.getString("display_name"))
                                .put("create_time", row.getLocalDateTime("create_time").toInstant(ZoneOffset.UTC))
                                .put("update_time", row.getLocalDateTime("update_time").toInstant(ZoneOffset.UTC)));
                    }
                    return users;
                })
                .onFailure(err -> LOGGER.error("Failed to list users", err));
    }

    @Override
    public Future<JsonObject> resetPassword(String email) {
        String resetToken = UUID.randomUUID().toString();
        return Future.succeededFuture(new JsonObject()
                .put("reset_token", resetToken)
                .put("message", "Password reset token generated"));
    }

    @Override
    public Future<JsonObject> changePassword(String userId, String oldPassword, String newPassword) {
        return getUserById(userId)
                .compose(user -> {
                    return getUserByEmail(user.getString("email"))
                            .compose(userWithHash -> {
                                String storedHash = userWithHash.getString("password_hash");
                                if (!BCrypt.checkpw(oldPassword, storedHash)) {
                                    return Future.failedFuture("Invalid old password");
                                }

                                String newHash = BCrypt.hashpw(newPassword, BCrypt.gensalt());

                                String sql = "UPDATE \"users\" SET \"password_hash\" = #{password_hash}, \"update_time\" = CURRENT_TIMESTAMP WHERE \"id\" = #{id}";
                                Map<String, Object> params = Map.of(
                                        "password_hash", newHash,
                                        "id", userId
                                );

                                return SqlTemplate.forUpdate(client, sql)
                                        .execute(params)
                                        .map(result -> new JsonObject().put("message", "Password changed successfully"))
                                        .onFailure(err -> LOGGER.error("Failed to change password", err));
                            });
                });
    }

    @Override
    public Future<JsonObject> generateJwtToken(String userId) {
        JsonObject claims = new JsonObject()
                .put("sub", userId)
                .put("iat", System.currentTimeMillis() / 1000)
                .put("exp", (System.currentTimeMillis() / 1000) + 3600); // 1 hour expiry

        String token = jwtAuth.generateToken(claims);

        return Future.succeededFuture(new JsonObject()
                .put("token", token)
                .put("expires_in", 3600));
    }

    @Override
    public Future<JsonObject> validateJwtToken(String token) {
        return Future.future(promise -> {
            jwtAuth.authenticate(new TokenCredentials(token))
                    .onSuccess(user -> {
                        JsonObject userInfo = user.principal();
                        promise.complete(new JsonObject()
                                .put("valid", true)
                                .put("user_id", userInfo.getString("sub")));
                    })
                    .onFailure(err -> {
                        promise.complete(new JsonObject()
                                .put("valid", false)
                                .put("error", err.getMessage()));
                    });
        });
    }
}