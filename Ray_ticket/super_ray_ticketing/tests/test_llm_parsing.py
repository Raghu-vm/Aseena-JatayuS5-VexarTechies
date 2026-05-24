"""Unit tests for LLM JSON post-processing."""
from app.services.llm import _strip_json


def test_strip_json_plain():
    assert _strip_json('{"a": 1}') == '{"a": 1}'


def test_strip_json_fenced():
    text = '```json\n{"title": "x", "priority": "high"}\n```'
    assert _strip_json(text) == '{"title": "x", "priority": "high"}'


def test_strip_json_bare_fence():
    text = '```\n{"a": 1}\n```'
    assert _strip_json(text) == '{"a": 1}'


def test_strip_json_embedded_in_prose():
    text = 'Sure! Here is the JSON:\n{"a": 1, "b": [1,2]}\nLet me know if you need more.'
    assert _strip_json(text) == '{"a": 1, "b": [1,2]}'
