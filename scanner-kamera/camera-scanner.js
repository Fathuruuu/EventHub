/**
 * EventHub Pro - Scanner Kamera & Anti-Spam Single-Scan Validator
 * Mengakses kamera perangkat via WebRTC, mendeteksi QR code frame-by-frame,
 * dan mengunci pemindaian agar notifikasi hasil scan HANYA muncul 1 KALI (tidak berulang-ulang).
 */
(function(window) {
  'use strict';

  var activeStream = null;
  var scanLoopId = null;
  var offscreenCanvas = null;
  var offscreenCtx = null;
  var lastScannedCode = null;
  var isScanning = false;
  var isPaused = false;
  var autoResumeTimeout = null;

  var ScannerService = {
    isRunning: function() {
      return !!(activeStream && activeStream.active);
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

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (onErrorCallback) onErrorCallback('Browser ini tidak mendukung akses kamera (WebRTC).');
        return false;
      }

      var constraints = {
        audio: false,
        video: preferredDeviceId
          ? { deviceId: { exact: preferredDeviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      try {
        var stream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = stream;
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', 'true');
        await videoElement.play();

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
          await videoElement.play();

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
      lastScannedCode = null;
      clearTimeout(autoResumeTimeout);
      autoResumeTimeout = null;
      if (scanLoopId) {
        cancelAnimationFrame(scanLoopId);
        scanLoopId = null;
      }
      if (activeStream) {
        activeStream.getTracks().forEach(function(track) {
          try { track.stop(); } catch (e) {}
        });
        activeStream = null;
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
    },

    runScanLoop: function(videoElement, onScanCallback) {
      var self = this;

      if (!offscreenCanvas) {
        offscreenCanvas = document.createElement('canvas');
        offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
      }

      var hasBarcodeDetector = typeof window.BarcodeDetector !== 'undefined';
      var barcodeDetector = hasBarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;

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

          // 3. KUNCI PEMINDAIAN: Hanya proses 1 KALI saat kode terdeteksi!
          if (detectedCode && detectedCode !== lastScannedCode) {
            // LANGSUNG KUNCI scanner agar tidak looping notifikasi berkali-kali!
            self.pause();
            lastScannedCode = detectedCode;

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
