"""
REQ-B28 Phase 1 — PDF 에 그리는 사용자 문자열을 NFC 로 정규화한다

검증 계약: docs/plans/PLAN-B28-pdf-text-nfc.md `## 검증 계약`
케이스: B28-01 ~ B28-07

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
    """[B28-02] 각주도 같다 — 호출부가 둘이라 한쪽만 고치기 쉽다(통로는 `_draw_text()` 하나)."""
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
    """[B28-06] PDF 에 글자를 그리는 통로가 **하나**이고, 그 통로가 정규화한다.

    이 프로젝트의 반복된 실패가 **"절반만 고쳤다"** 다(F16·F17 리뷰 회차마다 나왔다).
    **세 번째 draw site 가 생겨도** 동작 케이스(B28-01·02)는 그걸 못 본다.

    ⚠️ **"어떤 모양의 호출인가"를 열거하지 않는다 — 두 번 샜다.**
       `/review` 회차 0: 문자열 검색이 docstring 산문을 세고, 창을 `fontsize` 로 끊어
       **`fontsize=` 없는 새 draw site 가 통과**했다.
       `/review` 회차 1: `ast` 로 바꿨지만 수신자를 `ast.Name` 으로만 봐서 **체이닝·walrus·
       속성·인덱스 4종이 통과**했고, 정상 구현 2종(`safe = _nfc(t)` 경유 · `text=` 키워드)은
       오히려 빨개졌다 — **테스트가 구현 모양을 지시**하고 있었다.
       → 생성 자체를 `_draw_text()` 하나로 모으고 **그 사실만** 단언한다.

    ⚠️ **그래도 전수는 아니다 — 소스 스캔은 구문만 본다**(`/review` 회차 2). `fitz.TextWriter`
       라고 **쓰인** 생성지만 보므로 아래는 **정규화 없이도 통과**한다(전부 실측):
       별칭 `_fitz.TextWriter(…)`(이 파일 72줄에 `import fitz as _fitz` 가 이미 있다) ·
       `from fitz import TextWriter as _TW` · `getattr(fitz, "TextWriter")` ·
       `page.insert_htmlbox()` 처럼 **TextWriter 를 안 거치는 그리기**.
       열거를 바꿔 가며 세 번 샜고 네 번째도 같아서 **2026-10-05 감수하기로 결정**했다 —
       레포 전체에서 생성지가 `_draw_text()` 안 한 자리뿐이라 현시점 노출이 0 이다.
       ⚠️ 그리고 이 스캔은 **`pdf_service.py` 한 파일만** 본다(계약 #31 의 "스캔은 `client.js`
          한 파일만 본다"와 같은 모양). 다른 모듈에 그리는 코드가 생기면 못 본다.
    """
    source = (
        __import__("pathlib").Path(__file__).resolve().parents[1]
        / "app" / "services" / "pdf_service.py"
    ).read_text(encoding="utf-8")
    tree = ast.parse(source)

    wrapper = next(
        (n for n in ast.walk(tree)
         if isinstance(n, ast.FunctionDef) and n.name == "_draw_text"),
        None,
    )
    assert wrapper is not None, "`_draw_text()` 통로가 없다 — 무대가 틀렸다"

    # ① TextWriter 는 그 통로 안에서만 만든다.
    creations = [
        n for n in ast.walk(tree)
        if isinstance(n, ast.Call) and ast.unparse(n.func) == "fitz.TextWriter"
    ]
    assert creations, "`fitz.TextWriter(` 생성을 못 찾았다 — 무대가 틀렸다"
    outside = [
        n.lineno for n in creations
        if not (wrapper.lineno <= n.lineno <= wrapper.end_lineno)
    ]
    assert not outside, (
        f"`_draw_text()` 밖에서 TextWriter 를 만든다 ({outside}줄) — "
        f"그 자리는 정규화를 건너뛸 수 있다"
    )

    # ② 그 통로가 정규화를 거친다. (함수가 하나뿐이라 본문 검사로 충분하다)
    assert "_nfc(" in ast.get_source_segment(source, wrapper), (
        "`_draw_text()` 가 `_nfc` 를 거치지 않는다"
    )

    # ③ 분모 — 그릴 자리가 실제로 남아 있다 (0건은 초록색, 계약 #25).
    users = [
        n for n in ast.walk(tree)
        if isinstance(n, ast.Call) and ast.unparse(n.func) == "_draw_text"
    ]
    assert len(users) >= 2, f"그리는 자리를 못 찾았다 (찾은 수: {len(users)})"


def test_B28_07_nfd_renders_at_same_font_size_as_nfc(tmp_path):
    """[B28-07] NFD 입력이 NFC 와 **같은 폰트 크기**로 그려진다.

    폭 계산(`text_length`)까지 정규화 후 문자열로 맞춰야 한다 — NFD 는 자모가
    낱자로 세어져 **79% 넓게 측정되고**(실측 570 vs 318pt) REQ-B09 자동 축소가
    과하게 걸려 라벨이 쓸데없이 작아진다. 글자가 맞는지만 보는 B28-01 로는
    못 잡는다(되돌려도 녹색이다).

    근거: PLAN § 결정 — "재는 문자열과 그리는 문자열이 달라지면 새 불일치가 생긴다"

    ⚠️ **레이아웃은 `4단`이어야 한다.** `가로 2단`은 셀이 한 칸이라 `max_w=551pt` 인데
       이 라벨은 NFD 로 재도 **486.3pt** 라 **축소가 아예 안 걸려 양쪽 다 14.0** 이 된다
       — 그 무대에서는 폭 계산을 되돌려도 통과했다(실측). 4단은 `max_w=271pt` 라
       **11.92 vs 7.80** 으로 갈린다.
       (NFC 318.3 vs NFD 486.3pt @14pt. **570.3 은 라벨 *전체* 를 NFD 로 돌렸을 때**고,
        현실은 **이름만 NFD** 다 — 템플릿 `번)`·`문항` 은 파이썬 소스 리터럴이라 NFC)
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

    # 분모 — 축소가 **실제로 걸린 무대**여야 한다. 양쪽 다 상한 14.0(또는 하한 6.0)에
    # 붙으면 비교가 저절로 같아져 **버그가 되살아난 채로 녹색**이 된다(/review 회차 1 실측:
    # 셀을 넓히면 그대로 통과했다). 레이아웃 상수가 바뀌면 여기서 먼저 터진다.
    assert 6.0 < label_size(NAME_NFC) < 14.0

    assert label_size(NAME_NFD) == label_size(NAME_NFC)
