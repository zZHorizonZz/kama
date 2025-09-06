package dev.cloudeko.kama.server.handler;

import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.identity.v1.ListUsersRequest;
import dev.cloudeko.kama.identity.v1.ListUsersResponse;
import dev.cloudeko.kama.identity.v1.User;
import dev.cloudeko.kama.server.exception.GrpcException;
import dev.cloudeko.kama.common.ResourceUtil;
import io.vertx.core.json.JsonObject;
import io.vertx.grpc.common.*;
import io.vertx.grpc.server.GrpcServerRequest;

public class ListUsersV1Handler extends BaseIdentityHandler<ListUsersRequest, ListUsersResponse> {

    public static final ServiceMethod<ListUsersRequest, ListUsersResponse> SERVICE_METHOD = ServiceMethod.server(
            ServiceName.create("cloudeko.kama.identity.v1.IdentityServer"),
            "ListUsers",
            GrpcMessageEncoder.encoder(),
            GrpcMessageDecoder.decoder(ListUsersRequest.newBuilder()));

    public ListUsersV1Handler(UserService userService) {
        super(userService);
    }

    @Override
    public void handle(GrpcServerRequest<ListUsersRequest, ListUsersResponse> request) {
        request.handler(req -> {
            int pageSize = req.getPageSize() > 0 ? req.getPageSize() : 50; // Default page size
            int offset = 0;
            
            // Simple pagination - in a real implementation, you'd parse the page token
            if (!req.getPageToken().isEmpty()) {
                try {
                    offset = Integer.parseInt(req.getPageToken());
                } catch (NumberFormatException e) {
                    request.response().status(GrpcStatus.INVALID_ARGUMENT).statusMessage("Invalid page token").end();
                    return;
                }
            }

            int finalOffset = offset;
            userService.listUsers(pageSize + 1, offset) // Get one extra to determine if there are more pages
                .onSuccess(userJsonList -> {
                    if (userJsonList == null) {
                        request.response().status(GrpcStatus.INTERNAL).end();
                        return;
                    }
                    
                    ListUsersResponse.Builder responseBuilder = ListUsersResponse.newBuilder();
                    
                    // Add users (up to pageSize)
                    int usersToReturn = Math.min(pageSize, userJsonList.size());
                    for (int i = 0; i < usersToReturn; i++) {
                        JsonObject userJson = userJsonList.get(i);
                        User user = ResourceUtil.decodeUser(userJson);
                        responseBuilder.addUsers(user);
                    }
                    
                    // Set next page token if there are more results
                    if (userJsonList.size() > pageSize) {
                        responseBuilder.setNextPageToken(String.valueOf(finalOffset + pageSize));
                    }
                    
                    request.response().end(responseBuilder.build());
                })
                .onFailure(err -> {
                    logger.error("Failed to list users", err);
                    if (err instanceof GrpcException) {
                        request.response().status(((GrpcException) err).getStatus()).statusMessage(err.getMessage()).end();
                        return;
                    }
                    request.response().status(GrpcStatus.INTERNAL).end();
                });
        });
    }
}