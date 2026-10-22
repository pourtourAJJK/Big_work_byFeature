from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Task
from .serializers import (
    AuthResponseSerializer,
    RegisterSerializer,
    TaskCreateUpdateSerializer,
    TaskSerializer,
    UserSerializer,
)


class IsOwner(permissions.BasePermission):
    """只允许任务 owner 访问；SAFE_METHODS 允许任何登录用户"""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return obj.owner_id == request.user.id


class LoginView(APIView):
    """用户名密码登录 → 返回 Token"""

    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")
        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {"detail": "用户名或密码错误"}, status=status.HTTP_401_UNAUTHORIZED
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user": UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )


class RegisterView(APIView):
    """注册新用户 → 创建 Token → 直接登录"""

    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    """登出 → 删除当前 Token"""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            request.auth.delete()
        except AttributeError:
            pass
        return Response({"detail": "已登出"}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """获取当前登录用户信息（刷新页面时确认 Token 仍有效）"""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class TaskViewSet(viewsets.ModelViewSet):
    """
    Task CRUD。

    - 登录用户才能访问
    - 只能看到和修改自己的任务
    - 列表/详情用 TaskSerializer（完整输出）
    - 创建/更新用 TaskCreateUpdateSerializer（防伪造 owner）
    """

    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return TaskCreateUpdateSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
