import copy
import unittest

from scripts.validate_restaurant_feed import validate


class RestaurantFeedTests(unittest.TestCase):
    def setUp(self):
        self.empty = {"schema_version": "1.0", "generated_at": None, "restaurants": []}
        self.item = {
            "restaurant_id": "rst_demo1234",
            "name": "검증 전용 예시 음식점",
            "area": {"sido": "서울특별시", "sigungu": "종로구"},
            "destination_ids": ["dst_seoul_jongno"],
            "cuisine_tags": ["한식"],
            "business_status": "unknown",
            "last_verified_at": "2026-10-09",
            "attribution": ["테스트 데이터"],
        }

    def with_item(self):
        obj = copy.deepcopy(self.empty)
        obj["generated_at"] = "2026-10-09T00:00:00+09:00"
        obj["restaurants"] = [copy.deepcopy(self.item)]
        return obj

    def test_empty_feed(self):
        self.assertEqual(validate(self.empty), 0)

    def test_sample_card(self):
        self.assertEqual(validate(self.with_item()), 1)

    def test_reject_source_url(self):
        obj = self.with_item()
        obj["restaurants"][0]["source_url"] = "https://example.org/private-path"
        with self.assertRaises(ValueError):
            validate(obj)

    def test_reject_smuggled_strings_in_allowed_fields(self):
        from urllib.parse import quote
        original = 'https://example.invalid/collect'
        values = [original, quote(original, safe=''),
                  quote(quote(original, safe=''), safe=''),
                  'https&#58;&#47;&#47;example.invalid/collect',
                  r'\u0068ttps\x3a//example.invalid/collect',
                  'internal/raw/synthetic', r'C:\private\synthetic',
                  'Bearer '+'synthetic-marker', 'gh'+'p_'+'synthetic'*5]
        for value in values:
            for field in ('name', 'attribution'):
                with self.subTest(field=field, value=value):
                    obj = self.with_item()
                    obj['restaurants'][0][field] = [value] if field == 'attribution' else value
                    with self.assertRaises(ValueError) as caught:
                        validate(obj)
                    self.assertNotIn(value, str(caught.exception))

    def test_nested_recognition_cannot_bypass_guard(self):
        obj = self.with_item()
        obj['restaurants'][0]['recognitions'] = [
            {'organization':'기관', 'label':'https%3A%2F%2Fexample.invalid', 'year':2026}]
        with self.assertRaises(ValueError):
            validate(obj)

    def test_reject_duplicate_restaurant(self):
        obj = self.with_item()
        obj["restaurants"].append(copy.deepcopy(self.item))
        with self.assertRaises(ValueError):
            validate(obj)

    def test_reject_undated_populated_feed(self):
        obj = self.with_item()
        obj["generated_at"] = None
        with self.assertRaises(ValueError):
            validate(obj)

    def test_reject_bad_price(self):
        obj = self.with_item()
        obj["restaurants"][0]["price_per_person"] = {
            "currency": "KRW", "min": 30000, "max": 10000, "verified_at": "2026-10-09"
        }
        with self.assertRaises(ValueError):
            validate(obj)


if __name__ == "__main__":
    unittest.main()

