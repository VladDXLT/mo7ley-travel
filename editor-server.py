#!/usr/bin/env python3
"""
MO7LEY Travel — local site + editor server.

Serves this folder at http://localhost:8080 and gives the page editor
somewhere to save:

  site-edits.js     your text / style / image / video changes
  assets/uploads/   every image and video you upload
  .edit-backups/    automatic safety copies of site-edits.js

Only listens on your own computer (127.0.0.1). Stop it with Ctrl+C or by
closing the Terminal window.
"""
import json, os, re, shutil, sys, threading, time, webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)
EDITS = os.path.join(ROOT, "site-edits.js")
UPLOADS = os.path.join(ROOT, "assets", "uploads")
BACKUPS = os.path.join(ROOT, ".edit-backups")
ALLOWED = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".mp4", ".mov", ".m4v", ".webm"}
VIDEO = {".mp4", ".mov", ".m4v", ".webm"}
MAX_UPLOAD = 2 * 1024 ** 3
LOCK = threading.Lock()
PORT = 8080
_last_backup = 0.0


def load_edits():
    try:
        txt = open(EDITS, encoding="utf-8").read()
        m = re.search(r"window\.MO7_EDITS\s*=\s*(\{.*\})\s*;?\s*$", txt, re.S)
        d = json.loads(m.group(1))
        d.setdefault("pages", {})
        return d
    except Exception:
        return {"version": 1, "pages": {}}


def write_edits(d):
    global _last_backup
    os.makedirs(BACKUPS, exist_ok=True)
    if os.path.exists(EDITS) and time.time() - _last_backup > 30:
        shutil.copy2(EDITS, os.path.join(BACKUPS, "site-edits-%d.js" % int(time.time() * 1000)))
        _last_backup = time.time()
        old = sorted(os.listdir(BACKUPS))
        for f in old[:-40]:
            try:
                os.remove(os.path.join(BACKUPS, f))
            except OSError:
                pass
    tmp = EDITS + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        fh.write("/* Saved by the MO7LEY page editor — safe to commit. */\n")
        fh.write("window.MO7_EDITS = " + json.dumps(d, indent=1, ensure_ascii=False) + ";\n")
    os.replace(tmp, EDITS)


def safe_name(raw):
    base = os.path.basename(raw or "file").replace("\\", "/").split("/")[-1]
    stem, ext = os.path.splitext(base)
    ext = ext.lower()
    stem = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip("-.") or "file"
    return stem[:80], ext


class Handler(SimpleHTTPRequestHandler):
    server_version = "MO7LEY"

    def log_message(self, fmt, *args):
        if args and "/__api/" in str(args[0]):
            return
        sys.stderr.write("  %s\n" % (fmt % args))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # ---------- helpers ----------
    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _trusted(self):
        if self.headers.get("X-MO7-Editor") != "1":
            return False
        origin = self.headers.get("Origin")
        return origin is None or origin in ("http://localhost:%d" % PORT, "http://127.0.0.1:%d" % PORT)

    # ---------- GET (adds Range support so videos play and loop) ----------
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/__api/ping":
            return self._json(200, {"ok": True}) if self._trusted() else self._json(403, {"ok": False})
        if path == "/__api/uploads":
            if not self._trusted():
                return self._json(403, {"ok": False})
            items = []
            if os.path.isdir(UPLOADS):
                for f in os.listdir(UPLOADS):
                    ext = os.path.splitext(f)[1].lower()
                    if ext in ALLOWED:
                        p = os.path.join(UPLOADS, f)
                        items.append({"name": f, "src": "assets/uploads/" + f,
                                      "type": "video" if ext in VIDEO else "image",
                                      "size": os.path.getsize(p), "m": os.path.getmtime(p)})
            items.sort(key=lambda i: -i["m"])
            return self._json(200, items)
        return self._static()

    def _static(self):
        fs = self.translate_path(self.path)
        if not os.path.isfile(fs):
            return super().do_GET()
        size = os.path.getsize(fs)
        start, end, code = 0, size - 1, 200
        rng = self.headers.get("Range")
        if rng:
            m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
            if m and (m.group(1) or m.group(2)):
                if m.group(1):
                    start = int(m.group(1))
                    end = int(m.group(2)) if m.group(2) else size - 1
                else:
                    start = max(0, size - int(m.group(2)))
                end = min(end, size - 1)
                if start > end:
                    self.send_response(416)
                    self.send_header("Content-Range", "bytes */%d" % size)
                    self.end_headers()
                    return
                code = 206
        self.send_response(code)
        self.send_header("Content-Type", self.guess_type(fs))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(end - start + 1))
        if code == 206:
            self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.end_headers()
        try:
            with open(fs, "rb") as fh:
                fh.seek(start)
                left = end - start + 1
                while left > 0:
                    chunk = fh.read(min(1 << 20, left))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    left -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass

    # ---------- POST: save + upload ----------
    def do_POST(self):
        u = urlparse(self.path)
        if not self._trusted():
            return self._json(403, {"ok": False, "error": "forbidden"})
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0

        if u.path == "/__api/save":
            if length <= 0 or length > 20 * 1024 * 1024:
                return self._json(400, {"ok": False})
            try:
                req = json.loads(self.rfile.read(length).decode("utf-8"))
                page, entries = req["page"], req["entries"]
                if not (page == "_shared" or re.match(r"^[\w\-./]+\.html$", page)) or ".." in page:
                    raise ValueError("bad page")
                if not isinstance(entries, dict):
                    raise ValueError("bad entries")
            except Exception:
                return self._json(400, {"ok": False})
            with LOCK:
                d = load_edits()
                if entries:
                    d["pages"][page] = entries
                else:
                    d["pages"].pop(page, None)
                write_edits(d)
            return self._json(200, {"ok": True})

        if u.path == "/__api/upload":
            if length <= 0 or length > MAX_UPLOAD:
                return self._json(413, {"ok": False, "error": "too big"})
            stem, ext = safe_name(parse_qs(u.query).get("name", ["file"])[0])
            if ext not in ALLOWED:
                return self._json(415, {"ok": False, "error": "type not allowed"})
            os.makedirs(UPLOADS, exist_ok=True)
            with LOCK:
                name, n = stem + ext, 1
                while os.path.exists(os.path.join(UPLOADS, name)):
                    name = "%s-%d%s" % (stem, n, ext)
                    n += 1
                dest = os.path.join(UPLOADS, name)
                tmp = dest + ".part"
                try:
                    left = length
                    with open(tmp, "wb") as fh:
                        while left > 0:
                            chunk = self.rfile.read(min(1 << 20, left))
                            if not chunk:
                                raise IOError("short upload")
                            fh.write(chunk)
                            left -= len(chunk)
                    os.replace(tmp, dest)
                except Exception:
                    if os.path.exists(tmp):
                        os.remove(tmp)
                    return self._json(500, {"ok": False})
            return self._json(200, {"ok": True, "name": name, "src": "assets/uploads/" + name,
                                    "type": "video" if ext in VIDEO else "image", "size": length})

        self._json(404, {"ok": False})


def main():
    global PORT
    for p in range(8080, 8091):
        try:
            srv = ThreadingHTTPServer(("127.0.0.1", p), Handler)
            PORT = p
            break
        except OSError:
            continue
    else:
        sys.exit("Couldn't find a free port between 8080 and 8090.")
    url = "http://localhost:%d/index.html" % PORT
    print("\n  MO7LEY Travel is running at %s" % url)
    print("  Click  ✏️ Edit page  (bottom right) to change text, images and videos.")
    print("  Everything saves automatically. Close this window to stop.\n")
    if "--no-open" not in sys.argv:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
