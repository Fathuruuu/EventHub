/**
 * EventHub Pro - Scanner Kamera & Anti-Spam Single-Scan Validator
 * Mengakses kamera perangkat via WebRTC, mendeteksi QR code frame-by-frame,
 * dan mengunci pemindaian agar notifikasi hasil scan HANYA muncul 1 KALI (tidak berulang-ulang).
 */
(function(window) {
  var activeStream = null;
  var scanLoopId = null;
  var offscreenCanvas = null;
  var offscreenCtx = null;
  var lastScannedCode = null;
  var isScanning = false;
  var isPaused = false;
  var autoResumeTimeout = null;
  var currentVideoElement = null;
  var currentFacingMode = 'environment';
  var isTorchOn = false;
  var lastScanCallback = null;
  var lastErrorCallback = null;
  var ScannerService = {
    isRunning: function() {
      return !!(activeStream && activeStream.active && activeStream.getVideoTracks().some(function(t) { return t.readyState === 'live'; }));
    },

    isPaused: function() {
      return isPaused;
    },
    /**
     * Mengunci scanner sementara saat QR terdeteksi agar tidak spam notifikasi
     */
    pause: function() {
      isPaused = true;
    },

    /**
     * Membuka kunci scanner untuk memindai tiket peserta berikutnya
     */
    resume: function() {
      isPaused = false;
      lastScannedCode = null;
      clearTimeout(autoResumeTimeout);
      autoResumeTimeout = null;
    },

    getFacingMode: function() {
      return currentFacingMode;
    },

    flipCamera: async function(videoElement, onScanCallback, onErrorCallback) {
      currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
      var targetEl = videoElement || currentVideoElement;
      var cbScan = onScanCallback || lastScanCallback;
      var cbErr = onErrorCallback || lastErrorCallback;
      if (targetEl) {
        return await this.startCamera(targetEl, cbScan, cbErr);
      }
      return false;
    },

    hasTorch: function() {
      if (!activeStream) return false;
      var track = activeStream.getVideoTracks()[0];
      if (!track || !track.getCapabilities) return false;
      try {
        var capabilities = track.getCapabilities();
        return !!(capabilities && capabilities.torch);
      } catch (e) {
        return false;
      }
    },

    isTorchActive: function() {
      return isTorchOn;
    },

    toggleTorch: async function() {
      if (!activeStream) return false;
      var track = activeStream.getVideoTracks()[0];
      if (!track) return false;
      try {
        isTorchOn = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: isTorchOn }]
        });
        return isTorchOn;
      } catch (e) {
        console.warn('Torch constraint warning:', e);
        isTorchOn = false;
        return false;
      }
    },
    getAvailableCameras: async function() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      try {
        var devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(function(d) { return d.kind === 'videoinput'; });
      } catch (e) {
        console.warn('Gagal membaca daftar kamera:', e);
        return [];
      }
    },

    startCamera: async function(videoElement, onScanCallback, onErrorCallback, preferredDeviceId) {
      this.stopCamera();

      // Resolve video element if passed as ID string or selector
      if (typeof videoElement === 'string') {
        videoElement = document.getElementById(videoElement.replace(/^#/, '')) || document.querySelector(videoElement);
      }
      if (!videoElement) {
        if (onErrorCallback) onErrorCallback('Elemen video kamera tidak ditemukan.');
        return false;
      }
      currentVideoElement = videoElement;
      lastScanCallback = onScanCallback;
      lastErrorCallback = onErrorCallback;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (onErrorCallback) onErrorCallback('Browser ini tidak mendukung akses kamera (WebRTC).');
        return false;
      }

      var constraints = {
        audio: false,
        video: preferredDeviceId
          ? { deviceId: { exact: preferredDeviceId } }
          : { facingMode: { ideal: currentFacingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      try {
        var stream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = stream;
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('webkit-playsinline', 'true');
        videoElement.setAttribute('autoplay', 'true');
        videoElement.muted = true;
        videoElement.style.display = 'block';
        try {
          var p = videoElement.play();
          if (p && typeof p.catch === 'function') {
            p.catch(function(playErr) { console.warn('Autoplay warning:', playErr); });
          }
        } catch (playErr) {
          console.warn('Autoplay warning:', playErr);
        }

        isScanning = true;
        isPaused = false;
        lastScannedCode = null;
        this.runScanLoop(videoElement, onScanCallback);
        return true;
      } catch (err) {
        console.warn('Camera access error, mencoba fallback:', err);
        try {
          var fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          activeStream = fallbackStream;
          videoElement.srcObject = fallbackStream;
          videoElement.setAttribute('playsinline', 'true');
          videoElement.setAttribute('webkit-playsinline', 'true');
          videoElement.setAttribute('autoplay', 'true');
          videoElement.muted = true;
          videoElement.style.display = 'block';
          try {
            var fallbackP = videoElement.play();
            if (fallbackP && typeof fallbackP.catch === 'function') {
              fallbackP.catch(function(playErr) { console.warn('Fallback autoplay warning:', playErr); });
            }
          } catch (playErr) {
            console.warn('Fallback autoplay warning:', playErr);
          }

          isScanning = true;
          isPaused = false;
          lastScannedCode = null;
          this.runScanLoop(videoElement, onScanCallback);
          return true;
        } catch (e2) {
          if (onErrorCallback) onErrorCallback(this.formatCameraError(e2));
          return false;
        }
      }
    },

    stopCamera: function(videoElement) {
      isScanning = false;
      isPaused = false;
      isTorchOn = false;
      lastScannedCode = null;
      clearTimeout(autoResumeTimeout);
      autoResumeTimeout = null;
      if (scanLoopId) {
        cancelAnimationFrame(scanLoopId);
        scanLoopId = null;
      }
      if (activeStream) {
        activeStream.getTracks().forEach(function(track) {
          try {
            track.stop();
            track.enabled = false;
          } catch (e) {}
        });
        activeStream = null;
      }
      if (typeof videoElement === 'string') {
        videoElement = document.getElementById(videoElement.replace(/^#/, '')) || document.querySelector(videoElement);
      }
      var targetEl = videoElement || currentVideoElement;
      if (targetEl) {
        try {
          targetEl.pause();
          targetEl.srcObject = null;
        } catch (e) {}
      }
      currentVideoElement = null;

      // Pastikan seluruh elemen video scanner yang ada dibersihkan dan dihentikan
      ['quick-scanner-video', 'organizer-video', 'admin-video'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el && el.srcObject) {
          try {
            el.pause();
            el.srcObject = null;
          } catch (e) {}
        }
      });
    },

    runScanLoop: function(videoElement, onScanCallback) {
      var self = this;

      if (!offscreenCanvas) {
        offscreenCanvas = document.createElement('canvas');
        offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
      }

      var barcodeDetector = null;
      if (typeof window.BarcodeDetector !== 'undefined') {
        try {
          barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        } catch (e) {
          barcodeDetector = null;
        }
      }
      async function tick() {
        if (!isScanning) return;

        // Jika sedang pause (setelah deteksi kode), jangan proses frame baru agar tidak spam berkali-kali
        if (isPaused || !videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
          scanLoopId = requestAnimationFrame(tick);
          return;
        }

        var w = videoElement.videoWidth;
        var h = videoElement.videoHeight;

        if (w > 0 && h > 0) {
          var detectedCode = null;

          // 1. Coba deteksi via native BarcodeDetector
          if (barcodeDetector) {
            try {
              var barcodes = await barcodeDetector.detect(videoElement);
              if (barcodes && barcodes.length > 0) {
                detectedCode = barcodes[0].rawValue;
              }
            } catch (e) {}
          }

          // 2. Fallback via jsQR
          if (!detectedCode && typeof window.jsQR === 'function') {
            offscreenCanvas.width = w;
            offscreenCanvas.height = h;
            offscreenCtx.drawImage(videoElement, 0, 0, w, h);
            var imageData = offscreenCtx.getImageData(0, 0, w, h);
            var codeObj = window.jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });
            if (codeObj && codeObj.data) {
              detectedCode = codeObj.data;
            }
          }

          // 3. KUNCI PEMINDAIAN & EFEK BLIP: Hanya proses 1 KALI saat kode terdeteksi!
          if (detectedCode && detectedCode !== lastScannedCode) {
            // LANGSUNG KUNCI scanner agar tidak looping notifikasi berkali-kali!
            self.pause();
            lastScannedCode = detectedCode;

            // EFEK SUARA BLIP DAN GETARAN HAPTIC SCANNER (Android & iOS)
            if (window.EventAudio && typeof window.EventAudio.playBlip === 'function') {
              window.EventAudio.playBlip();
            }
            if (navigator.vibrate) {
              try { navigator.vibrate([45]); } catch (e) {}
            }

            // Panggil fungsi validasi tiket hanya 1 KALI
            if (onScanCallback) {
              onScanCallback(detectedCode);
            }

            // Opsi auto-resume setelah 5 detik jika kode sudah diganti / disingkirkan
            clearTimeout(autoResumeTimeout);
            autoResumeTimeout = setTimeout(function() {
              lastScannedCode = null;
              self.resume();
            }, 5000);
          }
        }

        if (isScanning) {
          scanLoopId = requestAnimationFrame(tick);
        }
      }

      scanLoopId = requestAnimationFrame(tick);
    },

    formatCameraError: function(err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return 'Izin akses kamera ditolak. Silakan izinkan akses kamera di ikon gembok pada address bar peramban.';
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        return 'Perangkat kamera / webcam tidak ditemukan pada komputer/ponsel ini.';
      }
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        return 'Kamera sedang digunakan oleh aplikasi lain (seperti Zoom, Teams, atau tab lain). Tutup aplikasi tersebut lalu coba lagi.';
      }
      return 'Gagal mengakses kamera: ' + (err.message || err.name || 'Terjadi kesalahan');
    }
  };

  window.EventScannerService = ScannerService;
})(window);
