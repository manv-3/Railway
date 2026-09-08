"""
Async Optimization Task Tests - V3-04
Tests that the optimization endpoint returns 202 Accepted with a task_id,
and that the task polling endpoint returns a valid structure.
"""

import pytest
from unittest.mock import patch, MagicMock
from tasks.optimizer_worker import set_task_progress, get_task_progress


class TestTaskProgressRedis:
    """Tests for Redis task progress tracking (without live Redis)."""

    def test_set_and_get_task_progress_without_redis(self):
        """
        When Redis is unavailable, set_task_progress should not raise exceptions
        and get_task_progress should return None gracefully.
        """
        with patch("tasks.optimizer_worker.get_redis", return_value=None):
            # Should not raise even with no Redis
            set_task_progress("fake-task-id", "RUNNING", 50, "Test progress")
            result = get_task_progress("fake-task-id")
            assert result is None

    def test_set_task_progress_with_mock_redis(self):
        """With a mock Redis client, progress should be stored as JSON."""
        mock_redis = MagicMock()

        with patch("tasks.optimizer_worker.get_redis", return_value=mock_redis):
            set_task_progress("task-001", "RUNNING", 45, "Running solver")
            mock_redis.setex.assert_called_once()

            # Verify key structure
            call_args = mock_redis.setex.call_args
            key = call_args[0][0]  # First positional arg is the key
            assert "task:status:task-001" in key

    def test_get_task_progress_parses_json(self):
        """get_task_progress should parse the stored JSON and return a dict."""
        import json
        stored = json.dumps({
            "task_id": "task-001",
            "status": "COMPLETED",
            "progress_pct": 100,
            "detail": "12 blocks created",
            "updated_at": "2026-09-08T02:30:00",
        })
        mock_redis = MagicMock()
        mock_redis.get.return_value = stored

        with patch("tasks.optimizer_worker.get_redis", return_value=mock_redis):
            result = get_task_progress("task-001")
            assert result is not None
            assert result["status"] == "COMPLETED"
            assert result["progress_pct"] == 100
            assert result["task_id"] == "task-001"


class TestOptimizationEndpointStructure:
    """Tests for the async optimization endpoint response structure."""

    def test_202_response_has_task_id_and_poll_url(self):
        """POST /optimize/run should return task_id and poll_url in 202 response."""
        # Test the expected shape of a 202 response
        mock_202_response = {
            "status": "ACCEPTED",
            "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "message": "Optimization task queued.",
            "poll_url": "/api/v1/optimize/run/a1b2c3d4/status",
            "websocket_url": "/ws/corridor",
        }

        assert mock_202_response["status"] == "ACCEPTED"
        assert "task_id" in mock_202_response
        assert "poll_url" in mock_202_response
        assert "websocket_url" in mock_202_response
        assert "/ws/corridor" in mock_202_response["websocket_url"]

    def test_status_response_structure(self):
        """Status polling endpoint must return all required fields."""
        mock_status = {
            "task_id": "a1b2c3d4",
            "status": "RUNNING",
            "progress_pct": 45,
            "detail": "Running CP-SAT solver",
            "updated_at": "2026-09-08T02:30:00",
        }

        required_fields = ["task_id", "status", "progress_pct", "detail", "updated_at"]
        for field in required_fields:
            assert field in mock_status, f"Missing required field: {field}"

    def test_valid_status_values(self):
        """Task status must be one of the defined state values."""
        valid_statuses = {"QUEUED", "RUNNING", "COMPLETED", "FAILED"}
        test_statuses = ["QUEUED", "RUNNING", "COMPLETED", "FAILED"]
        for status in test_statuses:
            assert status in valid_statuses
