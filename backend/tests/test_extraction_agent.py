"""
Unit tests for extraction_agent utilities (no LLM calls needed).
Run: pytest tests/ -v
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from agents.extraction_agent import determine_step, extract_data_block

SAMPLE_VALID_JSON = """{
  "transport_km_per_day": 15.0,
  "transport_mode": "petrol_car",
  "flights_per_year": 2,
  "flight_avg_distance_km": 1400.0,
  "diet_type": "veg",
  "ac_hours_per_day": 4.0,
  "other_appliances_kwh": 5.0,
  "shopping_frequency": "medium"
}"""


class TestDetermineStep:
    def test_no_messages_returns_step_1(self):
        assert determine_step([]) == 1

    def test_only_user_messages_returns_step_1(self):
        msgs = [{"role": "user", "content": "hello"}]
        assert determine_step(msgs) == 1

    def test_flight_keyword_returns_step_2(self):
        msgs = [
            {"role": "user", "content": "I drive 10km daily"},
            {"role": "assistant", "content": "How often do you fly or take flights in the last 12 months?"},
        ]
        assert determine_step(msgs) == 2

    def test_diet_keyword_returns_step_3(self):
        msgs = [{"role": "assistant", "content": "What does your diet look like — mostly veg, non-veg, or mixed?"}]
        assert determine_step(msgs) == 3

    def test_ac_keyword_returns_step_4(self):
        msgs = [{"role": "assistant", "content": "Tell me about your home energy — AC, geysers, appliances."}]
        assert determine_step(msgs) == 4

    def test_shopping_keyword_returns_step_5(self):
        msgs = [{"role": "assistant", "content": "How often do you shop for new clothes or electronics?"}]
        assert determine_step(msgs) == 5

    def test_higher_step_wins_when_multiple_present(self):
        msgs = [
            {"role": "assistant", "content": "How often do you fly?"},
            {"role": "assistant", "content": "How often do you shop for clothes or electronics?"},
        ]
        assert determine_step(msgs) == 5

    def test_ac_word_boundary_does_not_match_place(self):
        msgs = [{"role": "assistant", "content": "What's your favorite place to visit?"}]
        assert determine_step(msgs) == 1

    def test_ac_word_boundary_does_not_match_factory(self):
        msgs = [{"role": "assistant", "content": "Tell me about the factory near your home."}]
        assert determine_step(msgs) == 1

    def test_ac_word_boundary_does_not_match_space(self):
        msgs = [{"role": "assistant", "content": "How much space do you have at home?"}]
        assert determine_step(msgs) == 1

    def test_ac_word_boundary_matches_standalone_ac(self):
        msgs = [{"role": "assistant", "content": "Tell me about your AC usage at home."}]
        assert determine_step(msgs) == 4


class TestExtractDataBlock:
    def test_valid_data_block_extracted(self):
        text = f"Thank you!\n<data>\n{SAMPLE_VALID_JSON}\n</data>"
        clean, data = extract_data_block(text)
        assert data is not None
        assert data["transport_km_per_day"] == 15.0
        assert data["transport_mode"] == "petrol_car"
        assert data["flights_per_year"] == 2
        assert data["diet_type"] == "veg"
        assert data["shopping_frequency"] == "medium"

    def test_clean_text_has_no_data_tags(self):
        text = f"Thanks!\n<data>\n{SAMPLE_VALID_JSON}\n</data>"
        clean, _ = extract_data_block(text)
        assert "<data>" not in clean
        assert "</data>" not in clean

    def test_no_data_block_returns_none(self):
        clean, data = extract_data_block("Just a normal chat message.")
        assert data is None
        assert clean == "Just a normal chat message."

    def test_malformed_json_returns_none(self):
        text = "<data>{ this is not json }</data>"
        _, data = extract_data_block(text)
        assert data is None

    def test_all_required_keys_present(self):
        text = f"<data>{SAMPLE_VALID_JSON}</data>"
        _, data = extract_data_block(text)
        required = [
            "transport_km_per_day", "transport_mode", "flights_per_year",
            "flight_avg_distance_km", "diet_type", "ac_hours_per_day",
            "other_appliances_kwh", "shopping_frequency"
        ]
        for key in required:
            assert key in data
