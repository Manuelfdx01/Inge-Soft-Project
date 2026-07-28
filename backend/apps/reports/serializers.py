from rest_framework import serializers
from .models import Review, Proposal, Report, CommunityPost, PostComment


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'username', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'username', 'created_at']


class ProposalSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id', 'username', 'title', 'description',
            'status', 'admin_response', 'votes', 'created_at',
        ]
        read_only_fields = ['id', 'username', 'status', 'admin_response', 'votes', 'created_at']


class ProposalStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ['status', 'admin_response']


class ReportSerializer(serializers.ModelSerializer):
    username   = serializers.CharField(source='user.username', read_only=True)
    point_name = serializers.CharField(source='point.name', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'username', 'point', 'point_name',
            'type', 'description', 'photo', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'username', 'point_name', 'status', 'created_at']


class PostCommentSerializer(serializers.ModelSerializer):
    username   = serializers.CharField(source='author.username', read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = PostComment
        fields = ['id', 'username', 'avatar_url', 'content', 'created_at']
        read_only_fields = ['id', 'username', 'avatar_url', 'created_at']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.author.avatar and request:
            return request.build_absolute_uri(obj.author.avatar.url)
        return None


class CommunityPostSerializer(serializers.ModelSerializer):
    username   = serializers.CharField(source='author.username', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    xp         = serializers.IntegerField(source='author.xp', read_only=True)
    level      = serializers.SerializerMethodField()
    comments   = PostCommentSerializer(many=True, read_only=True)
    comment_count = serializers.IntegerField(source='comments.count', read_only=True)

    class Meta:
        model = CommunityPost
        fields = [
            'id', 'username', 'avatar_url', 'xp', 'level',
            'content', 'tags', 'created_at',
            'comments', 'comment_count',
        ]
        read_only_fields = [
            'id', 'username', 'avatar_url', 'xp', 'level', 'created_at',
            'comments', 'comment_count',
        ]

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.author.avatar and request:
            return request.build_absolute_uri(obj.author.avatar.url)
        return None

    def get_level(self, obj):
        return obj.author.level_info.get('level', 1)