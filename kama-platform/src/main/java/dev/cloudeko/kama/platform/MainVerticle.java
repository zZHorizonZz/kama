package dev.cloudeko.kama.platform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import dev.cloudeko.kama.common.DatabaseOptions;
import dev.cloudeko.kama.server.ServerVerticle;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Future;
import io.vertx.core.VerticleBase;
import io.vertx.core.json.JsonObject;
import io.vertx.core.json.jackson.DatabindCodec;

public class MainVerticle extends VerticleBase {

    public static final String HTTP_PORT = "http.port";

    static {
        ObjectMapper mapper = DatabindCodec.mapper();
        mapper.registerModule(new JavaTimeModule());
    }

    @Override
    public Future<?> start() throws Exception {
        DeploymentOptions webOptions = new DeploymentOptions()
                .setConfig(new JsonObject().put(HTTP_PORT, 8080));

        DatabaseOptions options = new DatabaseOptions();
        options.setUrl("jdbc:h2:mem:DB_REC;DB_CLOSE_DELAY=-1;");

        DeploymentOptions databaseOptions = new DeploymentOptions()
                .setConfig(new JsonObject().put("database", options.toJson()));

        return vertx.deployVerticle(ServerVerticle::new, databaseOptions).compose(_ -> vertx.deployVerticle(WebVerticle::new, webOptions));
    }
}
