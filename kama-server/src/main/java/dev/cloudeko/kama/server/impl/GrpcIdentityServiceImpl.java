package dev.cloudeko.kama.server.impl;

import com.google.protobuf.Descriptors;
import dev.cloudeko.kama.identity.v1.IdentityServerProto;
import dev.cloudeko.kama.identity.UserService;
import dev.cloudeko.kama.server.handler.*;
import io.vertx.grpc.common.ServiceName;
import io.vertx.grpc.server.GrpcServer;
import io.vertx.grpc.server.Service;

public record GrpcIdentityServiceImpl(UserService service) implements Service {

    private static final ServiceName V1_SERVICE_NAME = ServiceName.create("cloudeko.kama.identity.v1.IdentityServer");
    private static final Descriptors.ServiceDescriptor V1_SERVICE_DESCRIPTOR = IdentityServerProto.getDescriptor().findServiceByName("IdentityServer");

    @Override
    public ServiceName name() {
        return V1_SERVICE_NAME;
    }

    @Override
    public Descriptors.ServiceDescriptor descriptor() {
        return V1_SERVICE_DESCRIPTOR;
    }

    @Override
    public void bind(GrpcServer server) {
        server.callHandler(CreateUserV1Handler.SERVICE_METHOD, new CreateUserV1Handler(service));
        server.callHandler(AuthenticateUserV1Handler.SERVICE_METHOD, new AuthenticateUserV1Handler(service));
        server.callHandler(GetUserV1Handler.SERVICE_METHOD, new GetUserV1Handler(service));
        server.callHandler(UpdateUserV1Handler.SERVICE_METHOD, new UpdateUserV1Handler(service));
        server.callHandler(DeleteUserV1Handler.SERVICE_METHOD, new DeleteUserV1Handler(service));
        server.callHandler(ListUsersV1Handler.SERVICE_METHOD, new ListUsersV1Handler(service));
        server.callHandler(ChangePasswordV1Handler.SERVICE_METHOD, new ChangePasswordV1Handler(service));
        server.callHandler(ResetPasswordV1Handler.SERVICE_METHOD, new ResetPasswordV1Handler(service));
        server.callHandler(GenerateTokenV1Handler.SERVICE_METHOD, new GenerateTokenV1Handler(service));
        server.callHandler(ValidateTokenV1Handler.SERVICE_METHOD, new ValidateTokenV1Handler(service));
    }
}