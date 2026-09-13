"""
REQ-F13 Phase 3 — 워터마크가 원본 알파를 존중한다 검증 계약

검증 계약: docs/plans/PLAN-F13-preview-template-rendering.md `## 검증 계약`
케이스: F13-21 ~ F13-23

**REQ-29가 만든 결함을 REQ-F13이 잡았다.** `_apply_watermark()` 는 투명도를 강제하려고
균일한 회색 마스크를 넘겼는데, PyMuPDF `insert_image` 의 `mask` 는 원본 알파를 **곱하는 게
아니라 통째로 대체한다.** 그래서 투명해야 할 배경까지 반투명해지고, 그 자리 RGB 가 보통
(0,0,0) 이라 **연회색 사각 박스**로 보였다(실측: 흰 종이 255 위에 217).

미리보기(REQ-F13 Phase 2)가 생기기 전에는 다운로드해 열어 보기 전까지 알 수 없던 결함이다 —
CSS `opacity` 는 알파를 곱하므로 미리보기는 처음부터 옳았고, **틀린 쪽은 PDF 였다.**

⚠️ **F13-23 이 없으면 "워터마크를 아예 안 그리는" 구현이 F13-21 을 통과한다.** 마스크를 전부
0 으로 만들면 투명 영역도 종이색이고 도형도 종이색이라 F13-21 은 녹색이 되고, F13-22 는
알파가 없는 경로라 못 잡는다. 그 구멍을 F13-23 이 막는다.

⚠️ **테스트용 투명 PNG 를 의존성 없이 직접 만든다.** `fitz` 만으로는 알파 채널을 픽셀 단위로
지정하기 어렵고(`set_pixel` 이 알파를 안 받는다), PIL 은 이 레포 의존성에 없다.
"""
import struct
import zlib

import fitz

from app.services.pdf_service import _WATERMARK_OPACITY, _apply_watermark

PAPER = (255, 255, 255)          # 빈 페이지(흰 종이)
SHAPE_RGB = (200, 230, 160)      # 워터마크 도형의 원색


def _png_rgba(width: int, height: int, pixel) -> bytes:
    """RGBA PNG 를 직접 인코딩한다 — `pixel(x, y)` 가 (r, g, b, a) 를 돌려준다."""
    raw = b"".join(
        b"\x00" + b"".join(bytes(pixel(x, y)) for x in range(width))
        for y in range(height)
    )

    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


def _transparent_bg_png() -> bytes:
    """가운데만 불투명한 도형, 나머지는 **완전 투명**(alpha 0, RGB 0,0,0)."""
    def pixel(x, y):
        inside = 20 <= x < 40 and 20 <= y < 40
        return (*SHAPE_RGB, 255) if inside else (0, 0, 0, 0)

    return _png_rgba(60, 60, pixel)


def _opaque_png() -> bytes:
    """알파 채널이 없는 원본(JPEG 등을 대신한다) — 전면 단색."""
    pix = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 60, 60), False)
    pix.set_rect(pix.irect, SHAPE_RGB)
    return pix.tobytes("png")


def _render_with_watermark(tmp_path, image_bytes: bytes):
    """빈 A4 유사 페이지에 워터마크를 넣고 렌더한 픽스맵을 돌려준다.

    워터마크는 페이지 중앙에 `min(w, h) * 비율` 크기로 들어간다. 200x200 페이지이므로
    이미지 영역은 (50,50)~(150,150) 이다 — 아래 좌표는 거기서 나온다.
    """
    pdf = str(tmp_path / "wm.pdf")
    doc = fitz.open()
    doc.new_page(width=200, height=200)
    doc.save(pdf)
    doc.close()

    _apply_watermark(pdf, image_bytes)

    doc = fitz.open(pdf)
    pixmap = doc[0].get_pixmap()
    doc.close()
    return pixmap


# 측정 지점 — 이미지 영역 (50,50)~(150,150) 안에서
OUTSIDE = (10, 10)     # 이미지 밖: 빈 종이
BACKGROUND = (60, 60)  # 이미지 안, 원본이 투명했던 자리
SHAPE = (100, 100)     # 이미지 안, 도형 자리


def test_F13_21_투명_배경은_종이색_그대로다(tmp_path):
    """근거: PLAN § Phase 3 — "완료 기준: 투명 배경 PNG를 워터마크로 넣은 PDF에서 **이미지의 투명 영역이 종이색 그대로**다"

    이 케이스가 회색 사각 박스의 재발을 막는다. 수정 전 실측값은 (217, 217, 217) 이었다.
    """
    pixmap = _render_with_watermark(tmp_path, _transparent_bg_png())

    assert pixmap.pixel(*BACKGROUND) == PAPER


def test_F13_22_알파가_없는_원본은_전면이_옅어진다(tmp_path):
    """근거: PLAN § Phase 3 — "(회색 사각 박스가 없다). 알파 없는 원본은 종전대로 전면이 투명도만큼 옅어진다."

    덮을 알파가 **없으므로** 균일 마스크가 유일한 수단이고, 그 경우엔 원래 동작이 옳았다
    (계획서 § 결정 "알파 없는 원본"). 전면을 알파 곱으로 통일하면 여기가 빨개진다.
    """
    pixmap = _render_with_watermark(tmp_path, _opaque_png())

    assert pixmap.pixel(*BACKGROUND) != PAPER


def test_F13_23_도형은_그려지되_반투명이다(tmp_path):
    """근거: PLAN § 결정 — "**PyMuPDF `insert_image`의 `mask`는 원본 알파를 곱하지 않고 통째로 대체한다.**"

    마스크를 전부 0 으로 만들어 "아무것도 안 그리는" 구현이 F13-21 을 통과하는 것을 막는다.
    도형 자리는 종이색(안 그려짐)도, 원색(투명도 미적용)도 아니어야 한다.
    """
    pixmap = _render_with_watermark(tmp_path, _transparent_bg_png())

    assert pixmap.pixel(*SHAPE) not in (PAPER, SHAPE_RGB)
