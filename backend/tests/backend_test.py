"""ModalTani backend API regression tests (iteration 1)."""
import os
import uuid

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Health / root ----------------
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "online"
        assert data["app"] == "ModalTani API"


# ---------------- Users & demo auth ----------------
class TestUsers:
    def test_get_users(self, client):
        r = client.get(f"{API}/users", timeout=30)
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list) and len(users) >= 7
        assert all("_id" not in u for u in users)
        roles = {u["role"] for u in users}
        assert "petani" in roles and "admin_bank" in roles
        names = {u["nama"] for u in users}
        assert "Budi Hartono" in names
        assert any("Bambang Prakoso" in n for n in names)

    def test_demo_login_by_role(self, client):
        r = client.post(f"{API}/auth/demo-login", json={"role": "admin_bank"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["success"] is True
        assert d["user"]["role"] == "admin_bank"

    def test_demo_login_by_user_id(self, client):
        r = client.post(f"{API}/auth/demo-login", json={"user_id": "user-budi"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["user"]["nama"] == "Budi Hartono"


# ---------------- Learning modules ----------------
class TestModules:
    def test_get_modules(self, client):
        r = client.get(f"{API}/modules", timeout=30)
        assert r.status_code == 200
        mods = r.json()
        assert len(mods) == 3
        assert [m["plek_category_number"] for m in mods] == [1, 2, 3]
        for m in mods:
            assert m["quiz"] and isinstance(m["quiz"], list)
            assert m["summary_points"]
            assert m["media_url"].startswith("http")
            assert "_id" not in m

    def test_get_module_detail(self, client):
        r = client.get(f"{API}/modules/mod-1", timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == "mod-1"

    def test_get_module_detail_not_found(self, client):
        r = client.get(f"{API}/modules/does-not-exist", timeout=30)
        # BUG expectation: should be 404
        assert r.status_code == 404, f"expected 404, got {r.status_code} body={r.text[:200]}"


# ---------------- Pretest ----------------
class TestPretest:
    def test_get_pretest(self, client):
        r = client.get(f"{API}/pretest", timeout=30)
        assert r.status_code == 200
        qs = r.json()
        assert len(qs) == 5
        for q in qs:
            assert len(q["options"]) == 4
            assert q["correct_option_id"]

    def test_submit_pretest_persists(self, client):
        qs = client.get(f"{API}/pretest", timeout=30).json()
        answers = {q["id"]: q["correct_option_id"] for q in qs}
        r = client.post(f"{API}/pretest/submit", json={"user_id": "user-budi", "answers": answers}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["score"] == 100
        assert d["correct_count"] == len(qs)
        assert len(d["results"]) == len(qs)
        # verify persisted on profile
        prof = client.get(f"{API}/crm/farmers/user-budi", timeout=30).json()
        assert prof["pretest_completed"] is True
        assert prof["pretest_score"] == 100

    def test_submit_pretest_wrong_answers(self, client):
        r = client.post(f"{API}/pretest/submit", json={"user_id": "user-joko", "answers": {"pre-1": "d", "pre-2": "a"}}, timeout=30)
        assert r.status_code == 200
        assert r.json()["correct_count"] == 0

    def test_submit_pretest_validation(self, client):
        r = client.post(f"{API}/pretest/submit", json={"user_id": "x"}, timeout=30)
        assert r.status_code == 422


# ---------------- Learning progress ----------------
class TestLearningProgress:
    UID = "TEST_user_progress"

    def test_progress_empty_user(self, client):
        r = client.get(f"{API}/learning-progress/{self.UID}", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["completed_count"] == 0
        assert d["total_modules"] == 3
        assert d["progress_percentage"] == 0

    def test_update_and_read_progress(self, client):
        payload = {"user_id": self.UID, "module_id": "mod-1", "status": "completed", "quiz_score": 100}
        r = client.post(f"{API}/learning-progress/update", json=payload, timeout=30)
        assert r.status_code == 200
        assert r.json()["success"] is True
        d = client.get(f"{API}/learning-progress/{self.UID}", timeout=30).json()
        assert d["completed_count"] == 1
        assert d["progress_percentage"] == 33
        assert d["avg_quiz_score"] == 100

    def test_update_is_idempotent_upsert(self, client):
        payload = {"user_id": self.UID, "module_id": "mod-1", "status": "completed", "quiz_score": 50}
        client.post(f"{API}/learning-progress/update", json=payload, timeout=30)
        d = client.get(f"{API}/learning-progress/{self.UID}", timeout=30).json()
        assert len(d["records"]) == 1
        assert d["avg_quiz_score"] == 50


# ---------------- KUR docs (KB CRUD) ----------------
class TestKurDocs:
    created = []

    def test_get_kur_docs(self, client):
        r = client.get(f"{API}/kur-docs", timeout=30)
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) >= 8
        for d in docs:
            assert d["judul"] and d["isi_teks"] and d["sumber_nama"]
            assert "_id" not in d

    def test_create_get_delete_doc(self, client):
        payload = {
            "topik": "TEST_topik",
            "judul": "TEST_Dokumen Uji",
            "kategori": "Regulasi Umum",
            "isi_teks": "Isi dokumen uji otomatis untuk regresi.",
            "sumber_nama": "TEST_Sumber",
            "sumber_link": "https://example.com",
            "pasal_rujukan": "Pasal Uji",
        }
        r = client.post(f"{API}/kur-docs", json=payload, timeout=30)
        assert r.status_code == 200
        doc = r.json()["doc"]
        doc_id = doc["id"]
        assert doc["judul"] == payload["judul"]

        listing = client.get(f"{API}/kur-docs", timeout=30).json()
        assert any(d["id"] == doc_id for d in listing)

        dr = client.delete(f"{API}/kur-docs/{doc_id}", timeout=30)
        assert dr.status_code == 200 and dr.json()["success"] is True
        listing = client.get(f"{API}/kur-docs", timeout=30).json()
        assert not any(d["id"] == doc_id for d in listing)

    def test_create_doc_validation(self, client):
        r = client.post(f"{API}/kur-docs", json={"judul": "no topik"}, timeout=30)
        assert r.status_code == 422

    def test_delete_nonexistent_doc(self, client):
        r = client.delete(f"{API}/kur-docs/doc-nonexistent-xyz", timeout=30)
        assert r.status_code == 404, f"expected 404 for missing doc, got {r.status_code} {r.text[:120]}"


# ---------------- RAG chat ----------------
class TestChat:
    UID = "TEST_user_chat"

    def test_chat_ask_returns_answer_and_sources(self, client):
        r = client.post(f"{API}/chat/ask", json={"user_id": self.UID, "message": "Apa syarat KUR?"}, timeout=120)
        assert r.status_code == 200
        d = r.json()
        assert "answer" in d and len(d["answer"]) > 50
        assert isinstance(d["sources"], list) and len(d["sources"]) > 0
        assert isinstance(d["source_details"], list) and len(d["source_details"]) > 0
        for s in d["source_details"]:
            assert {"nama", "judul", "link", "pasal"} <= set(s.keys())
        assert d["disclaimer"]

    def test_chat_ask_bunga_query(self, client):
        r = client.post(f"{API}/chat/ask", json={"user_id": self.UID, "message": "Berapa bunga KUR pertanian?"}, timeout=120)
        assert r.status_code == 200
        assert len(r.json()["source_details"]) > 0

    def test_chat_history_persisted(self, client):
        r = client.get(f"{API}/chat/history/{self.UID}", timeout=30)
        assert r.status_code == 200
        msgs = r.json()["messages"]
        assert len(msgs) >= 4
        assert msgs[0]["role"] == "user"
        assert msgs[1]["role"] == "assistant"
        assert msgs[1]["sumber_detail"]

    def test_chat_empty_message(self, client):
        r = client.post(f"{API}/chat/ask", json={"user_id": self.UID, "message": "   "}, timeout=60)
        # should be a 4xx validation error, not 200 with error body
        assert r.status_code == 400, f"expected 400, got {r.status_code} body={r.text[:200]}"

    def test_clear_chat_history(self, client):
        r = client.delete(f"{API}/chat/history/{self.UID}", timeout=30)
        assert r.status_code == 200
        assert client.get(f"{API}/chat/history/{self.UID}", timeout=30).json()["messages"] == []


# ---------------- CRM ----------------
class TestCRM:
    def test_get_farmers(self, client):
        r = client.get(f"{API}/crm/farmers", timeout=60)
        assert r.status_code == 200
        farmers = r.json()
        assert len(farmers) >= 6
        scores = [f["credit_score"]["total_score"] for f in farmers]
        assert scores == sorted(scores, reverse=True)
        f0 = farmers[0]
        cs = f0["credit_score"]
        assert 0 <= cs["total_score"] <= 100
        assert cs["kategori"] in [
            "Layak Direkomendasikan", "Perlu Pendampingan Lanjutan", "Belum Layak — Edukasi Dulu"]
        assert len(cs["auditable_factors"]) == 4
        assert f0["total_modul"] == 3
        assert "_id" not in f0

    def test_farmers_search_filter(self, client):
        r = client.get(f"{API}/crm/farmers", params={"search": "Budi"}, timeout=60)
        assert r.status_code == 200
        res = r.json()
        assert len(res) == 1 and res[0]["nama"] == "Budi Hartono"

    def test_farmers_komoditas_filter(self, client):
        r = client.get(f"{API}/crm/farmers", params={"komoditas": "Bawang"}, timeout=60)
        assert r.status_code == 200
        assert all("bawang" in f["komoditas"].lower() for f in r.json())

    def test_farmer_detail(self, client):
        r = client.get(f"{API}/crm/farmers/user-siti", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["nama"] == "Siti Aminah"
        assert "credit_score" in d and "progress_detail" in d

    def test_farmer_detail_not_found(self, client):
        r = client.get(f"{API}/crm/farmers/nope-xyz", timeout=30)
        assert r.status_code == 404, f"expected 404, got {r.status_code} {r.text[:150]}"

    def test_update_documents_recalculates_score(self, client):
        before = client.get(f"{API}/crm/farmers/user-joko", timeout=30).json()
        original_docs = before["dokumen"]
        assert original_docs["nib_atau_sku"] is False
        new_docs = {**original_docs, "nib_atau_sku": True}
        r = client.put(f"{API}/crm/farmers/user-joko/documents", json=new_docs, timeout=30)
        assert r.status_code == 200 and r.json()["success"] is True
        after = client.get(f"{API}/crm/farmers/user-joko", timeout=30).json()
        assert after["dokumen"]["nib_atau_sku"] is True
        assert after["credit_score"]["dokumen_poin"] == before["credit_score"]["dokumen_poin"] + 10
        assert after["credit_score"]["total_score"] > before["credit_score"]["total_score"]
        # restore
        client.put(f"{API}/crm/farmers/user-joko/documents", json=original_docs, timeout=30)
        restored = client.get(f"{API}/crm/farmers/user-joko", timeout=30).json()
        assert restored["dokumen"]["nib_atau_sku"] is False

    def test_update_documents_unknown_farmer(self, client):
        r = client.put(f"{API}/crm/farmers/unknown-farmer-xyz/documents",
                       json={"ktp": True, "kk": True, "nib_atau_sku": True,
                             "sppt_pbb_atau_surat_lahan": True, "buku_tabungan": True, "foto_lahan": True},
                       timeout=30)
        assert r.status_code == 404, f"expected 404 for unknown farmer, got {r.status_code} {r.text[:150]}"

    def test_create_farmer_and_verify(self, client):
        uid = f"TEST_farmer_{uuid.uuid4().hex[:6]}"
        payload = {
            "user_id": uid,
            "nama": "TEST_Petani Baru",
            "no_hp": "0800-0000-0000",
            "desa": "Desa Uji",
            "kecamatan": "Kec. Uji",
            "kabupaten": "Kab. Uji",
            "provinsi": "Jawa Uji",
            "komoditas": "Padi Uji",
            "luas_lahan_ha": 1.5,
            "status_lahan": "Milik Sendiri",
            "lama_bertani_tahun": 6,
            "estimasi_pendapatan_musim_rp": 20000000,
            "riwayat_panen": [],
            "dokumen": {"ktp": True, "kk": True, "nib_atau_sku": False,
                        "sppt_pbb_atau_surat_lahan": False, "buku_tabungan": False, "foto_lahan": False},
        }
        r = client.post(f"{API}/crm/farmers", json=payload, timeout=30)
        assert r.status_code == 200
        assert r.json()["farmer"]["nama"] == "TEST_Petani Baru"

        detail = client.get(f"{API}/crm/farmers/{uid}", timeout=30)
        assert detail.status_code == 200
        d = detail.json()
        assert d["luas_lahan_ha"] == 1.5
        assert d["credit_score"]["luas_lahan_poin"] == 21.0  # 18 + 3 owned
        # appears in list
        listing = client.get(f"{API}/crm/farmers", params={"search": "TEST_Petani"}, timeout=60).json()
        assert any(f["user_id"] == uid for f in listing)
        # also created a user record
        users = client.get(f"{API}/users", timeout=30).json()
        assert any(u["id"] == uid for u in users)

    def test_create_farmer_validation(self, client):
        r = client.post(f"{API}/crm/farmers", json={"nama": "incomplete"}, timeout=30)
        assert r.status_code == 422

    def test_analytics(self, client):
        r = client.get(f"{API}/crm/analytics", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert d["total_farmers"] >= 6
        assert 0 <= d["average_credit_score"] <= 100
        assert len(d["distribution_chart"]) == 3
        assert sum(c["value"] for c in d["distribution_chart"]) == d["total_farmers"]
        assert isinstance(d["total_potential_financing_rp"], int)

    def test_analytics_matches_farmers_list(self, client):
        farmers = client.get(f"{API}/crm/farmers", timeout=60).json()
        analytics = client.get(f"{API}/crm/analytics", timeout=60).json()
        assert analytics["total_farmers"] == len(farmers)
        layak = sum(1 for f in farmers if f["credit_score"]["kategori"] == "Layak Direkomendasikan")
        assert analytics["category_counts"]["Layak Direkomendasikan"] == layak


# ---------------- Seed (runs last: wipes TEST data) ----------------
class TestSeedZLast:
    def test_seed(self, client):
        r = client.post(f"{API}/seed", timeout=120)
        assert r.status_code == 200
        assert r.json()["success"] is True
        users = client.get(f"{API}/users", timeout=30).json()
        assert len(users) == 7
        assert not any(u["id"].startswith("TEST_") for u in users)
        farmers = client.get(f"{API}/crm/farmers", timeout=60).json()
        assert len(farmers) == 6
