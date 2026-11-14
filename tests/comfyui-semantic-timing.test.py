"""验证真实媒体时间戳进入 MiniCPM 输入时的画面和音频关系。"""

import ast
import math
import tempfile
import unittest
from fractions import Fraction
from pathlib import Path

import av
import numpy as np


SOURCE = Path(__file__).resolve().parents[1] / "integrations/comfyui-semantic/local_semantic_nodes.py"


def load_content(name):
    # 只加载被测函数，避免启动 ComfyUI 或加载大模型。
    parsed = ast.parse(SOURCE.read_text(encoding="utf-8"))
    function = next(node for node in parsed.body if isinstance(node, ast.FunctionDef) and node.name == name)
    module = ast.fix_missing_locations(ast.Module(body=[function], type_ignores=[]))
    namespace = {"math": math, "av": av, "np": np}
    exec(compile(module, str(SOURCE), "exec"), namespace)
    return namespace[name]


def make_fixture(path, video_seconds, with_audio=True, audio_start=0, amplitudes=(0.1, 0.2, 0.3, 0.4), video_rate=1):
    with av.open(str(path), "w") as output:
        video = output.add_stream("ffv1", rate=video_rate)
        video.width = video.height = 64
        video.pix_fmt = "yuv420p"
        video.time_base = Fraction(1, 1000)
        if with_audio:
            audio = output.add_stream("pcm_s16le", rate=16000)
            audio.layout = "mono"
            audio.time_base = Fraction(1, 16000)
        for seconds, brightness in video_seconds:
            frame = av.VideoFrame.from_ndarray(np.full((64, 64, 3), brightness, dtype=np.uint8), format="rgb24")
            frame.pts = round(seconds * 1000)
            frame.time_base = Fraction(1, 1000)
            for packet in video.encode(frame):
                output.mux(packet)
        for packet in video.encode(None):
            output.mux(packet)
        if with_audio:
            for seconds, amplitude in enumerate(amplitudes):
                samples = np.full((1, 16000), round(32767 * amplitude), dtype=np.int16)
                frame = av.AudioFrame.from_ndarray(samples, format="s16", layout="mono")
                frame.sample_rate = 16000
                frame.pts = (seconds + audio_start) * 16000
                frame.time_base = Fraction(1, 16000)
                for packet in audio.encode(frame):
                    output.mux(packet)
            for packet in audio.encode(None):
                output.mux(packet)


def pixels_and_audio(content):
    pixels, audio = [], []
    for item in content:
        if isinstance(item, np.ndarray):
            audio.append(item)
        else:
            pixels.append(int(np.asarray(item)[32, 32, 0]))
    return pixels, audio


class VideoAudioTimingTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="vfc-av-timing-")
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "fixture.mkv"
        self.video_content = load_content("_video_content")

    def assert_pixels(self, actual, expected):
        self.assertEqual(len(actual), len(expected))
        for value, target in zip(actual, expected):
            self.assertLessEqual(abs(value - target), 2)

    def test_sparse_pts_keep_each_second_of_audio(self):
        make_fixture(self.path, [(0, 32), (2, 128), (3, 224)])
        content, has_audio = self.video_content(self.path, 0, 4)
        pixels, audio = pixels_and_audio(content)
        self.assertTrue(has_audio)
        self.assert_pixels(pixels, [32, 32, 128, 224])
        self.assertEqual([len(item) for item in audio], [16000] * 4)
        for item, expected in zip(audio, (0.1, 0.2, 0.3, 0.4)):
            self.assertAlmostEqual(float(np.mean(item)), expected, places=3)

    def test_regular_pts_keep_matching_frames_and_audio(self):
        make_fixture(self.path, [(0, 32), (1, 80), (2, 128), (3, 224)])
        content, has_audio = self.video_content(self.path, 0, 4)
        pixels, audio = pixels_and_audio(content)
        self.assertTrue(has_audio)
        self.assert_pixels(pixels, [32, 80, 128, 224])
        self.assertEqual([len(item) for item in audio], [16000] * 4)
        for item, expected in zip(audio, (0.1, 0.2, 0.3, 0.4)):
            self.assertAlmostEqual(float(np.mean(item)), expected, places=3)

    def test_fractional_window_keeps_preceding_frame_and_last_partial_audio(self):
        make_fixture(self.path, [(0, 32), (2, 128), (3, 224)])
        content, has_audio = self.video_content(self.path, 0.4, 2.3)
        pixels, audio = pixels_and_audio(content)
        self.assertTrue(has_audio)
        self.assert_pixels(pixels, [32, 32, 128])
        self.assertEqual([len(item) for item in audio], [16000, 16000, 4800])
        for item, expected in zip(audio, (0.14, 0.24, 0.3)):
            self.assertAlmostEqual(float(np.mean(item)), expected, places=3)

    def test_video_only_keeps_sampled_display_frames(self):
        make_fixture(self.path, [(0, 32), (2, 128), (3, 224)], with_audio=False)
        content, has_audio = self.video_content(self.path, 0, 4)
        pixels, audio = pixels_and_audio(content)
        self.assertFalse(has_audio)
        self.assert_pixels(pixels, [32, 32, 128, 224])
        self.assertEqual(audio, [])

    def test_audio_before_video_does_not_invent_future_frames(self):
        make_fixture(self.path, [(2, 128), (3, 224)])
        with self.assertRaisesRegex(ValueError, "无法确认画面"):
            self.video_content(self.path, 0, 4)

    def test_video_starting_halfway_into_first_bucket_does_not_invent_frame(self):
        make_fixture(self.path, [(0.5, 32), (0.6, 80), (0.7, 128)], video_rate=10)
        with self.assertRaisesRegex(ValueError, "无法确认画面"):
            self.video_content(self.path, 0, 0.7)

    def test_audio_after_video_end_does_not_extend_last_picture(self):
        make_fixture(self.path, [(0, 32), (1, 128)])
        with self.assertRaisesRegex(ValueError, "无法确认画面"):
            self.video_content(self.path, 0, 4)

    def test_video_ending_inside_final_bucket_is_not_extended(self):
        make_fixture(self.path, [(0, 32), (1, 128)], video_rate=10)
        with self.assertRaisesRegex(ValueError, "无法确认画面"):
            self.video_content(self.path, 0, 1.9)

    def test_exact_end_accepts_fractional_rounding(self):
        make_fixture(self.path, [(0, 32), (0.1, 80), (0.2, 128)], video_rate=10)
        content, has_audio = self.video_content(self.path, 0.1, 0.2)
        pixels, audio = pixels_and_audio(content)
        self.assertTrue(has_audio)
        self.assert_pixels(pixels, [80])
        self.assertEqual([len(item) for item in audio], [3200])

    def test_exact_end_with_nonzero_video_start(self):
        make_fixture(self.path, [(0.5, 32), (0.6, 80), (0.7, 128)], video_rate=10)
        content, has_audio = self.video_content(self.path, 0.6, 0.2)
        pixels, audio = pixels_and_audio(content)
        self.assertTrue(has_audio)
        self.assert_pixels(pixels, [80])
        self.assertEqual([len(item) for item in audio], [3200])

    def test_audio_only_window_seeks_on_audio_track(self):
        make_fixture(self.path, [(0.5, 32), (0.6, 80), (0.7, 128)], video_rate=10)
        audio = load_content("_audio_content")(self.path, 0.6, 0.2)
        self.assertEqual(len(audio), 3200)
        self.assertAlmostEqual(float(np.mean(audio)), 0.1, places=3)

    def test_exact_end_with_2997_fps(self):
        frames = [(index * 1001 / 30000, 32 + index) for index in range(30)]
        make_fixture(self.path, frames, video_rate=Fraction(30000, 1001))
        content, has_audio = self.video_content(self.path, 0.1, 0.901)
        pixels, audio = pixels_and_audio(content)
        self.assertTrue(has_audio)
        self.assertEqual(len(pixels), 1)
        self.assertEqual([len(item) for item in audio], [14416])

    def test_empty_audio_window_is_not_reported_as_decoded_silence(self):
        make_fixture(self.path, [(0, 32), (1, 80), (2, 128), (3, 224)], audio_start=3)
        with self.assertRaisesRegex(ValueError, "没有实际音频数据"):
            self.video_content(self.path, 0, 2)

    def test_decoded_silence_is_valid_audio(self):
        make_fixture(self.path, [(0, 32), (1, 80), (2, 128), (3, 224)], amplitudes=(0, 0, 0, 0))
        content, has_audio = self.video_content(self.path, 0, 4)
        _, audio = pixels_and_audio(content)
        self.assertTrue(has_audio)
        self.assertEqual([len(item) for item in audio], [16000] * 4)
        self.assertTrue(all(not np.any(item) for item in audio))


if __name__ == "__main__":
    unittest.main()
