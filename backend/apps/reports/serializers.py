from rest_framework import serializers
from .models import Review, Proposal, Report


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