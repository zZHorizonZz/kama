package dev.cloudeko.kama.common;

import io.vertx.codegen.annotations.DataObject;
import io.vertx.codegen.json.annotations.JsonGen;
import io.vertx.core.json.JsonObject;

@DataObject
@JsonGen(publicConverter = false)
public class DatabaseOptions {

    private static final String DEFAULT_URL = "jdbc:h2:mem:kama;DB_CLOSE_DELAY=-1";
    private static final String DEFAULT_SCHEMA = "PUBLIC";
    private static final String DEFAULT_USERNAME = "sa";
    private static final String DEFAULT_PASSWORD = "";

    private String url;
    private String schema;
    private String username;
    private String password;

    public DatabaseOptions() {
        this.url = DEFAULT_URL;
        this.schema = DEFAULT_SCHEMA;
        this.username = DEFAULT_USERNAME;
        this.password = DEFAULT_PASSWORD;
    }

    public DatabaseOptions(DatabaseOptions other) {
        this.url = other.url;
        this.schema = other.schema;
        this.username = other.username;
        this.password = other.password;
    }

    public DatabaseOptions(JsonObject json) {
        this();
        DatabaseOptionsConverter.fromJson(json, this);
    }

    public String getUrl() {
        return url;
    }

    public DatabaseOptions setUrl(String url) {
        this.url = url;
        return this;
    }

    public String getSchema() {
        return schema;
    }

    public DatabaseOptions setSchema(String schema) {
        this.schema = schema;
        return this;
    }

    public String getUsername() {
        return username;
    }

    public DatabaseOptions setUsername(String username) {
        this.username = username;
        return this;
    }

    public String getPassword() {
        return password;
    }

    public DatabaseOptions setPassword(String password) {
        this.password = password;
        return this;
    }

    public JsonObject toJson() {
        JsonObject json = new JsonObject();
        DatabaseOptionsConverter.toJson(this, json);
        return json;
    }

    @Override
    public String toString() {
        return toJson().encodePrettily();
    }
}
