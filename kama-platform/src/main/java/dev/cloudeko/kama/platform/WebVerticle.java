package dev.cloudeko.kama.platform;

import io.netty.util.AsciiString;
import io.vertx.core.Future;
import io.vertx.core.VerticleBase;
import io.vertx.core.http.HttpHeaders;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServerOptions;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.AllowForwardHeaders;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import io.vertx.ext.web.common.WebEnvironment;
import io.vertx.ext.web.handler.*;
import org.jboss.logging.Logger;

import java.util.Set;

import static dev.cloudeko.kama.platform.MainVerticle.HTTP_PORT;
import static io.vertx.core.http.HttpHeaders.CACHE_CONTROL;

/**
 * @author Daniel Petisme
 * @author Thomas Segismont
 */
public class WebVerticle extends VerticleBase {

    private static final Logger log = Logger.getLogger(WebVerticle.class);

    private static final AsciiString X_CONTENT_TYPE_OPTIONS_HEADER = AsciiString.cached("x-content-type-options");
    private static final AsciiString NOSNIFF = AsciiString.cached("nosniff");
    private static final AsciiString ONE_YEAR_CACHE = AsciiString.cached("cache-control=public, immutable, max-age=31536000");

    private static final Set<String> SKIP_COMPRESSION_FILE_SUFFIXES = Set.of("png", "woff2");
    private static final Set<String> SKIP_COMPRESSION_MEDIA_TYPES = Set.of("image/png", "font/woff2");

    public static final String VERTX_PROJECT_KEY = "vertxProject";

    @Override
    public Future<?> start() throws Exception {
        Router router = Router.router(vertx).allowForward(AllowForwardHeaders.X_FORWARD);

        router.route()
                .handler(HSTSHandler.create())
                .handler(XFrameHandler.create(XFrameHandler.DENY))
                .handler(CSPHandler.create()
                        .addDirective("style-src", "self")
                        .addDirective("style-src", "unsafe-inline")
                        .addDirective("font-src", "self")
                        .addDirective("script-src", "self"))
                .handler(rc -> {
                    rc.response().putHeader(X_CONTENT_TYPE_OPTIONS_HEADER, NOSNIFF);
                    rc.next();
                });

        CorsHandler corsHandler = CorsHandler.create()
                .addOriginWithRegex(".*")
                .allowedMethod(HttpMethod.GET)
                .allowedMethod(HttpMethod.POST)
                .allowedHeader("Content-Type")
                .allowedHeader("Accept");
        router.route().handler(corsHandler);

        StaticHandler staticHandler = StaticHandler.create()
                .skipCompressionForSuffixes(SKIP_COMPRESSION_FILE_SUFFIXES)
                .skipCompressionForMediaTypes(SKIP_COMPRESSION_MEDIA_TYPES);
        router.route().handler(rc -> {
            rc.addHeadersEndHandler(v -> {
                String normalizedPath = rc.normalizedPath();
                if (!(WebEnvironment.development() || "/".equals(normalizedPath) || "/index.html".equals(normalizedPath))) {
                    rc.response().putHeader(CACHE_CONTROL, ONE_YEAR_CACHE);
                }
            });
            rc.next();
        }).handler(staticHandler);

        int port = config().getInteger(HTTP_PORT, 8080);

        return vertx.createHttpServer(new HttpServerOptions().setCompressionSupported(true))
                .requestHandler(router)
                .listen(port)
                .onFailure(t -> log.errorv("Fail to start {}", WebVerticle.class.getSimpleName()))
                .onSuccess(v -> log.infov("""
                        ----------------------------------------------------------
                        {} is running! Access URLs:
                        Local: http://localhost:{}
                        ----------------------------------------------------------
                        """, WebVerticle.class.getSimpleName(), port)
                );
    }

    static void fail(RoutingContext rc, int status, String message) {
        JsonObject error = new JsonObject()
                .put("status", status)
                .put("message", message);
        rc.response().setStatusCode(status).putHeader(HttpHeaders.CONTENT_TYPE, "application/json").end(error.toBuffer());
    }
}
