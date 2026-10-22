from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import Task


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username")
        read_only_fields = ("id",)


class AuthResponseSerializer(serializers.Serializer):
    """登录/注册成功后的统一返回格式"""

    token = serializers.CharField()
    user = UserSerializer()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=3)

    class Meta:
        model = User
        fields = ("username", "password")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
        )
        Token.objects.get_or_create(user=user)
        return user


class TaskSerializer(serializers.ModelSerializer):
    """
    Task 序列化器。

    输出字段用前端一致的命名风格：
    - Django 内部 due_date 驼峰化为 dueDate
    - 前端不需要 created_at / updated_at 但保留在数据里以备扩展
    """

    # 把 Django 蛇形 due_date 映射成前端驼峰 dueDate
    dueDate = serializers.DateField(source="due_date", required=False, allow_null=True)
    owner = UserSerializer(read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "owner",
            "title",
            "category",
            "dueDate",
            "completed",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")

    def create(self, validated_data):
        # view 层会先把 request.user 注入到 context，
        # 这里从 context 取 owner，避免前端伪造。
        user = self.context["request"].user
        return Task.objects.create(owner=user, **validated_data)


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    """
    用于创建/更新时的简化序列化器，只接受业务字段。
    owner 由 view 自动注入，不由前端传入。
    """

    dueDate = serializers.DateField(source="due_date", required=False, allow_null=True)

    class Meta:
        model = Task
        fields = ("title", "category", "dueDate", "completed")

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("标题不能为空")
        return value.strip()
