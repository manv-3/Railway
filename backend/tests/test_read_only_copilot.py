from datetime import datetime

from agents.read_only_copilot import READ_ONLY_TOOLS, ReadOnlyOperationsCopilot


def test_copilot_contract_has_no_write_tools():
    assert READ_ONLY_TOOLS
    assert all(not tool.startswith(("create", "update", "delete", "run", "issue", "sanction")) for tool in READ_ONLY_TOOLS)


def test_fallback_answer_is_explicitly_read_only():
    copilot = ReadOnlyOperationsCopilot()
    context = {
        "as_of_utc": datetime.utcnow().isoformat() + "Z",
        "blocks": [],
        "pending_requests": [{"severity": "CRITICAL"}],
        "active_trains": [],
    }
    answer = copilot._fallback_answer("What is the current status?", context)
    assert "did not change operational state" in answer


def test_action_requests_are_refused():
    copilot = ReadOnlyOperationsCopilot()
    assert copilot._is_write_intent("Please sanction block BLK-1") is True
    assert "cannot" in copilot._refusal_answer()