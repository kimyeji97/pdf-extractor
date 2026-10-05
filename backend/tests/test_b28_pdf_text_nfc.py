"""
REQ-B28 Phase 1 — PDF 에 그리는 사용자 문자열을 NFC 로 정규화한다

검증 계약: docs/plans/PLAN-B28-pdf-text-nfc.md `## 검증 계약`
케이스: B28-01 ~ B28-06

**이 결함은 에러를 내지 않는다.** `fitz.Font("korea")` 는 실제로는
`Droid Sans Fallback Regular` 라 **한글 자모 블록(U+1100~)에 글리프가 거의 없고**,
`TextWriter.append()` 는 글리프 없는 문자를 **조용히 notdef(`\\x00`)로 치환**한다
(계약 #37). macOS 가 올린 파일명은 **NFD(자모 분해)** 라(`학` = `ᄒ`+`ᅡ`+`ᆨ`)
그대로 그리면 글자가 통째로 사라진다 (계약 #38).

⚠️ **문자열만 비교하는 테스트로는 못 잡는다.** `build_source_label()` 은 글자를
   만들 뿐 그리지 않는다 — 그래서 여기 케이스들은 **실제로 렌더한 PDF 를
   `get_text()` 로 되읽는다**(`test_watermark_alpha.py` 와 같은 방식).

⚠️ **미리보기로는 영원히 검증되지 않는다.** 브라우저는 NFD 를 폰트 폴백으로
   조합해 정상 렌더한다 — dev 에서 실제로 미리보기는 멀쩡한데 PDF 만 깨져 있었다.
"""
import ast
import unicodedata as ud

import fitz

from app.services.pdf_service import (
    _apply_footnote,
    _build_grid_pdf,
    _get_label_font,
    build_source_label,
    SourcedCropRegion,
)

# 2026-10-05 dev 에서 실제로 깨진 이름 — 재현 데이터를 그대로 쓴다.
NAME_NFC = "2026 2학기 중3 내신마스터(1~3회)"
NAME_NFD = ud.normalize("NFD", NAME_NFC)

NOTDEF = "\x00"


def _source_pdf(tmp_path) -> str:
    """크롭해 올 원본 PDF (내용은 중요하지 않다 — 라벨만 본다)."""
    path = str(tmp_path / "src.pdf")
    doc = fitz.open()
    for i in range(3):
        doc.new_page(width=595, height=842).insert_text(
            fitz.Point(60, 100), f"page {i + 1}", fontsize=20
        )
    doc.save(path)
    doc.close()
    return path


def _render_label(tmp_path, workbook_name: str) -> str:
    """주어진 이름으로 라벨을 그린 PDF 를 만들고 **추출 텍스트**를 돌려준다."""
    out = str(tmp_path / "grid.pdf")
    label = build_source_label(
        index=1,
        workbook_name=workbook_name,
        filename="",
        page_num=3,
        question_name="문항 4",
    )
    _build_grid_pdf(
        [
            SourcedCropRegion(
                src_path=_source_pdf(tmp_path),
                page_index=0,
                x0=0, y0=0, x1=595, y1=400,
                source_label=label,
                scale=1.0,
            )
        ],
        out,
        "가로 2단",
    )
    doc = fitz.open(out)
    text = "\n".join(page.get_text() for page in doc)
    doc.close()

    # 빈 스캔이 초록으로 보이는 것을 막는다 — 라벨 자리를 실제로 읽었는지부터 본다.
    assert "1번)" in text
    return text


def _render_footnote(tmp_path, footnote: str) -> str:
    """각주를 넣은 PDF 를 만들고 추출 텍스트를 돌려준다."""
    path = str(tmp_path / "fn.pdf")
    doc = fitz.open()
    doc.new_page(width=595, height=842)
    doc.save(path)
    doc.close()

    _apply_footnote(path, footnote)

    doc = fitz.open(path)
    text = doc[0].get_text()
    doc.close()

    assert text.strip(), "각주가 아예 안 그려졌다 — 무대가 틀렸다"
    return text


def test_B28_01_label_nfd_name_renders_as_nfc(tmp_path):
    """[B28-01] NFD 이름을 그려도 추출 텍스트가 NFC 원문과 같다."""
    text = _render_label(tmp_path, NAME_NFD)

    # notdef 가 하나라도 있으면 글자가 사라진 것이다.
    assert NOTDEF not in text
    assert NAME_NFC in text


def test_B28_02_footnote_nfd_renders_as_nfc(tmp_path):
    """[B28-02] 각주도 같다 — 그리는 자리가 둘이라 한쪽만 고치기 쉽다."""
    text = _render_footnote(tmp_path, NAME_NFD)

    assert NOTDEF not in text
    assert NAME_NFC in text


def test_B28_03_nfc_not_nfkc_keeps_compatibility_chars(tmp_path):
    """[B28-03] NFKC 면 `①`→`1`, `㈜`→`(주)` 로 사용자가 쓴 글자가 말없이 바뀐다.

    둘 다 이 폰트에 글리프가 있다(실측 866·1506번) — 사라져서 통과하는 일은 없다.
    """
    name = "①단원 ㈜대한"
    text = _render_label(tmp_path, name)

    assert "①" in text
    assert "㈜" in text
    assert "(주)" not in text


def test_B28_04_build_source_label_does_not_normalize():
    """[B28-04] 정규화는 **그리는 자리**에 있고 이 함수에는 없다 (계약 #12).

    이 함수는 프론트 `buildSourceLabel()` 과 **글자 그대로** 같아야 한다 —
    백엔드만 정규화하면 그 비교가 어긋난다(PLAN § 결정에서 기각한 안).
    """
    label = build_source_label(
        index=1,
        workbook_name=NAME_NFD,
        filename="",
        page_num=3,
        question_name="문항 4",
    )

    assert NAME_NFD in label      # 받은 그대로
    assert NAME_NFC not in label  # 여기서 조립해 주지 않는다


def test_B28_05_premise_unnormalized_nfd_loses_glyphs():
    """[B28-05] 전제 고정 — 정규화를 거치지 않으면 글자가 사라진다 (계약 #37).

    ⚠️ PyMuPDF 가 진짜 한글 폰트를 싣게 되면 이 케이스가 실패한다.
       오경보가 아니라 **"계약 #37 의 전제가 바뀌었다"는 신호**로 읽을 것.
    """
    doc = fitz.open()
    page = doc.new_page(width=595, height=120)
    writer = fitz.TextWriter(page.rect)
    writer.append(fitz.Point(10, 40), NAME_NFD, font=_get_label_font(), fontsize=12)
    writer.write_text(page)

    text = fitz.open("pdf", doc.tobytes())[0].get_text()
    doc.close()

    assert NOTDEF in text         # 조용히 사라진다
    assert NAME_NFC not in text


def test_B28_06_every_draw_site_normalizes():
    """[B28-06] `tw.append(` 호출이 **전부** 정규화를 거친다.

    이 프로젝트의 반복된 실패가 **"절반만 고쳤다"** 다(F16·F17 리뷰 회차마다 나왔다).
    그리는 자리가 둘이라 라벨만 고치고 각주를 빼먹기 쉽고, **세 번째 자리가
    생기면** 동작 케이스(B28-01·02)는 그걸 못 본다.

    ⚠️ **문자열 검색으로 하지 않는다**(`/review` 회차 0 의 (b)). `"tw.append("` 를
       `startswith` 로 찾으면 **docstring 의 산문까지 draw site 로 센다** — 실제로
       `_nfc` 의 주석이 세 번째 "자리"로 잡혀 분모 가드를 부풀렸고, 창을 `fontsize`
       로 끊은 탓에 **`fontsize=` 없는 새 draw site 가 녹색으로 통과**했다(변형 실측).
       `ast` 로 **실제 호출만** 고른다.
    """
    source = (
        __import__("pathlib").Path(__file__).resolve().parents[1]
        / "app" / "services" / "pdf_service.py"
    ).read_text(encoding="utf-8")
    tree = ast.parse(source)

    # `tw = fitz.TextWriter(...)` 로 묶인 이름들 — 변수명을 `tw` 로 가정하지 않는다.
    writers = {
        target.id
        for node in ast.walk(tree)
        if isinstance(node, ast.Assign)
        for target in node.targets
        if isinstance(target, ast.Name)
        and isinstance(node.value, ast.Call)
        and ast.unparse(node.value.func).endswith("TextWriter")
    }
    assert writers, "TextWriter 를 만드는 자리를 못 찾았다 — 무대가 틀렸다"

    sites = [
        node
        for node in ast.walk(tree)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr == "append"
        and isinstance(node.func.value, ast.Name)
        and node.func.value.id in writers
    ]

    # 0건이면 어떤 구현도 통과한다 — 분모부터 고정한다 (계약 #25 "0건은 초록색").
    assert len(sites) >= 2, f"그리는 자리를 못 찾았다 (찾은 수: {len(sites)})"

    for call in sites:
        drawn = [
            arg for arg in call.args
            if isinstance(arg, ast.Call) and ast.unparse(arg.func) == "_nfc"
        ]
        assert drawn, (
            f"정규화를 거치지 않는 draw site 가 있다 "
            f"({call.lineno}줄): {ast.unparse(call)}"
        )


def test_B28_07_nfd_renders_at_same_font_size_as_nfc(tmp_path):
    """[B28-07] NFD 입력이 NFC 와 **같은 폰트 크기**로 그려진다.

    폭 계산(`text_length`)까지 정규화 후 문자열로 맞춰야 한다 — NFD 는 자모가
    낱자로 세어져 **79% 넓게 측정되고**(실측 570 vs 318pt) REQ-B09 자동 축소가
    과하게 걸려 라벨이 쓸데없이 작아진다. 글자가 맞는지만 보는 B28-01 로는
    못 잡는다(되돌려도 녹색이다).

    근거: PLAN § 결정 — "재는 문자열과 그리는 문자열이 달라지면 새 불일치가 생긴다"

    ⚠️ **레이아웃은 `4단`이어야 한다.** `가로 2단`은 셀이 한 칸이라 폭이 ~571pt 고,
       이 라벨은 NFD 로 재도 570.3pt 라 **축소가 아예 안 걸려 양쪽 다 14.0** 이 된다
       — 그 무대에서는 폭 계산을 되돌려도 통과했다(실측). 4단은 셀이 좁아
       **11.92 vs 7.80** 으로 갈린다.
    """
    def label_size(name: str) -> float:
        out = str(tmp_path / f"size_{len(name)}.pdf")
        _build_grid_pdf(
            [
                SourcedCropRegion(
                    src_path=_source_pdf(tmp_path),
                    page_index=0,
                    x0=0, y0=0, x1=595, y1=400,
                    source_label=build_source_label(
                        index=1, workbook_name=name, filename="",
                        page_num=3, question_name="문항 4",
                    ),
                    scale=1.0,
                )
            ],
            out,
            "4단",
        )
        doc = fitz.open(out)
        sizes = [
            span["size"]
            for block in doc[0].get_text("dict")["blocks"]
            for line in block.get("lines", [])
            for span in line["spans"]
            if "번)" in span["text"]
        ]
        doc.close()
        assert sizes, "라벨 span 을 못 찾았다 — 무대가 틀렸다"
        return round(sizes[0], 3)

    assert label_size(NAME_NFD) == label_size(NAME_NFC)
